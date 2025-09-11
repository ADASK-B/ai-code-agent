# API Reference

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready

## 🌐 Gateway API (Port 3001)

### Health Endpoints

#### GET /health
Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-11T10:30:00Z",
  "version": "1.0.0"
}
```

#### GET /ready
Checks readiness including downstream services.

**Response:**
```json
{
  "status": "ready",
  "dependencies": {
    "orchestrator": "healthy",
    "adapter": "healthy",
    "llm-patch": "healthy"
  }
}
```

### Webhook Endpoints

#### POST /webhook/ado
Azure DevOps webhook receiver for PR events.

**Headers:**
- `Content-Type: application/json`
- `x-vss-signature: <signature>` (optional, for verification)

**Request Body:**
```json
{
  "eventType": "git.pullrequest.created",
  "resource": {
    "pullRequestId": 123,
    "title": "Feature implementation",
    "description": "@User /edit /3 Add error handling to the auth service",
    "sourceRefName": "refs/heads/feature-branch",
    "targetRefName": "refs/heads/main",
    "repository": {
      "name": "my-repo",
      "project": {
        "name": "MyProject"
      }
    }
  }
}
```

**Response:**
```json
{
  "status": "accepted",
  "correlationId": "gw-20250911-abc123",
  "message": "Webhook processed successfully"
}
```

### Metrics Endpoint

#### GET /metrics
Prometheus metrics in text format.

**Response:**
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 1456

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/health",le="0.1"} 1200
```

## 🔄 Adapter API (Port 3002)

### Azure DevOps Operations

#### POST /ado/create-branch
Creates a new branch in Azure DevOps.

**Request:**
```json
{
  "branchName": "agents/edit-123-1",
  "sourceBranch": "main",
  "correlationId": "adapter-20250911-xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "branchName": "agents/edit-123-1",
  "commitId": "abc123def456"
}
```

#### POST /ado/create-pr
Creates a pull request with generated changes.

**Request:**
```json
{
  "title": "AI Generated: Add error handling - Variant 1",
  "description": "Generated changes based on: Add error handling to the auth service",
  "sourceBranch": "agents/edit-123-1",
  "targetBranch": "main",
  "patch": "diff --git a/src/auth.ts b/src/auth.ts\n...",
  "correlationId": "adapter-20250911-xyz789"
}
```

**Response:**
```json
{
  "success": true,
  "pullRequestId": 124,
  "url": "https://dev.azure.com/org/project/_git/repo/pullrequest/124"
}
```

#### POST /ado/comment
Adds a comment to a pull request.

**Request:**
```json
{
  "pullRequestId": 123,
  "comment": "🤖 **AI Analysis Complete**\n\nGenerated 3 variants for your request...",
  "correlationId": "adapter-20250911-xyz789"
}
```

## 🧠 LLM-Patch API (Port 3003)

### Patch Generation

#### POST /generate-patch
Generates code patches using LLM.

**Request:**
```json
{
  "intent": "Add error handling to the auth service",
  "variantNumber": 1,
  "prMeta": {
    "id": 123,
    "title": "Feature implementation",
    "description": "Initial implementation",
    "files": ["src/auth.ts", "src/utils.ts"]
  },
  "correlationId": "llm-20250911-abc123"
}
```

**Success Response:**
```json
{
  "patch": "diff --git a/src/auth.ts b/src/auth.ts\nindex 1234567..abcdefg 100644\n--- a/src/auth.ts\n+++ b/src/auth.ts\n@@ -10,6 +10,12 @@ export async function authenticate(token: string) {\n   try {\n     const user = await validateToken(token);\n     return user;\n+  } catch (error) {\n+    logger.error('Authentication failed:', error);\n+    throw new AuthenticationError('Invalid token');\n   }\n }",
  "explanation": "Added comprehensive error handling with logging and proper error types.",
  "confidence": 0.85,
  "filesModified": ["src/auth.ts"],
  "style": "conservative"
}
```

**Clarification Response:**
```json
{
  "needsClarification": true,
  "clarificationQuestion": "What type of error handling would you like me to add?",
  "suggestedOptions": [
    "Try-catch blocks with logging",
    "Custom error classes",
    "Retry mechanisms",
    "Validation errors"
  ]
}
```

### Provider Status

#### GET /providers
Lists available LLM providers and their status.

**Response:**
```json
{
  "providers": [
    {
      "name": "ollama",
      "status": "available",
      "model": "llama3.1:8b",
      "url": "http://agent-ollama:11434"
    },
    {
      "name": "claude",
      "status": "configured",
      "model": "claude-3-sonnet"
    },
    {
      "name": "openai",
      "status": "not_configured"
    }
  ],
  "activeProvider": "ollama"
}
```

