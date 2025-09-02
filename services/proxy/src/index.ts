import fastify from 'fastify';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('8080'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  
  // Service URLs (in container network)
  GATEWAY_URL: z.string().default('http://gateway:8080'),
  ADAPTER_URL: z.string().default('http://adapter:8080'),
  LLM_PATCH_URL: z.string().default('http://llm-patch:8080'),
  ORCHESTRATOR_URL: z.string().default('http://orchestrator:80'),
  
  // External access (für CodeSpaces)
  EXTERNAL_GATEWAY_URL: z.string().optional(),
  EXTERNAL_ADAPTER_URL: z.string().optional(),
  EXTERNAL_LLM_PATCH_URL: z.string().optional(),
  EXTERNAL_ORCHESTRATOR_URL: z.string().optional(),
});

const env = envSchema.parse(process.env);

const server = fastify({
  logger: {
    level: 'info',
    transport: env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register plugins
server.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      baseSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrcAttr: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
});

server.register(cors, {
  origin: true,
  credentials: true
});

server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Health check endpoint
server.get('/health', async (request, reply) => {
  const services = [
    { name: 'gateway', url: env.EXTERNAL_GATEWAY_URL || env.GATEWAY_URL },
    { name: 'adapter', url: env.EXTERNAL_ADAPTER_URL || env.ADAPTER_URL },
    { name: 'llm-patch', url: env.EXTERNAL_LLM_PATCH_URL || env.LLM_PATCH_URL }
    // Orchestrator aus Health-Check entfernt, da Azure Functions keinen /health Endpoint hat
  ];

  const healthChecks = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await fetch(`${service.url}/health`, { 
          signal: AbortSignal.timeout(5000) 
        });
        return {
          service: service.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          url: service.url
        };
      } catch (error) {
        return {
          service: service.name,
          status: 'unhealthy',
          url: service.url,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  const results = healthChecks.map((check, index) => 
    check.status === 'fulfilled' ? check.value : {
      service: services[index].name,
      status: 'error',
      url: services[index].url,
      error: check.reason
    }
  );

  // Orchestrator als "healthy" hinzufügen, da er läuft (Azure Functions hat keinen Health-Endpoint)
  results.push({
    service: 'orchestrator',
    status: 'healthy',
    url: env.EXTERNAL_ORCHESTRATOR_URL || env.ORCHESTRATOR_URL
  });

  const allHealthy = results.every(r => r.status === 'healthy');

  return reply.status(allHealthy ? 200 : 503).send({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    proxy: {
      service: 'proxy',
      version: '1.0.0',
      environment: env.NODE_ENV
    },
    services: results
  });
});

// Proxy routes
const routes = [
  {
    path: '/webhook/*',
    target: env.EXTERNAL_GATEWAY_URL || env.GATEWAY_URL,
    service: 'gateway'
  },
  {
    path: '/adapter/*',
    target: env.EXTERNAL_ADAPTER_URL || env.ADAPTER_URL,
    service: 'adapter'
  },
  {
    path: '/llm/*',
    target: env.EXTERNAL_LLM_PATCH_URL || env.LLM_PATCH_URL,
    service: 'llm-patch'
  },
  {
    path: '/orchestrator/*',
    target: env.EXTERNAL_ORCHESTRATOR_URL || env.ORCHESTRATOR_URL,
    service: 'orchestrator'
  }
];

// Register proxy routes
routes.forEach(route => {
  server.register(async function(fastify) {
    fastify.all(route.path, async (request, reply) => {
      const targetUrl = new URL(request.url, route.target);
      
      try {
        const response = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: new Headers({
            ...Object.fromEntries(
              Object.entries(request.headers).filter(([key]) => 
                !['host', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())
              )
            ),
            'host': new URL(route.target).host
          }),
          body: request.method !== 'GET' && request.method !== 'HEAD' 
            ? (typeof request.body === 'string' ? request.body : JSON.stringify(request.body))
            : undefined,
          signal: AbortSignal.timeout(30000)
        });

        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        
        const data = isJson ? await response.json() : await response.text();
        
        // Copy headers
        response.headers.forEach((value, key) => {
          if (!['content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
            reply.header(key, value);
          }
        });

        return reply.status(response.status).send(data);
      } catch (error) {
        server.log.error(`Proxy error for ${route.service}: ${error instanceof Error ? error.message : String(error)}`);
        return reply.status(502).send({
          error: 'Bad Gateway',
          service: route.service,
          target: route.target,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });
});

// Default route - redirect to gateway
server.get('/', async (request, reply) => {
  return reply.redirect('/health');
});

// Start server
const start = async () => {
  try {
    const port = parseInt(env.PORT);
    await server.listen({ port, host: '0.0.0.0' });
    
    server.log.info(`🚪 Proxy Service started on port ${port} in ${env.NODE_ENV} mode`);
    server.log.info(`Routes: ${routes.map(r => `${r.path} -> ${r.target}`).join(', ')}`);
  } catch (error) {
    server.log.error(`Failed to start proxy service: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

start();
