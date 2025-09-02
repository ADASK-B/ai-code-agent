const http = require('http');

console.log('🧪 WEBHOOK TEST - Sende /edit Command');

const payload = JSON.stringify({
  "eventType": "git.push", 
  "resource": {
    "repository": {
      "name": "test-repo",
      "project": {
        "name": "TestProject"
      }
    },
    "pushedBy": {
      "displayName": "Test User"
    },
    "commits": [
      {
        "commitId": "abc123",
        "comment": "/edit Fix the authentication bug in login.py - replace the broken password validation with secure bcrypt hashing",
        "changes": [
          {
            "item": {
              "path": "/src/login.py"
            },
            "changeType": "edit"
          }
        ]
      }
    ]
  }
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/webhook/ado',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'X-GitHub-Event': 'push'
  }
};

console.log('📤 Sende Webhook...');
console.log('🎯 Ziel: http://localhost:3001/webhook/ado');
console.log('💾 Payload:', payload.substring(0, 100) + '...');

const req = http.request(options, (res) => {
  console.log(`\n📨 Antwort: ${res.statusCode} ${res.statusMessage}`);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(responseBody);
      console.log('✅ Server Antwort:', response);
      
      if (res.statusCode === 200) {
        console.log('\n🎉 WEBHOOK TEST ERFOLGREICH!');
        console.log('🚀 Der /edit Command wurde erkannt und verarbeitet!');
      } else {
        console.log('\n⚠️  Unerwarteter Status Code');
      }
    } catch (error) {
      console.log('📝 Raw Response:', responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  console.log('🔍 Prüfe ob Server läuft: curl http://localhost:3001/health');
});

req.write(payload);
req.end();

console.log('⏳ Warte auf Antwort...');
