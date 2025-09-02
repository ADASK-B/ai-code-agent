#!/usr/bin/env node

/**
 * VOLLSTÄNDIGER SYSTEM TEST
 * Simuliert echte ADO Webhooks und testet komplette AI-Coding Pipeline
 */

const axios = require('axios');

// Echtes ADO Webhook Format (wie von dir gezeigt)
const createAdoWebhook = (readmeNumber, command) => ({
    "subscriptionId": "82dacfbe-1c26-4ed1-b6fc-107ca43979ec",
    "notificationId": Math.floor(Math.random() * 1000),
    "id": `test-${Date.now()}`,
    "eventType": "ms.vss-code.git-pullrequest-comment-event",
    "publisherId": "tfs",
    "message": {
        "text": `Arthur-schwan has commented on a pull request`,
        "html": `Arthur-schwan has <a href="https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=247">commented</a> on a pull request`,
        "markdown": `Arthur-schwan has [commented](https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=247) on a pull request`
    },
    "detailedMessage": {
        "text": `Arthur-schwan has commented on a pull request\r\n${command}\n\r\n`,
        "html": `Arthur-schwan has <a href="https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=247">commented</a> on a pull request<p>${command}\n</p>`,
        "markdown": `Arthur-schwan has [commented](https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=247) on a pull request\r\n${command}\n\r\n`
    },
    "resource": {
        "comment": {
            "id": Math.floor(Math.random() * 1000),
            "parentCommentId": 0,
            "author": {
                "displayName": "Arthur-schwan",
                "url": "https://spsprodneu1.vssps.visualstudio.com/Ae6786e42-2e5d-4c68-9687-9e0943d70901/_apis/Identities/7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
                "id": "7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
                "uniqueName": "Arthur-schwan@web.de"
            },
            "content": `${command}\n`,
            "publishedDate": new Date().toISOString()
        },
        "pullRequest": {
            "repository": {
                "id": "460c2aab-d785-43d8-b496-19bed82d8d69",
                "name": "AIAgentProject",
                "url": "https://dev.azure.com/Arthur-Schwan/0fb7eda7-55bc-424b-80fc-5e48a4165513/_apis/git/repositories/460c2aab-d785-43d8-b496-19bed82d8d69",
                "project": {
                    "id": "0fb7eda7-55bc-424b-80fc-5e48a4165513",
                    "name": "AIAgentProject",
                    "url": "https://dev.azure.com/Arthur-Schwan/_apis/projects/0fb7eda7-55bc-424b-80fc-5e48a4165513",
                    "state": "wellFormed",
                    "visibility": "private"
                },
                "remoteUrl": "https://Arthur-Schwan@dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject"
            },
            "pullRequestId": 3,
            "status": "active",
            "title": `Updated README.md ${readmeNumber}`,
            "sourceRefName": "refs/heads/Test/AIAIAGENT",
            "targetRefName": "refs/heads/main"
        }
    },
    "resourceContainers": {
        "collection": {
            "id": "73666a07-97a4-49b9-a753-3a9054add6c4",
            "baseUrl": "https://dev.azure.com/Arthur-Schwan/"
        },
        "project": {
            "id": "0fb7eda7-55bc-424b-80fc-5e48a4165513",
            "baseUrl": "https://dev.azure.com/Arthur-Schwan/"
        }
    },
    "createdDate": new Date().toISOString()
});

async function testSystem() {
    console.log('\n🎯 VOLLSTÄNDIGER AI-CODING SYSTEM TEST');
    console.log('=====================================');
    
    const baseUrl = 'http://localhost';
    const testCases = [
        {
            name: 'Simple README Update',
            command: '@AICodingAgent /edit /1 Add Hello World to README50',
            expectedAction: 'Branch creation + PR + README update'
        },
        {
            name: 'Bug Fix Request',
            command: '@AICodingAgent /edit /2 Fix the null pointer exception in UserService.js line 42',
            expectedAction: 'Code analysis + bug fix + branch + PR'
        },
        {
            name: 'Feature Addition',
            command: '@AICodingAgent /edit /3 Add user authentication endpoint to the API',
            expectedAction: 'New endpoint creation + tests + documentation'
        }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 Test ${i+1}: ${testCase.name}`);
        console.log(`Command: ${testCase.command}`);
        console.log(`Expected: ${testCase.expectedAction}`);
        
        try {
            const webhook = createAdoWebhook(50 + i, testCase.command);
            
            console.log('🚀 Sending ADO webhook...');
            const response = await axios.post(`${baseUrl}/webhook/ado`, webhook, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000
            });
            
            console.log(`✅ Response: ${response.status}`);
            if (response.data) {
                console.log(`📄 Data:`, JSON.stringify(response.data, null, 2));
            }
            
            // Warte zwischen Tests
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`Status: ${error.response.status}`);
                console.log(`Data:`, error.response.data);
            }
        }
    }
    
    console.log('\n🏁 Test Complete!');
    console.log('\nÜberprüfe die Logs für:');
    console.log('- Gateway: Webhook parsing');
    console.log('- Orchestrator: Workflow execution');
    console.log('- LLM-Patch: AI code generation');
    console.log('- Adapter: Branch + PR creation');
}

if (require.main === module) {
    testSystem().catch(console.error);
}

module.exports = { testSystem, createAdoWebhook };
