// Schneller Webhook Test
const http = require('http');

const payload = JSON.stringify({
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
        "comment": "/edit Fix the bug in utils.py\n\nReplace the broken function with working code.",
        "changes": [
          {
            "item": {
              "path": "/src/utils.py"
            },
            "changeType": "edit"
          }
        ]
      }
    ]
  },
  "eventType": "git.push"
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/webhook/ado',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(payload);
req.end();

console.log('Sending webhook to http://localhost:3005/webhook/ado');
console.log('Payload:', payload);
