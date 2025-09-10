# 🤖 AI Code Agent

> **An intelligent AI agent that automatically creates code changes in Azure DevOps Pull Requests**

## ⚠️ Development Status

🚧 **This project is currently in active development** but already functional for core workflows.

## 🎯 What does this Agent do?

The AI Code Agent **responds to natural language** in Azure DevOps Pull Request comments and **automatically creates code variants** as separate Draft Pull Requests **from the same codebase context** where the comment was posted.

### ✨ Simple Usage

1. **Write a comment** in your Azure DevOps Pull Request:
   ```
   @"User" /edit /2 Make all buttons red and add hover effects
   ```

2. **The Agent automatically creates:**
   - 🔀 2 separate branches (`agents/edit-123-1`, `agents/edit-123-2`) **based on your current PR**
   - 📝 Code patches with AI-generated changes **applied to your existing code**
   - 🔄 Draft Pull Requests with the variants **targeting the same base branch**
   - 💬 Status updates **posted back to your original PR** showing progress

3. **You receive:**
   - Different solution approaches to compare **within your PR context**
   - Immediately testable code variants **built on your existing changes**
   - Detailed explanations of the changes **relevant to your current work**

## 🏗️ System Architecture

> **Production-ready architecture** designed with **observability**, **resilience**, and **scalability** in mind.

### � Architecture Documentation

📁 **Complete Architecture Documentation**: [`/docs`](./docs)
- 🎯 **[Project Goals & SLOs](./docs/goal.md)** - Business objectives and service level objectives
- 🏗️ **[Arc42 Architecture](./docs/arc42)** - Comprehensive system documentation  
- 📝 **[Architecture Decisions (ADRs)](./docs/adr)** - Key technical decisions and rationale
- 🎨 **[C4 Models](./docs/c4/workspace.dsl)** - Visual architecture models and diagrams

### 🔄 System Overview & Main Workflow

```mermaid
graph TB
    subgraph "👤 External Systems & Users"
        DEV[🧑‍💻 Developer<br/>Azure DevOps User<br/>Writes PR Comments<br/>@user /edit /N intent]
        ADO[🔵 Azure DevOps<br/>Source Repository<br/>Pull Requests & Webhooks<br/>Project Management]
        EXTERNAL[🌐 External Access<br/>ngrok Public Tunnel<br/>Webhook Endpoint<br/>Traffic Inspector]
    end
    
    subgraph "🏗️ Core Application Stack"
        direction TB
        CORE[🎯 8 Core Services<br/>Gateway → Orchestrator → Adapter + LLM-Patch<br/>+ Traefik + ngrok + Ollama + Azurite]
    end
    
    subgraph "📊 Monitoring & Observability"
        direction TB
        MONITORING[📈 8 Monitoring Services<br/>Grafana + Prometheus + Loki + Health Monitor<br/>+ Alertmanager + cAdvisor + Node Exporter + Promtail]
    end
    
    subgraph "🤖 AI Provider Chain (Fallback Strategy)"
        direction LR
        AI_LOCAL[🏠 Local Ollama<br/>1st Priority<br/>Privacy & No Cost<br/>llama3.1:8b]
        AI_CLAUDE[🎭 Anthropic Claude<br/>2nd Priority<br/>Enterprise Quality<br/>API Key Required]
        AI_OPENAI[🤖 OpenAI GPT-4<br/>3rd Priority<br/>Fallback Option<br/>API Key Required]
        AI_MOCK[🎪 Mock Responses<br/>Final Fallback<br/>No Dependencies<br/>Testing & Demo]
    end
    
    %% Main Workflow - PR Comment to AI Code Generation
    DEV -->|1. PR Comment<br/>@user /edit /N intent| ADO
    ADO -->|2. Webhook Event<br/>Pull Request Commented| EXTERNAL
    EXTERNAL -->|3. HTTP Request<br/>/webhook/ado| CORE
    CORE -->|4. AI Code Generation<br/>N Variants| AI_LOCAL
    CORE -.->|Fallback Chain| AI_CLAUDE
    CORE -.->|Fallback Chain| AI_OPENAI  
    CORE -.->|Final Fallback| AI_MOCK
    CORE -->|5. Draft PRs<br/>Status Updates| ADO
    
    %% Monitoring Integration
    CORE -.->|Metrics & Logs| MONITORING
    MONITORING -.->|Health Checks<br/>Alerts| CORE
    
    %% Styling
    style DEV fill:#e3f2fd
    style ADO fill:#0078d4,color:#fff
    style EXTERNAL fill:#1db954,color:#fff
    style CORE fill:#ff9800,color:#fff
    style MONITORING fill:#2196f3,color:#fff
    style AI_LOCAL fill:#4caf50,color:#fff
    style AI_CLAUDE fill:#673ab7,color:#fff
    style AI_OPENAI fill:#00bcd4,color:#fff
    style AI_MOCK fill:#9e9e9e,color:#fff
```

