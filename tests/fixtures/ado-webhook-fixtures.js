/**
 * Azure DevOps Webhook Fixtures
 * 
 * Sample payloads for testing webhook endpoints
 */

// Sample PR Comment Event from Azure DevOps
export const adoPullRequestCommentEvent = {
  "subscriptionId": "4773c288-7d98-4e5f-9ffd-a6a816853111",
  "notificationId": 168,
  "id": "45f4a060-fa4b-4bf8-a0c0-79229bc27e4c",
  "eventType": "ms.vss-code.git-pullrequest-comment-event",
  "publisherId": "tfs",
  "message": {
    "text": "Arthur-schwan has commented on a pull request",
    "html": "Arthur-schwan has <a href=\"https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=179\">commented</a> on a pull request",
    "markdown": "Arthur-schwan has [commented](https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=179) on a pull request"
  },
  "detailedMessage": {
    "text": "Arthur-schwan has commented on a pull request\r\n/edit /2 Add Hello World to README\r\n",
    "html": "Arthur-schwan has <a href=\"https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=179\">commented</a> on a pull request<p>/edit /2 Add Hello World to README</p>",
    "markdown": "Arthur-schwan has [commented](https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject/pullrequest/3?discussionId=179) on a pull request\r\n/edit /2 Add Hello World to README\r\n"
  },
  "resource": {
    "comment": {
      "id": 1,
      "parentCommentId": 0,
      "author": {
        "displayName": "Arthur-schwan",
        "url": "https://spsprodneu1.vssps.visualstudio.com/Ae6786e42-2e5d-4c68-9687-9e0943d70901/_apis/Identities/7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
        "id": "7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
        "uniqueName": "Arthur-schwan@web.de",
        "imageUrl": "https://dev.azure.com/Arthur-Schwan/_apis/GraphProfile/MemberAvatars/msa.N2E2ZWM5MDEtZjEwNi03ZDgyLTkyZGQtYzNhYmJjNWNmNjBm",
        "descriptor": "msa.N2E2ZWM5MDEtZjEwNi03ZDgyLTkyZGQtYzNhYmJjNWNmNjBm"
      },
      "content": "/edit /2 Add Hello World to README",
      "publishedDate": "2025-09-01T12:57:05.947Z",
      "lastUpdatedDate": "2025-09-01T12:57:05.947Z",
      "lastContentUpdatedDate": "2025-09-01T12:57:05.947Z",
      "commentType": "text",
      "usersLiked": []
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
          "revision": 11,
          "visibility": "private",
          "lastUpdateTime": "2025-08-28T09:59:44.01Z"
        },
        "size": 695981,
        "remoteUrl": "https://Arthur-Schwan@dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject",
        "sshUrl": "git@ssh.dev.azure.com:v3/Arthur-Schwan/AIAgentProject/AIAgentProject",
        "webUrl": "https://dev.azure.com/Arthur-Schwan/AIAgentProject/_git/AIAgentProject",
        "isDisabled": false,
        "isInMaintenance": false
      },
      "pullRequestId": 3,
      "codeReviewId": 3,
      "status": "active",
      "createdBy": {
        "displayName": "Arthur-schwan",
        "url": "https://spsprodneu1.vssps.visualstudio.com/Ae6786e42-2e5d-4c68-9687-9e0943d70901/_apis/Identities/7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
        "id": "7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
        "uniqueName": "Arthur-schwan@web.de",
        "imageUrl": "https://dev.azure.com/Arthur-Schwan/_api/_common/identityImage?id=7a6ec901-f106-6d82-92dd-c3abbc5cf60f",
        "descriptor": "msa.N2E2ZWM5MDEtZjEwNi03ZDgyLTkyZGQtYzNhYmJjNWNmNjBm"
      },
      "creationDate": "2025-08-31T05:03:52.6385492Z",
      "title": "Updated README.md",
      "description": "Updated README.md",
      "sourceRefName": "refs/heads/Test/AIAIAGENT",
      "targetRefName": "refs/heads/main",
      "mergeStatus": "succeeded",
      "isDraft": false,
      "mergeId": "0240af9e-253c-4adb-a26e-5ce8df19619b"
    }
  },
  "resourceVersion": "2.0",
  "resourceContainers": {
    "collection": {
      "id": "73666a07-97a4-49b9-a753-3a9054add6c4",
      "baseUrl": "https://dev.azure.com/Arthur-Schwan/"
    },
    "account": {
      "id": "e6786e42-2e5d-4c68-9687-9e0943d70901",
      "baseUrl": "https://dev.azure.com/Arthur-Schwan/"
    },
    "project": {
      "id": "0fb7eda7-55bc-424b-80fc-5e48a4165513",
      "baseUrl": "https://dev.azure.com/Arthur-Schwan/"
    }
  },
  "createdDate": "2025-09-01T12:57:13.0241485Z"
};

// Sample edit commands for testing
export const editCommands = {
  valid: [
    "/edit /1 Add dark mode theme",
    "/edit /2 Fix responsive layout issues",
    "/edit /3 Update button colors to red",
    "/edit /5 Add user authentication",
    "/edit /1 Optimize database queries"
  ],
  invalid: [
    "/edit Add something",           // Missing variant count
    "/edit /0 Invalid count",        // Zero variants
    "/edit /11 Too many variants",   // Too many variants
    "/edit /2 Hi",                   // Intent too short
    "/edit /2 " + "x".repeat(201),   // Intent too long
    "edit /2 Missing slash",         // Missing leading slash
    "/edit 2 Missing slash",         // Missing variant slash
    "/EDIT /2 Wrong case"            // Wrong case (should still work)
  ]
};

// Sample orchestrator payloads
export const orchestratorPayloads = {
  valid: {
    repoUrn: "ado:Arthur-Schwan:AIAgentProject:AIAgentProject",
    prId: 3,
    commentId: 1,
    sourceRef: "refs/heads/Test/AIAIAGENT",
    targetRef: "refs/heads/main",
    actor: "Arthur-schwan@web.de",
    intent: "Add Hello World to README",
    variantsRequested: 2,
    correlationId: "test-1725196633000",
    idempotencyKey: "3-1"
  }
};

// Mock service responses
export const mockResponses = {
  gateway: {
    health: {
      status: "ok",
      service: "gateway",
      timestamp: "2025-09-01T12:00:00.000Z",
      version: "1.0.0",
      environment: "development"
    }
  },
  orchestrator: {
    success: {
      jobId: "job-123",
      status: "started",
      variantsRequested: 2,
      estimatedDuration: "30s"
    }
  },
  adapter: {
    branchCreated: {
      branchName: "agents/edit-job-123-variant-1",
      commitId: "abc123def456"
    }
  },
  llmPatch: {
    success: {
      patch: "diff --git a/README.md b/README.md\n...",
      explanation: "Added Hello World section to README",
      confidence: 0.95
    }
  }
};
