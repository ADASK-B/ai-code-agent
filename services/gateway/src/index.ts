import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { adoWebhookHandler } from './handlers/adoWebhook';
import { createLogger } from './lib/logger';
import { env } from './lib/env';
import { register } from './lib/metrics';
import { metricsMiddleware } from './middleware/metrics';

const logger = createLogger();

async function buildApp() {
  const app = Fastify({
    logger: logger as any,
    requestIdLogLabel: 'x-corr-id',
    requestIdHeader: 'x-corr-id',
    genReqId: () => `gw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });

  // Security middleware
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      }
    }
  });

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    credentials: true
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    errorResponseBuilder: (request, context) => ({
      error: 'Rate limit exceeded',
      message: `Maximum ${context.max} requests per ${Math.round((context as any).timeWindow / 1000)}s`,
      statusCode: 429,
      retryAfter: Math.round(context.ttl / 1000)
    })
  });

  // Health check
  app.get('/health', async (request, reply) => {
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'gateway',
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      orchestrator: {
        url: env.ORCHESTRATOR_URL,
        timeout: env.ORCHESTRATOR_TIMEOUT
      }
    };

    return reply.code(200).send(healthCheck);
  });

  // Readiness check (includes external dependencies)
  app.get('/ready', async (request, reply) => {
    try {
      // Test orchestrator connectivity
      const response = await fetch(`${env.ORCHESTRATOR_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Orchestrator health check failed: ${response.status}`);
      }

      return reply.code(200).send({
        status: 'ready',
        timestamp: new Date().toISOString(),
        dependencies: {
          orchestrator: 'ok'
        }
      });
    } catch (error) {
      request.log.error(error, 'Readiness check failed');
      return reply.code(503).send({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ADO Webhook endpoint
  app.post('/webhook/ado', adoWebhookHandler as any);

  // Prometheus metrics endpoint
  app.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Default route
  app.get('/', async (request, reply) => {
    return {
      service: 'code-agent-gateway',
      version: process.env.npm_package_version || '1.0.0',
      status: 'running',
      endpoints: {
        health: '/health',
        ready: '/ready',
        webhook: '/webhook/ado'
      }
    };
  });

  // Error handling
  app.setErrorHandler(async (error, request, reply) => {
    const correlationId = request.headers['x-corr-id'] || request.id;
    
    request.log.error({
      error: error.message,
      stack: error.stack,
      correlationId,
      url: request.url,
      method: request.method
    }, 'Request error');

    const statusCode = error.statusCode || 500;
    const message = statusCode >= 500 ? 'Internal server error' : error.message;

    return reply.code(statusCode).send({
      error: message,
      statusCode,
      correlationId,
      timestamp: new Date().toISOString()
    });
  });

  // Not found handler
  app.setNotFoundHandler(async (request, reply) => {
    const correlationId = request.headers['x-corr-id'] || request.id;
    
    return reply.code(404).send({
      error: 'Not found',
      statusCode: 404,
      path: request.url,
      method: request.method,
      correlationId,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully`);
      try {
        await app.close();
        process.exit(0);
      } catch (error) {
        app.log.error(error, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Start server
    await app.listen({ 
      port: env.PORT, 
      host: '0.0.0.0' 
    });
    
    app.log.info({
      port: env.PORT,
      environment: env.NODE_ENV,
      orchestrator: env.ORCHESTRATOR_URL
    }, 'Gateway service started');

  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

start();
