# 🚀 AI Code Agent - System Start

## Prerequisites

### Setup Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env and configure at minimum:
# NGROK_AUTHTOKEN=your_ngrok_token_here
# WEBHOOK_SECRET=your_secure_webhook_secret_here
# AZURE_DEVOPS_ORG=your_organization  
# AZURE_DEVOPS_PAT=your_personal_access_token
# OPENAI_API_KEY=your_openai_api_key_here (or other LLM service)
```

**Required Configuration:**
- **NGROK_AUTHTOKEN**: Get from https://dashboard.ngrok.com/get-started/your-authtoken
- **WEBHOOK_SECRET**: Create a secure secret (minimum 16 characters)
- **AZURE_DEVOPS_ORG**: Your Azure DevOps organization name
- **AZURE_DEVOPS_PAT**: Personal Access Token from Azure DevOps (Repos: Read/Write, Pull Requests: Read/Write)

**Optional LLM Configuration (choose one):**
- **OPENAI_API_KEY**: For GPT-4 (recommended)
- **CLAUDE_API_KEY**: For Anthropic Claude
- **AZURE_OPENAI_API_KEY**: For Azure OpenAI service
- **Local Ollama**: No API key needed (runs locally)

## System Startup

### 1. Start All Services
```bash
# In project root directory
docker-compose -f ops/compose/docker-compose.yml --env-file .env up -d --build
```

### 2. Wait for Services to Initialize
```bash
# Wait 30-60 seconds for all containers to fully start
# Some services need time to initialize (especially Ollama and Orchestrator)
echo "Waiting for services to start..."
Start-Sleep -Seconds 45
```

### 3. Complete Health Check
Verify all 11 services are running properly:

```bash
# Check running containers first
docker ps

echo "=== HEALTH CHECK - ALL SERVICES ==="

# === Core Application Services (6) ===
echo "Core Application Services:"
curl -s -o /dev/null -w "✅ Traefik Dashboard: %{http_code}\n" http://localhost:8080 || echo "❌ Traefik: ERROR"
curl -s -o /dev/null -w "✅ Gateway: %{http_code}\n" http://localhost:3001/health || echo "❌ Gateway: ERROR"  
curl -s -o /dev/null -w "✅ Adapter: %{http_code}\n" http://localhost:3002/health || echo "❌ Adapter: ERROR"
curl -s -o /dev/null -w "✅ LLM-Patch: %{http_code}\n" http://localhost:3003/health || echo "❌ LLM-Patch: ERROR"
curl -s -o /dev/null -w "✅ ngrok: %{http_code}\n" http://localhost:4040/api/tunnels || echo "❌ ngrok: ERROR"
curl -s -o /dev/null -w "✅ Ollama: %{http_code}\n" http://localhost:11434/api/version || echo "❌ Ollama: ERROR"
docker logs agent-orchestrator --tail 2 | grep -q "Application started" && echo "✅ Orchestrator: Running" || echo "❌ Orchestrator: Error"

# === Monitoring & Observability (4) ===
echo "Monitoring Services:"
curl -s -o /dev/null -w "✅ Grafana: %{http_code}\n" http://localhost:3000 || echo "❌ Grafana: ERROR"
curl -s -o /dev/null -w "✅ Prometheus: %{http_code}\n" http://localhost:9090 || echo "❌ Prometheus: ERROR"
curl -s -o /dev/null -w "✅ Node Exporter: %{http_code}\n" http://localhost:9100/metrics || echo "❌ Node Exporter: ERROR"
curl -s -o /dev/null -w "✅ cAdvisor: %{http_code}\n" http://localhost:8081/containers/ || echo "❌ cAdvisor: ERROR"

# === Infrastructure & Storage (1) ===
echo "Infrastructure Services:"
docker logs agent-azurite --tail 2 | grep -q "successfully listening" && echo "✅ Azurite: Running" || echo "❌ Azurite: Error"

