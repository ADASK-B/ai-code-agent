# 🚀 AI Code Agent - System Start

## Quick Start (1 Command)

### 1. Start All Services
```bash
# In project root directory
docker-compose -f ops/compose/docker-compose.yml up -d --build
```

### 2. Complete Health Check

```bash
# Check all containers are running
docker ps

# === Core Application Services ===
curl http://localhost:80                    # Proxy
curl http://localhost:8080/health           # Gateway  
curl http://localhost:8082/health           # Adapter
curl http://localhost:4040/api/tunnels      # ngrok
curl http://localhost:11434/api/version     # Ollama
docker logs aiforcoding-orchestrator-1 --tail 3    # Orchestrator
docker logs aiforcoding-llm-patch-1 --tail 3       # LLM-Patch

# === Monitoring & Observability ===
curl http://localhost:3000                  # Grafana
curl http://localhost:9090                  # Prometheus
curl http://localhost:9100/metrics          # Node Exporter  
curl http://localhost:8081/containers/      # cAdvisor

# === Infrastructure & Storage ===
curl http://localhost:8090                  # Traefik Dashboard
curl http://localhost:8088/api/version      # Traefik API
docker logs aiforcoding-azurite-1 --tail 3 # Azurite

# All services healthy? ✅ System ready!
```

## Service Access Points

### Core Application Services
| Port | Service | Container | Purpose | Status Check |
|------|---------|-----------|---------|--------------|
| 80 | Proxy | aiforcoding-proxy-1 | Reverse Proxy & Load Balancer | `curl http://localhost:80` |
| 8080 | Gateway | aiforcoding-gateway-1 | API Gateway for Azure DevOps Webhooks | `curl http://localhost:8080/health` |
| 8082 | Adapter | aiforcoding-adapter-1 | Azure DevOps Integration (Branch/PR) | `curl http://localhost:8082/health` |
| 4040 | ngrok Tunnel | aiforcoding-ngrok-1 | External Webhook Access & Traffic Inspector | `curl http://localhost:4040/api/tunnels` + `http://localhost:4040/inspect/http` |
| 11434 | Ollama | aiforcoding-ollama-1 | Local LLM (llama3.1:8b) | `curl http://localhost:11434/api/version` |
| Internal (7071) | Orchestrator | aiforcoding-orchestrator-1 | Azure Functions Workflow Orchestration | `docker logs aiforcoding-orchestrator-1 --tail 5` |
| Internal | LLM-Patch | aiforcoding-llm-patch-1 | Code Generation & Intent Analysis | `docker logs aiforcoding-llm-patch-1 --tail 5` |

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
| 8090 | Traefik Dashboard | aiforcoding-traefik-1 | Load Balancer UI | `curl http://localhost:8090` |
| 8088 | Traefik API | aiforcoding-traefik-1 | Routing API | `curl http://localhost:8088/api/version` |
| 8443 | Traefik HTTPS | aiforcoding-traefik-1 | SSL/TLS Endpoint | `docker logs aiforcoding-traefik-1` (SSL config needed ) |
| 10000-10002 | Azurite | aiforcoding-azurite-1 | Azure Storage Emulator | `docker logs aiforcoding-azurite-1 --tail 3` |

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
docker start aiforcoding-gateway-1 aiforcoding-adapter-1 aiforcoding-llm-patch-1 aiforcoding-orchestrator-1 aiforcoding-proxy-1 aiforcoding-traefik-1 aiforcoding-ollama-1 aiforcoding-ngrok-1 agent-grafana agent-prometheus agent-cadvisor agent-node-exporter aiforcoding-azurite-1
```

## Stop System
```bash
docker-compose -f ops/compose/docker-compose.yml down
```

---

*System ready for AI-powered code generation! 🎉*