### 🏗️ Core Application Services (8 Services)

**Zweck:** Kern-Services für AI Code Generation und Azure DevOps Integration.

```mermaid
graph TB
    subgraph "🌐 External Access Layer"
        NGROK[🟢 ngrok Tunnel<br/>Port 4040<br/>External Webhook Access<br/>Traffic Inspector & Debugging]
        TRAEFIK[🔷 Traefik<br/>Port 80/8080<br/>Reverse Proxy & Load Balancer<br/>HTTP Router & Dashboard]
    end
    
    subgraph "🎯 Core Application Layer"
        direction TB
        GATEWAY[🟡 Gateway Service<br/>Port 3001<br/>Webhook Receiver & Validator<br/>Azure DevOps Event Processing]
        ORCHESTRATOR[🔴 Orchestrator<br/>Port 7071<br/>Azure Functions Workflow<br/>Business Logic & Coordination]
        ADAPTER[🟠 Adapter Service<br/>Port 3002<br/>Azure DevOps Integration<br/>Branch/PR/Comment Management]
        LLM_PATCH[🟣 LLM-Patch Service<br/>Port 3003<br/>AI Code Generation<br/>Intent Analysis & Patch Creation]
    end
    
    subgraph "🤖 AI & Storage Layer"
        OLLAMA[🧠 Local Ollama LLM<br/>Port 11434<br/>Privacy-First AI Models<br/>llama3.1:8b + llama3.2:1b]
        AZURITE[💽 Azurite Storage<br/>Port 10000-10002<br/>Azure Storage Emulator<br/>Orchestrator State Management]
    end
    
    subgraph "🔵 External Systems"
        ADO[🔵 Azure DevOps<br/>Source Repository<br/>Pull Requests & Webhooks]
    end
    
    %% Main Data Flow
    ADO -.->|Webhook| NGROK
    NGROK --> TRAEFIK
    TRAEFIK --> GATEWAY
    GATEWAY --> ORCHESTRATOR
    ORCHESTRATOR --> ADAPTER
    ORCHESTRATOR --> LLM_PATCH
    ADAPTER -.->|Git Operations| ADO
    LLM_PATCH --> OLLAMA
    ORCHESTRATOR -.->|State Storage| AZURITE
    
    %% Styling
    style NGROK fill:#1db954,color:#fff
    style TRAEFIK fill:#326ce5,color:#fff
    style GATEWAY fill:#ffeb3b
    style ORCHESTRATOR fill:#f44336,color:#fff
    style ADAPTER fill:#ff9800,color:#fff
    style LLM_PATCH fill:#9c27b0,color:#fff
    style OLLAMA fill:#4caf50,color:#fff
    style AZURITE fill:#607d8b,color:#fff
    style ADO fill:#0078d4,color:#fff
```

### 📊 Monitoring & Observability Stack (8 Services)

**Zweck:** Professionelle Überwachung, Metriken, Logs und Alerting für alle Services.

