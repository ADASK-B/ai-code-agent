const http = require('http');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook/ado') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const webhook = JSON.parse(body);
        
        console.log('\n🎯 WEBHOOK EMPFANGEN:');
        console.log('Event Type:', webhook.eventType);
        console.log('Repository:', webhook.resource?.repository?.name);
        
        // Look for /edit commands in commits
        if (webhook.resource?.commits) {
          webhook.resource.commits.forEach((commit, index) => {
            console.log(`\nCommit ${index + 1}:`);
            console.log('ID:', commit.commitId);
            console.log('Message:', commit.comment);
            
            // Check for /edit command
            const editMatch = commit.comment?.match(/\/edit\s+(.+)/i);
            if (editMatch) {
              console.log('🚀 /EDIT COMMAND GEFUNDEN!');
              console.log('Intent:', editMatch[1]);
            }
          });
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Webhook received and processed',
          timestamp: new Date().toISOString(),
          status: 'success'
        }));
        
      } catch (error) {
        console.error('❌ JSON Parse Error:', error.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3005;
server.listen(PORT, () => {
  console.log(`\n🎯 WEBHOOK TEST SERVER AKTIV`);
  console.log(`Port: ${PORT}`);
  console.log(`Endpoint: http://localhost:${PORT}/webhook/ado`);
  console.log(`\nWarte auf /edit Commands...\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} ist belegt!`);
    console.log('Stoppe anderen Service auf diesem Port.');
  } else {
    console.error('Server Error:', err);
  }
});
