# System Architecture Overview

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready (16 Services Running)

## 🎯 Current Architecture

The AI Code Agent runs as a **production-ready microservices architecture** with comprehensive monitoring and observability.

### Core Application Services (8)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Traefik** | 80/8080 | Reverse Proxy & Load Balancer | ✅ Running |
| **Gateway** | 3001 | API Gateway for Azure DevOps Webhooks | ✅ Running |
| **Orchestrator** | 7071 | Azure Functions Workflow Coordination | ✅ Running |
| **Adapter** | 3002 | Azure DevOps Integration (Branch/PR Management) | ✅ Running |
| **LLM-Patch** | 3003 | AI Code Generation & Intent Analysis | ✅ Running |
| **ngrok** | 4040 | External Tunnel (Azure DevOps → Local) | ✅ Running |
| **Ollama** | 11434 | Local LLM (llama3.1:8b + llama3.2:1b) | ✅ Running |
| **Azurite** | 10000-10002 | Azure Storage Emulator | ✅ Running |

### Monitoring & Observability Stack (8)

| Service | Port | Purpose | Status |
|---------|------|---------|--------|
| **Health Monitor** | 8888 | Automated Health Checks of All Services | ✅ Running |
| **Prometheus** | 9090 | Metrics Database & Alert Rules | ✅ Running |
| **Grafana** | 3000 | Monitoring Dashboards & Visualization | ✅ Running |
| **Loki** | 3100 | Log Aggregation & Search Engine | ✅ Running |
| **Alertmanager** | 9093 | Alert Notifications & Routing | ✅ Running |
| **cAdvisor** | 8081 | Container Metrics (CPU, RAM, Network) | ✅ Running |
| **Node Exporter** | 9100 | Host System Metrics | ✅ Running |
| **Promtail** | Internal | Docker Log Collection Agent | ✅ Running |

## 🚀 Deployment

### One-Command Startup
```bash
docker-compose -f docker-compose.full.yml up -d --build
```

This single command starts all 16 services with:
- ✅ Core application functionality
- ✅ Complete monitoring stack
- ✅ Health checks and auto-restart
- ✅ Local AI models (Ollama)

### Health Verification
```bash
# Check overall system health
curl http://localhost:8888/health

# Individual service health
curl http://localhost:3001/health  # Gateway
curl http://localhost:3002/health  # Adapter
curl http://localhost:3003/health  # LLM-Patch
```

## 📊 Architecture Flow

```
Azure DevOps PR Comment 
    ↓ (Webhook)
ngrok Tunnel 
    ↓ (HTTP)
Traefik Load Balancer 
    ↓ (Route)
Gateway Service 
    ↓ (Process)
Orchestrator (Azure Functions) 
    ↓ (Coordinate)
Adapter ← → LLM-Patch
    ↓         ↓
Azure DevOps  Ollama AI
(Create PRs)  (Generate Code)
```

## 🔧 Technology Stack

- **Container Orchestration:** Docker Compose
- **Reverse Proxy:** Traefik
- **Serverless Functions:** Azure Functions (Orchestrator)
- **AI/LLM:** Ollama (local), Claude/OpenAI (fallback)
- **Monitoring:** Prometheus + Grafana + Loki
- **Storage:** Azurite (development), planned PostgreSQL (production)
- **External Access:** ngrok tunnel

## 📈 Monitoring & Health

- **Real-time Health Dashboard:** http://localhost:8888
- **Metrics & Dashboards:** http://localhost:3000 (Grafana - admin/admin)
- **Prometheus Metrics:** http://localhost:9090
- **Log Search:** Grafana → Explore → Loki

---

**Next Steps:** See [Platform Evolution](../design/goal.md) for planned extensions and enterprise features.
