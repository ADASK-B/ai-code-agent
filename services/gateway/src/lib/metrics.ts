import prometheus from 'prom-client';

// Create metrics registry
export const register = new prometheus.Registry();

// Default Node.js metrics (heap, cpu, etc.)
prometheus.collectDefaultMetrics({ register });

// 📊 HTTP Request Metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.01, 0.1, 0.3, 0.5, 1, 2, 5, 10]
});

export const httpRequestCount = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// 🔗 ADO Webhook Metrics
export const adoWebhookCount = new prometheus.Counter({
  name: 'ado_webhooks_total',
  help: 'Total ADO webhooks received',
  labelNames: ['event_type', 'status', 'repository']
});

export const adoWebhookDuration = new prometheus.Histogram({
  name: 'ado_webhook_processing_duration_seconds',
  help: 'Time taken to process ADO webhooks',
  labelNames: ['event_type', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

// 🤖 Orchestrator Communication Metrics
export const orchestratorCallDuration = new prometheus.Histogram({
  name: 'orchestrator_call_duration_seconds',
  help: 'Duration of calls to orchestrator service',
  labelNames: ['endpoint', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});

export const orchestratorCallCount = new prometheus.Counter({
  name: 'orchestrator_calls_total',
  help: 'Total calls to orchestrator service',
  labelNames: ['endpoint', 'status']
});

// 🔐 Security Metrics
export const hmacValidationCount = new prometheus.Counter({
  name: 'hmac_validation_total',
  help: 'HMAC validation attempts',
  labelNames: ['status'] // success, failed, missing
});

export const rateLimitHits = new prometheus.Counter({
  name: 'rate_limit_hits_total',
  help: 'Rate limit hits',
  labelNames: ['client_ip']
});

// 📈 Business Metrics
export const activeConnections = new prometheus.Gauge({
  name: 'gateway_active_connections',
  help: 'Number of active connections to gateway'
});

export const queuedWebhooks = new prometheus.Gauge({
  name: 'gateway_queued_webhooks',
  help: 'Number of webhooks waiting to be processed'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCount);
register.registerMetric(adoWebhookCount);
register.registerMetric(adoWebhookDuration);
register.registerMetric(orchestratorCallDuration);
register.registerMetric(orchestratorCallCount);
register.registerMetric(hmacValidationCount);
register.registerMetric(rateLimitHits);
register.registerMetric(activeConnections);
register.registerMetric(queuedWebhooks);