## ⚡ Orchestrator API (Port 7071)

### Workflow Management

#### POST /orchestrate-edit
Main orchestration endpoint for edit workflows.

**Request:**
```json
{
  "prId": 123,
  "intent": "Add error handling to the auth service",
  "variantCount": 3,
  "adoContext": {
    "organization": "myorg",
    "project": "myproject",
    "repository": "myrepo"
  },
  "correlationId": "orch-20250911-def456"
}
```

**Response:**
```json
{
  "workflowId": "workflow-20250911-ghi789",
  "status": "started",
  "estimatedDuration": "2-5 minutes",
  "variants": [
    {
      "variantNumber": 1,
      "status": "queued",
      "style": "conservative"
    },
    {
      "variantNumber": 2,
      "status": "queued",
      "style": "modern"
    },
    {
      "variantNumber": 3,
      "status": "queued",
      "style": "creative"
    }
  ]
}
```

#### GET /workflow/{workflowId}/status
Gets the current status of a workflow.

**Response:**
```json
{
  "workflowId": "workflow-20250911-ghi789",
  "status": "in_progress",
  "completedVariants": 2,
  "totalVariants": 3,
  "variants": [
    {
      "variantNumber": 1,
      "status": "completed",
      "pullRequestId": 124,
      "confidence": 0.85
    },
    {
      "variantNumber": 2,
      "status": "completed",
      "pullRequestId": 125,
      "confidence": 0.78
    },
    {
      "variantNumber": 3,
      "status": "generating",
      "progress": 60
    }
  ]
}
```

## 📊 Monitoring APIs

### Health Monitor (Port 8888)

#### GET /api/health
Aggregated health status of all services.

**Response:**
```json
{
  "overall": "healthy",
  "services": [
    {
      "name": "gateway",
      "status": "healthy",
      "responseTime": 45,
      "lastChecked": "2025-09-11T10:30:00Z"
    },
    {
      "name": "adapter",
      "status": "healthy",
      "responseTime": 32,
      "lastChecked": "2025-09-11T10:30:00Z"
    }
  ]
}
```

### Prometheus (Port 9090)

#### GET /api/v1/targets
Lists all monitoring targets and their status.

#### GET /api/v1/query
Executes PromQL queries.

**Example:**
```
GET /api/v1/query?query=up{job="gateway"}
```

## 🔗 Load Balancer (Traefik - Port 80)

### Service Routes

All services are accessible through the load balancer:

- `http://gateway.localhost/` → Gateway (3001)
- `http://adapter.localhost/` → Adapter (3002)
- `http://llm-patch.localhost/` → LLM-Patch (3003)
- `http://orchestrator.localhost/` → Orchestrator (7071)

### Dashboard

- `http://localhost:8080` → Traefik dashboard

## 🔒 Authentication & Security

### API Key Authentication (Optional)

For secured endpoints, include API key in headers:

```
Authorization: Bearer <api-key>
X-API-Key: <api-key>
```

### Webhook Security

Azure DevOps webhooks can be verified using signature validation:

```typescript
const signature = request.headers['x-vss-signature'];
const computedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(request.body))
  .digest('base64');
```

## 📝 Error Responses

### Standard Error Format

All APIs return errors in this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request body is invalid",
    "details": {
      "field": "intent",
      "reason": "Field is required"
    },
    "correlationId": "error-20250911-jkl012"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST` (400) - Malformed request
- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `TIMEOUT` (408) - Request timeout
- `RATE_LIMITED` (429) - Too many requests
- `INTERNAL_ERROR` (500) - Server error
- `SERVICE_UNAVAILABLE` (503) - Service temporarily unavailable

## 🧪 Testing APIs

### Using cURL

```bash
# Test gateway health
curl -X GET http://localhost:3001/health

# Test LLM generation
curl -X POST http://localhost:3003/generate-patch \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Add logging to user service",
    "variantNumber": 1,
    "prMeta": {"id": 123, "files": ["src/user.ts"]},
    "correlationId": "test-123"
  }'

# Test webhook (simulate ADO event)
curl -X POST http://localhost:3001/webhook/ado \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "git.pullrequest.created",
    "resource": {
      "pullRequestId": 123,
      "description": "@User /edit /2 Add error handling"
    }
  }'
```

### Using PowerShell

```powershell
# Test gateway
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET

# Test LLM with body
$body = @{
  intent = "Add logging"
  variantNumber = 1
  prMeta = @{ id = 123; files = @("src/test.ts") }
  correlationId = "test-ps-123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3003/generate-patch" -Method POST -Body $body -ContentType "application/json"
```

---

**Next:** [Usage Examples](usage-examples.md) for practical implementation patterns.
