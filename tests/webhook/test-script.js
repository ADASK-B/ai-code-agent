#!/usr/bin/env node

console.log('\n🧪 WEBHOOK TEST SCRIPT');
console.log('====================\n');

const payload = {
  "subscriptionId": "12345678-1234-1234-1234-123456789012",
  "notificationId": 1,
  "id": "12345678-1234-1234-1234-123456789012", 
  "eventType": "git.pullrequest.updated",  // Comment Event!
  "publisherId": "tfs",
  "message": {
    "text": "/edit Fix the authentication bug in line 42"
  },
  "detailedMessage": {
    "text": "/edit Fix the authentication bug in line 42 - handle null values properly"
  },
  "resource": {
    "repository": {
      "id": "12345678-1234-1234-1234-123456789012",
      "name": "AIForCoding",
      "project": {
        "id": "12345678-1234-1234-1234-123456789012",
        "name": "YourProject"
      }
    },
    "pullRequest": {
      "pullRequestId": 123,
      "title": "Fix authentication bug", 
      "status": "active",
      "repository": {
        "id": "12345678-1234-1234-1234-123456789012",
        "name": "AIForCoding",
        "project": {
          "id": "12345678-1234-1234-1234-123456789012",
          "name": "YourProject"
        }
      }
    }
  },
  "resourceContainers": {
    "collection": {"id": "12345678-1234-1234-1234-123456789012"},
    "account": {"id": "12345678-1234-1234-1234-123456789012"},
    "project": {"id": "12345678-1234-1234-1234-123456789012"}
  },
  "createdDate": new Date().toISOString()
};

console.log('Sending webhook to: http://localhost/webhook/ado');
console.log('Payload preview:', JSON.stringify(payload, null, 2).substring(0, 200) + '...\n');

fetch('http://localhost/webhook/ado', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
})
.catch(err => {
  console.log('❌ Error:', err.message);
});
