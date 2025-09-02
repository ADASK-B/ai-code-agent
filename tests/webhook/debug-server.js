const http = require('http');

console.log('🚀 Starting simple test server...');

const server = http.createServer((req, res) => {
  console.log(`📨 ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    message: 'Server is working!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  }));
});

const PORT = 3006;

server.listen(PORT, (err) => {
  if (err) {
    console.error('❌ Server start error:', err);
    process.exit(1);
  }
  console.log(`✅ Server listening on port ${PORT}`);
  console.log(`Test: curl http://localhost:${PORT}/test`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

// Test connection after 1 second
setTimeout(() => {
  console.log('🔄 Testing server...');
  const http = require('http');
  
  const req = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/test',
    method: 'GET'
  }, (res) => {
    console.log(`✅ Self-test successful: ${res.statusCode}`);
  });
  
  req.on('error', (err) => {
    console.error('❌ Self-test failed:', err.message);
  });
  
  req.end();
}, 1000);