echo "=== HEALTH CHECK COMPLETE ==="
echo "Expected: 11 services with Status 200 or 'Running'"
echo "If any service shows ERROR, check container logs: docker logs <container-name>"
```

**Service Status Requirements:**
- ✅ **All 11 Services Running (Status 200)** = System ready for Azure DevOps integration
- ⚠️ **1-2 Services with errors** = System may work but check logs
- ❌ **3+ Services with errors** = Fix issues before proceeding

## Service Access Points

### Core Application Services
| Port | Service | Container | Purpose | Status Check |
|------|---------|-----------|---------|--------------|
| 8080 | Traefik Dashboard | agent-traefik | Load Balancer UI & Status | `curl http://localhost:8080` |
| 3001 | Gateway | agent-gateway | API Gateway for Azure DevOps Webhooks | `curl http://localhost:3001/health` |
| 3002 | Adapter | agent-adapter | Azure DevOps Integration (Branch/PR) | `curl http://localhost:3002/health` |
| 3003 | LLM-Patch | agent-llm-patch | Code Generation & Intent Analysis | `curl http://localhost:3003/health` |
| 4040 | ngrok Tunnel | agent-ngrok | External Webhook Access & Traffic Inspector | `curl http://localhost:4040/api/tunnels` + `http://localhost:4040/inspect/http` |
| 11434 | Ollama | agent-local-llm | Local LLM (llama3.1:8b) | `curl http://localhost:11434/api/version` |
| Internal (7071) | Orchestrator | agent-orchestrator | Azure Functions Workflow Orchestration | `docker logs agent-orchestrator --tail 5` |

### Monitoring & Observability
| Port | Service | Container | Purpose | Status Check |
|------|---------|-----------|---------|--------------|
| 3000 | Grafana | agent-grafana | Monitoring Dashboard | `curl http://localhost:3000` |
| 9090 | Prometheus | agent-prometheus | Metrics Collection | `curl http://localhost:9090` |
| 9100 | Node Exporter | agent-node-exporter | System Metrics | `curl http://localhost:9100/metrics` |
| 8081 | cAdvisor | agent-cadvisor | Container Metrics | `curl http://localhost:8081/containers/` |

### Infrastructure & Storage
| Port | Service | Container | Purpose | Status Check |
|------|---------|-----------|---------|--------------|
| 10000-10002 | Azurite | agent-azurite | Azure Storage Emulator | `docker logs agent-azurite --tail 3` |

**Note:** Traefik Proxy (Port 80) gives 404 by design - no default routes configured. Use Dashboard (Port 8080) to verify it's running.

## Azure DevOps Configuration

### Get Webhook URL
1. Open http://localhost:4040
2. Copy the public tunnel URL (e.g., `https://abc123.ngrok-free.app`)
3. Use this URL for Azure DevOps webhook: `https://abc123.ngrok-free.app/webhook/ado`

### Setup Azure DevOps Webhook
1. Go to **Project Settings → Service Hooks**
2. Add **"Pull request commented"** webhook
3. URL: `<your-ngrok-url>/webhook/ado`
4. Secret: From your `.env` file (`WEBHOOK_SECRET`)

## Test the System

Write a comment in any Azure DevOps Pull Request:
```
@YourUsername /edit /1 Add error handling to the login function
```

The agent will:
- ✅ Create a new branch
- ✅ Generate AI-powered code changes
- ✅ Create a Draft Pull Request
- ✅ Post status updates

## Restart Existing System

If containers already exist but are stopped:
```bash
# Start existing containers (includes ngrok!)
docker start agent-gateway agent-adapter agent-llm-patch agent-orchestrator agent-ngrok agent-ollama agent-grafana agent-prometheus agent-cadvisor agent-node-exporter agent-azurite agent-traefik
```

## Stop System
```bash
docker-compose -f ops/compose/docker-compose.yml down
```

---

*System ready for AI-powered code generation! 🎉*
