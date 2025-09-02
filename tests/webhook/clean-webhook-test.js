const http = require('http');

console.log('🧹 SAUBERER WEBHOOK TEST - Alle Container/Ports gestoppt');
console.log('🔍 Starte auf Port 3001...');

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url} von ${req.connection.remoteAddress}`);
  
  if (req.method === 'POST' && req.url === '/webhook/ado') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const webhook = JSON.parse(body);
        
        console.log('\n🎯 WEBHOOK EMPFANGEN!');
        console.log('Event Type:', webhook.eventType);
        console.log('Repository:', webhook.resource?.repository?.name);
        
        // Suche nach /edit commands
        if (webhook.resource?.commits) {
          webhook.resource.commits.forEach((commit, index) => {
            console.log(`\n📝 Commit ${index + 1}:`);
            console.log('ID:', commit.commitId);
            console.log('Message:', commit.comment);
            
            const editMatch = commit.comment?.match(/\/edit\s+(.+)/i);
            if (editMatch) {
              console.log('🚀 /EDIT COMMAND GEFUNDEN!');
              console.log('Intent:', editMatch[1]);
              console.log('✅ WEBHOOK FUNKTIONIERT PERFEKT!');
            }
          });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: '✅ Webhook empfangen und verarbeitet',
          timestamp: new Date().toISOString(),
          status: 'success'
        }));
        
      } catch (error) {
        console.error('❌ JSON Parse Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      service: 'webhook-test-server',
      port: 3001,
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', url: req.url }));
  }
});

const PORT = 3001;

server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Server start error:', err);
    process.exit(1);
  }
  console.log(`\n✅ WEBHOOK SERVER LÄUFT!`);
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📍 Webhook: http://localhost:${PORT}/webhook/ado`);
  console.log(`💓 Health: http://localhost:${PORT}/health`);
  console.log(`\n🎯 Bereit für /edit Commands!\n`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} ist belegt - prüfe: netstat -an | findstr :${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutdown...');
  server.close(() => {
    console.log('✅ Server gestoppt');
    process.exit(0);
  });
});

// Health check nach Start
setTimeout(() => {
  const http = require('http');
  const req = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET'
  }, (res) => {
    console.log(`🔍 Self-test: ${res.statusCode} - Server funktioniert!`);
  });
  
  req.on('error', (err) => {
    console.error('❌ Self-test failed:', err.message);
  });
  
  req.end();
}, 500);
