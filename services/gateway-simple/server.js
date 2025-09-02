const express = require('express');
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'code-agent-gateway',
    version: '1.0.0',
    mode: 'local-stub'
  });
});

// Webhook endpoint (stub implementation)
app.post('/gateway/webhook/ado', (req, res) => {
  console.log('📧 Received ADO webhook:', {
    eventType: req.body?.eventType || 'unknown',
    resourceType: req.body?.resource?.id || 'unknown',
    timestamp: new Date().toISOString()
  });

  // Stub response for local testing
  res.json({
    received: true,
    timestamp: new Date().toISOString(),
    message: 'Webhook received successfully (stub mode)',
    nextSteps: [
      'In production, this would trigger the orchestrator',
      'For now, this is just a local stub for testing'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Code Agent Gateway',
    version: '1.0.0',
    mode: 'local-development',
    endpoints: {
      health: '/health',
      webhook: '/gateway/webhook/ado'
    },
    instructions: {
      webhook_url: `http://localhost:${port}/gateway/webhook/ado`,
      ngrok_note: 'Use ngrok to expose this for Azure DevOps webhooks'
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Code Agent Gateway running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Webhook endpoint: http://localhost:${port}/gateway/webhook/ado`);
  console.log(`💡 For ADO webhooks, use ngrok to expose this URL`);
});
