# 🚀 AI Code Agent - System Start

## Prerequisites

### 1. Setup Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env and configure at minimum:
# NGROK_AUTHTOKEN=your_ngrok_token_here
# WEBHOOK_SECRET=your_secure_webhook_secret_here
```

**Required Configuration:**
- **NGROK_AUTHTOKEN**: Get from https://dashboard.ngrok.com/get-started/your-authtoken
- **WEBHOOK_SECRET**: Create a secure secret (minimum 16 characters)

## Quick Start (1 Command)

### 1. Start All Services
```bash
# In project root directory
docker-compose -f ops/compose/docker-compose.yml --env-file .env up -d --build
```

### 2. Complete Health Check

```bash
# Check all containers are running
docker ps

# === Core Application Services ===
curl http://localhost:80                    # Proxy (Traefik)
curl http://localhost:3001/health           # Gateway  
curl http://localhost:3002/health           # Adapter
curl http://localhost:4040/api/tunnels      # ngrok
curl http://localhost:11434/api/version     # Ollama
docker logs agent-orchestrator --tail 3    # Orchestrator (Azure Functions)
docker logs agent-llm-patch --tail 3       # LLM-Patch

# === Monitoring & Observability ===
curl http://localhost:3000                  # Grafana
curl http://localhost:9090                  # Prometheus
curl http://localhost:9100/metrics          # Node Exporter  
curl http://localhost:8081/containers/      # cAdvisor

# === Infrastructure & Storage ===
curl http://localhost:8080                  # Traefik Dashboard
curl http://localhost:8088/api/version      # Traefik API
docker logs agent-azurite --tail 3         # Azurite

# All services healthy? ✅ System ready!
```

## Service Access Points

### Core Application Services
| Port | Service | Container | Purpose | Status Check |
|------|---------|-----------|---------|--------------|
| 80 | Proxy | agent-traefik | Reverse Proxy & Load Balancer | `curl http://localhost:80` |
| 3001 | Gateway | agent-gateway | API Gateway for Azure DevOps Webhooks | `curl http://localhost:3001/health` |
| 3002 | Adapter | agent-adapter | Azure DevOps Integration (Branch/PR) | `curl http://localhost:3002/health` |
| 4040 | ngrok Tunnel | agent-ngrok | External Webhook Access & Traffic Inspector | `curl http://localhost:4040/api/tunnels` + `http://localhost:4040/inspect/http` |
| 11434 | Ollama | agent-ollama | Local LLM (llama3.1:8b) | `curl http://localhost:11434/api/version` |
| Internal (7071) | Orchestrator | agent-orchestrator | Azure Functions Workflow Orchestration | `docker logs agent-orchestrator --tail 5` |
| Internal | LLM-Patch | agent-llm-patch | Code Generation & Intent Analysis | `docker logs agent-llm-patch --tail 5` |

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
| 8080 | Traefik Dashboard | agent-traefik | Load Balancer UI | `curl http://localhost:8080` |
| 8088 | Traefik API | agent-traefik | Routing API | `curl http://localhost:8088/api/version` |
| 8443 | Traefik HTTPS | agent-traefik | SSL/TLS Endpoint | `docker logs agent-traefik` (SSL config needed ) |
| 10000-10002 | Azurite | agent-azurite | Azure Storage Emulator | `docker logs agent-azurite --tail 3` |

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
docker start agent-gateway agent-adapter agent-llm-patch agent-orchestrator agent-traefik agent-ollama agent-ngrok agent-grafana agent-prometheus agent-cadvisor agent-node-exporter agent-azurite
```

## Stop System
```bash
docker-compose -f ops/compose/docker-compose.yml down
```

---

*System ready for AI-powered code generation! 🎉*
