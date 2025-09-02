const https = require('https');

console.log('🌐 TESTE NGROK TUNNEL');
console.log('URL: https://6dcf9e9b6908.ngrok-free.app/health');

const options = {
  hostname: '6dcf9e9b6908.ngrok-free.app',
  port: 443,
  path: '/health',
  method: 'GET',
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
};

const req = https.request(options, (res) => {
  console.log(`📨 Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('📋 Headers:', res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('✅ Response:', data);
      
      if (res.statusCode === 200) {
        console.log('\n🎉 NGROK TUNNEL FUNKTIONIERT!');
        console.log('🚀 Webhook URL bereit für Azure DevOps/GitHub!');
        console.log(`📍 Webhook: https://6dcf9e9b6908.ngrok-free.app/webhook/ado`);
      }
    } catch (error) {
      console.log('📝 Raw body:', body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.end();