```mermaid
graph TB
    subgraph "📈 Visualization & Dashboards"
        GRAFANA[📊 Grafana<br/>Port 3000<br/>Professional Dashboards<br/>Metrics & Log Visualization<br/>admin/admin]
        HEALTHMON[❤️ Health Monitor<br/>Port 8888<br/>Service Status Overview<br/>All-Service Health API<br/>Real-time Checks]
    end
    
    subgraph "⚡ Metrics Collection & Storage"
        PROMETHEUS[⚡ Prometheus<br/>Port 9090<br/>Metrics Database<br/>Time Series Storage<br/>Alert Rules Engine]
        CADVISOR[📊 cAdvisor<br/>Port 8081<br/>Container Metrics<br/>CPU/RAM/Network/Disk<br/>Docker Performance]
        NODEEXP[🖥️ Node Exporter<br/>Port 9100<br/>Host System Metrics<br/>OS-Level Performance<br/>Hardware Monitoring]
    end
    
    subgraph "📚 Log Management"
        LOKI[📚 Loki<br/>Port 3100<br/>Log Aggregation<br/>Centralized Log Storage<br/>Text Search Engine]
        PROMTAIL[📋 Promtail<br/>Internal Service<br/>Docker Log Collector<br/>Container → Loki Pipeline<br/>Real-time Log Shipping]
    end
    
    subgraph "🔔 Alerting & Notifications"
        ALERTMGR[🔔 Alertmanager<br/>Port 9093<br/>Alert Routing<br/>Notification Management<br/>Email/Slack/Webhook]
    end
    
    subgraph "🏗️ Monitored Core Services"
        CORE_SERVICES[🎯 8 Core Application Services<br/>Gateway + Orchestrator + Adapter + LLM-Patch<br/>+ Traefik + ngrok + Ollama + Azurite<br/>All providing /metrics + logs]
    end
    
    %% Metrics Flow
    CORE_SERVICES -->|HTTP /metrics<br/>Prometheus Format| PROMETHEUS
    CADVISOR -->|Container Metrics<br/>Resource Usage| PROMETHEUS
    NODEEXP -->|Host Metrics<br/>System Performance| PROMETHEUS
    HEALTHMON -->|Service Health<br/>Status Checks| PROMETHEUS
    
    %% Log Flow
    CORE_SERVICES -->|Docker Logs<br/>stdout/stderr| PROMTAIL
    PROMTAIL -->|Structured Logs<br/>JSON Format| LOKI
    
    %% Visualization
    PROMETHEUS -->|Metrics Data<br/>Time Series| GRAFANA
    LOKI -->|Log Data<br/>Text Search| GRAFANA
    
    %% Alerting
    PROMETHEUS -->|Alert Rules<br/>Threshold Violations| ALERTMGR
    ALERTMGR -.->|Notifications<br/>Critical Issues| GRAFANA
    
    %% Health Monitoring
    HEALTHMON -.->|Periodic Checks<br/>Service Status| CORE_SERVICES
    
    %% Styling
    style GRAFANA fill:#ff8c00,color:#fff
    style HEALTHMON fill:#f50057,color:#fff
    style PROMETHEUS fill:#e74c3c,color:#fff
    style CADVISOR fill:#9c27b0,color:#fff
    style NODEEXP fill:#795548,color:#fff
    style LOKI fill:#2196f3,color:#fff
    style PROMTAIL fill:#8bc34a,color:#fff
    style ALERTMGR fill:#ff5722,color:#fff
    style CORE_SERVICES fill:#607d8b,color:#fff
```

**Automatisierte Überwachung aller 16 Services mit professionellen Tools:**

| Service | Port | Zweck | Dashboard |
|---------|------|-------|-----------|
| 🏥 **Health Monitor** | 8888 | Automatische Service-Überwachung | `http://localhost:8888` |
| 📈 **Grafana** | 3000 | Professionelle Dashboards | `http://localhost:3000` (admin/admin) |
| ⚡ **Prometheus** | 9090 | Metriken-Datenbank | `http://localhost:9090` |
| 📚 **Loki** | 3100 | Log-Aggregation | Grafana → Explore → Loki |
| � **cAdvisor** | 8081 | Container-Metriken | `http://localhost:8081` |
| 🖥️ **Node Exporter** | 9100 | Host-System-Metriken | `http://localhost:9100/metrics` |
| 🔔 **Alertmanager** | 9093 | Alert-Management | `http://localhost:9093` |
| 📋 **Promtail** | Internal | Docker Log-Collector | (Internal Service) |

## 🚀 Quick Start

### 1. Start Complete System
```bash
git clone <repository>
cd ai-code-agent

# Configure environment
cp .env.example .env
# Add your tokens (ngrok, Azure DevOps PAT, etc.)

# Start ALL 16 services with ONE command
docker-compose -f docker-compose.full.yml up -d --build

# Wait for services to initialize
echo "Waiting for services to start..."
Start-Sleep -Seconds 60

# Check if Ollama models are installed
docker exec agent-local-llm ollama list
```

### 2. Health Check & Service Verification
```bash
# Quick health check of all 15 services
curl http://localhost:8888/health

# Access monitoring dashboards
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
# Health Monitor: http://localhost:8888
```

### 3. Configure Azure DevOps Webhook
1. Get ngrok tunnel URL: http://localhost:4040
2. Go to **Project Settings → Service Hooks** in Azure DevOps
3. Create **"Pull request commented"** Webhook
4. URL: `<ngrok-tunnel-url>/webhook/ado`
5. Secret: From your `.env` file (`WEBHOOK_SECRET`)

