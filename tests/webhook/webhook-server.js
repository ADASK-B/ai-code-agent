/**
 * Azure DevOps Webhook Test Server
 * 
 * Location: tests/webhook/webhook-server.js
 * Purpose: Simulates Gateway service webhook endpoint for testing Azure DevOps integration
 * 
 * Usage:
 *   node tests/webhook/webhook-server.js
 * 
 * Then point Azure DevOps Service Hook to:
 *   https://your-ngrok-url.app/webhook/ado
 */

import http from 'http';

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook/ado') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      console.log('\n🎯 ADO WEBHOOK EMPFANGEN:');
      console.log('==========================');
      
      try {
        const data = JSON.parse(body);
        
        console.log(`Event Type: ${data.eventType}`);
        console.log(`Subscription ID: ${data.subscriptionId}`);
        
        if (data.resource && data.resource.comment) {
          console.log(`Comment: ${data.resource.comment.content}`);
          console.log(`Author: ${data.resource.comment.author.displayName}`);
          console.log(`PR ID: ${data.resource.pullRequest.pullRequestId}`);
          
          // Parse /edit command
          const content = data.resource.comment.content;
          const match = content.match(/^\/edit\s+\/(\d+)\s+(.+)$/i);
          
          if (match) {
            const variants = parseInt(match[1], 10);
            const intent = match[2].trim();
            
            console.log('\n✅ EDIT COMMAND ERKANNT:');
            console.log(`Variants: ${variants}`);
            console.log(`Intent: ${intent}`);
            
            // Simulate orchestrator call
            console.log('\n🚀 WÜRDE ORCHESTRATOR TRIGGERN:');
            console.log(`Organization: ${extractOrgFromUrl(data.resourceContainers.account.baseUrl)}`);
            console.log(`Project: ${data.resource.pullRequest.repository.project.name}`);
            console.log(`Repository: ${data.resource.pullRequest.repository.name}`);
            console.log(`PR ID: ${data.resource.pullRequest.pullRequestId}`);
            console.log(`Comment ID: ${data.resource.comment.id}`);
            
            res.writeHead(202, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: 'Processing started',
              variants: variants,
              intent: intent,
              status: 'accepted'
            }));
          } else {
            console.log('\n❌ KEIN /edit COMMAND ERKANNT');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              message: 'Comment ignored - not an /edit command'
            }));
          }
        } else {
          console.log('\n❌ KEIN COMMENT IM REQUEST');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Not a comment event'
          }));
        }
        
      } catch (error) {
        console.error('Error parsing JSON:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid JSON payload'
        }));
      }
    });
    
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'webhook-test',
      timestamp: new Date().toISOString()
    }));
    
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not found',
      path: req.url,
      method: req.method
    }));
  }
});

function extractOrgFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[0] || 'unknown';
  } catch {
    return 'unknown';
  }
}

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Webhook Test Server running on http://localhost:${PORT}`);
  console.log(`🎯 Webhook URL: http://localhost:${PORT}/webhook/ado`);
  console.log(`🏥 Health URL: http://localhost:${PORT}/health`);
  console.log('\n📊 Waiting for ADO webhooks...');
});
