# 🚀 Docker-Native Skalierung

**Komplette Container-Architektur für Production-Ready Deployment**

## 🏗️ Vollständige Container-Services

### Core Services (immer aktiv)
- **Gateway** → `agent-gateway:3001`
- **Orchestrator** → `agent-orchestrator:7071` 
- **Adapter** → `agent-adapter:3002`
- **LLM-Patch** → `agent-llm-patch:3003`
- **Traefik** → `agent-traefik:80,8080`
- **Azurite** → `agent-azurite:10000-10002`
- **Health Monitor** → `agent-health-monitor:8888`

### External Services (containerized)
- **ngrok** → `agent-ngrok:4040` (Tunnel Management)
- **Local LLM** → `agent-local-llm:11434` (Ollama)
- **Supabase DB** → `agent-supabase-db:5432` (PostgreSQL)

## 🐳 Deployment Profiles

### 1. Development (Standard)
```bash
docker compose up -d --build
```
**Startet:** Core Services + Health Monitor + ngrok

### 2. Mit Local LLM
```bash
docker compose --profile local-llm up -d --build
```
**Zusätzlich:** Ollama mit CodeQwen/CodeLlama Modellen

### 3. Mit Local Supabase
```bash
docker compose --profile supabase-local up -d --build
```
**Zusätzlich:** PostgreSQL + Supabase Studio

### 4. Full Stack (Alles lokal)
```bash
docker compose --profile local-llm --profile supabase-local up -d --build
```
**Startet:** Alle 10+ Container für komplette Isolation

## 🔧 Skalierung Benefits

### 🎯 Production Benefits
- **Horizontale Skalierung** - Jeder Service einzeln skalierbar
- **Zero-Downtime Deployment** - Rolling Updates möglich
- **Resource Isolation** - CPU/Memory Limits pro Service
- **Health Monitoring** - Automatische Service Recovery
- **Load Balancing** - Traefik verteilt Traffic

### 🔒 Security Benefits  
- **Network Isolation** - Services nur über Docker Network
- **Secret Management** - Keine Credentials auf Host
- **External Access Control** - Nur ngrok/Traefik exponiert
- **Container Isolation** - Prozess-Level Separation

### 📊 Monitoring Benefits
- **Centralized Logging** - Docker Log Driver
- **Health Checks** - Per-Service Health Status
- **Metrics Collection** - Container Stats
- **Dashboard** - Real-time Service Overview

## 🚀 Kubernetes Ready

Die Docker Compose Struktur ist **Kubernetes-ready**:

### Helm Chart Struktur
```
helm/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── gateway/
│   ├── orchestrator/  
│   ├── adapter/
│   ├── llm-patch/
│   ├── health-monitor/
│   └── ingress.yaml
```

### Kubernetes Migration
```bash
# 1. Convert Compose to K8s Manifests
kompose convert -f docker-compose.yml

# 2. Deploy to Kubernetes
kubectl apply -f .

# 3. Scale Services
kubectl scale deployment agent-gateway --replicas=3
kubectl scale deployment agent-llm-patch --replicas=5
```

## 📈 Auto-Scaling Konfiguration

### Docker Swarm Mode
```bash
# Initialize Swarm
docker swarm init

# Deploy Stack
docker stack deploy -c docker-compose.yml code-agent

# Scale Services
docker service scale code-agent_gateway=3
docker service scale code-agent_llm-patch=5
```

### Kubernetes HPA (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gateway-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🌍 Multi-Environment Setup

### Environment-Specific Overrides
```bash
# Development
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Staging  
docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Cloud Provider Integration

#### **AWS ECS**
```bash
# Deploy to ECS
ecs-cli compose --project-name code-agent service up
```

#### **Azure Container Instances**
```bash
# Deploy to ACI
docker context create aci code-agent-aci
docker compose up
```

#### **Google Cloud Run**
```bash
# Deploy individual services
gcloud run deploy agent-gateway --source=services/gateway
gcloud run deploy agent-orchestrator --source=services/orchestrator
```

## 🔄 CI/CD Pipeline Integration

### GitHub Actions Example
```yaml
name: Deploy Code Agent MVP
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Health Check Pre-Deploy
        run: |
          docker compose -f docker-compose.yml build
          docker compose -f docker-compose.yml up -d
          curl -f http://localhost:8888/health
          
      - name: Deploy to Production
        run: |
          docker compose -f docker-compose.prod.yml up -d --build
          
      - name: Health Check Post-Deploy
        run: |
          sleep 30
          curl -f http://localhost:8888/health
```

## 📊 Resource Planning

### Minimum System Requirements
```yaml
Resources:
  CPU: 4 cores
  Memory: 8GB RAM
  Storage: 20GB SSD
  Network: 100Mbps

Container Allocation:
  Gateway: 0.5 CPU, 512MB RAM
  Orchestrator: 1 CPU, 1GB RAM  
  Adapter: 0.5 CPU, 512MB RAM
  LLM-Patch: 1 CPU, 2GB RAM
  Local-LLM: 2 CPU, 4GB RAM (optional)
  Others: 0.5 CPU, 256MB RAM each
```

### Production Scaling
```yaml
High-Load Configuration:
  Gateway: 3 replicas
  Orchestrator: 2 replicas
  Adapter: 2 replicas  
  LLM-Patch: 5 replicas
  Health-Monitor: 1 replica
  
Load Balancer: Traefik (sticky sessions for orchestrator)
Database: External PostgreSQL cluster
LLM: External API (Claude/OpenAI) + Local fallback
```

---

**🎯 Ergebnis:** Vollständig containerisierte, skalierbare Architektur die von Development bis Production funktioniert!

**💡 Next Steps:** Kubernetes Helm Charts für echte Enterprise-Skalierung!