### 4. Test the System
Write in a PR comment:
```
@YourUsername /edit /1 Add error handling to the login function
```

## 📋 Complete Service Overview

### 🎯 Core Application Services (7)
| Port | Service | Container | Purpose | Interactions |
|------|---------|-----------|---------|-------------|
| 80/8080 | **Traefik** | agent-traefik | Load Balancer & Reverse Proxy | ← ngrok → Gateway |
| 3001 | **Gateway** | agent-gateway | API Gateway for Azure DevOps Webhooks | ← Traefik → Orchestrator |
| 3002 | **Adapter** | agent-adapter | Azure DevOps Integration (Branch/PR Management) | ← Orchestrator ↔ Azure DevOps |
| 3003 | **LLM-Patch** | agent-llm-patch | AI Code Generation & Intent Analysis | ← Orchestrator → Ollama |
| 7071 | **Orchestrator** | agent-orchestrator | Azure Functions Workflow Coordination | ← Gateway → Adapter + LLM-Patch |
| 4040 | **ngrok** | agent-ngrok | External Tunnel (Azure DevOps → Local) | ← Azure DevOps → Traefik |
| 11434 | **Ollama** | agent-local-llm | Local LLM (llama3.1:8b + llama3.2:1b) | ← LLM-Patch (AI Generation) |

### 📊 Monitoring & Observability (8)
| Port | Service | Container | Purpose | Data Sources |
|------|---------|-----------|---------|-------------|
| 8888 | **Health Monitor** | agent-health-monitor | Automated Health Checks of All Services | → All 15 services |
| 3000 | **Grafana** | agent-grafana | Monitoring Dashboards & Visualization | ← Prometheus + Loki |
| 9090 | **Prometheus** | agent-prometheus | Metrics Database & Alert Rules | ← cAdvisor + Node Exporter |
| 9100 | **Node Exporter** | agent-node-exporter | Host System Metrics (CPU, RAM, Disk) | → Prometheus |
| 8081 | **cAdvisor** | agent-cadvisor | Container Metrics (CPU, RAM, Network) | → Prometheus |
| 3100 | **Loki** | agent-loki | Log Aggregation & Search Engine | ← Promtail |
| 9093 | **Alertmanager** | agent-alertmanager | Alert Notifications & Routing | ← Prometheus |
| Internal | **Promtail** | agent-promtail | Docker Log Collection Agent | ← All containers → Loki |

### 💾 Infrastructure & Storage (1)
| Port | Service | Container | Purpose | Used By |
|------|---------|-----------|---------|---------|
| 10000-10002 | **Azurite** | agent-azurite | Azure Storage Emulator | ← Orchestrator (State Storage) |

## 🔧 System Requirements

### Required
- **Docker & Docker Compose** (latest)
- **ngrok Account** with Auth Token (Free tier works)
- **Azure DevOps** Project with Admin rights

### LLM Configuration
The system includes **Ollama** for local AI generation:
- ✅ **Free & Private** - No API costs, runs completely offline
- ✅ **Auto-configured** - llama3.1:8b + llama3.2:1b models
- ⚠️ **Hardware requirements** - 8GB+ RAM recommended for llama3.1:8b

## 📖 Additional Documentation

- **[AgentDocs/Agent_Init.md](./AgentDocs/Agent_Init.md)** - Complete system startup & health checks
- **[Agent.md](Agent.md)** - Detailed service overview
- **[AgentDocs/](AgentDocs/)** - Technical documentation & troubleshooting

## 🎯 Usage Examples

### Simple Code Change
```
@"User" /edit /1 Add null checks to the user validation function
```

### Multiple Variants  
```
@"User" /edit /3 Refactor the authentication logic to use JWT tokens
```

### UI Changes
```
@"User" /edit /2 Make the navigation menu responsive and add dark mode
```

## 📊 Service Health & Monitoring

- **Real-time Health**: http://localhost:8888
- **Application Metrics**: http://localhost:9090 (Prometheus)
- **Dashboards**: http://localhost:3000 (Grafana - admin/admin)
- **Log Search**: http://localhost:3000/explore (Loki in Grafana)
- **ngrok Inspector**: http://localhost:4040/inspect/http

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

*For technical details and troubleshooting see [AgentDocs/Agent_Init.md](./AgentDocs/Agent_Init.md)*
Enterprise docs trigger: 09/10/2025 01:07:14
