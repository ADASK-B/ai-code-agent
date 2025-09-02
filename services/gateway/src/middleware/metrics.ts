import { FastifyRequest, FastifyReply } from 'fastify';
import { 
  httpRequestDuration, 
  httpRequestCount, 
  activeConnections,
  rateLimitHits 
} from '../lib/metrics';

export async function metricsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const start = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  // Rate limit tracking
  if (reply.statusCode === 429) {
    rateLimitHits.inc({ 
      client_ip: request.ip || 'unknown' 
    });
  }
  
  // Use request hook instead of reply hook
  request.server.addHook('onResponse', async (req, rep) => {
    if (req.id === request.id) {
      const duration = (Date.now() - start) / 1000;
      const labels = {
        method: request.method,
        route: request.routerPath || request.url || 'unknown',
        status: rep.statusCode.toString()
      };
      
      // Record metrics
      httpRequestDuration.observe(labels, duration);
      httpRequestCount.inc(labels);
      
      // Decrease active connections
      activeConnections.dec();
    }
  });
}
