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

### 🔄 System Context & Main Workflow

```mermaid
graph TB
    subgraph "👤 Users & External Systems"
        DEV[🧑‍� Developer<br/>Writes PR Comments<br/>@user /edit /N intent]
        ADO[🔵 Azure DevOps<br/>Webhooks & API]
        OPENAI[🤖 OpenAI GPT-4]
        CLAUDE[🤖 Anthropic Claude]
    end
    
    subgraph "�️ AI Code Agent System"
        direction TB
        GATEWAY[� API Gateway<br/>Port 3001<br/>Webhook Processing]
        ORCHESTRATOR[🎯 Orchestrator<br/>Port 7071<br/>Workflow Engine]
        ADAPTER[� DevOps Adapter<br/>Port 3002<br/>Branch/PR Mgmt]
        LLM[🧠 LLM-Patch Service<br/>Port 3003<br/>AI Code Generation]
        OLLAMA[🤖 Local Ollama<br/>Port 11434<br/>Privacy-First AI]
    end
    
    subgraph "� Observability & Infrastructure"
        MONITOR[� Monitoring Stack<br/>Prometheus/Grafana<br/>Port 3000/9090]
        HEALTH[🏥 Health Monitor<br/>Port 8888<br/>Service Status]
        TRAEFIK[⚖️ Load Balancer<br/>Port 80/8080<br/>Traffic Routing]
    end
    
    %% Main Workflow
    DEV -->|PR Comment| ADO
    ADO -->|Webhook| GATEWAY
    GATEWAY -->|Trigger| ORCHESTRATOR
    ORCHESTRATOR -->|Generate Code| LLM
    ORCHESTRATOR -->|Manage PR| ADAPTER
    
    %% AI Provider Fallback Chain
    LLM -.->|1st: Local| OLLAMA
    LLM -.->|2nd: Cloud| CLAUDE  
    LLM -.->|3rd: Fallback| OPENAI
    
    %% DevOps Integration
    ADAPTER <-->|REST API| ADO
    
    %% Infrastructure
    TRAEFIK -->|Route| GATEWAY
    HEALTH -->|Monitor| GATEWAY
    HEALTH -->|Monitor| LLM
    HEALTH -->|Monitor| ADAPTER
    
    %% Observability
    GATEWAY -->|Metrics| MONITOR
    LLM -->|Metrics| MONITOR
    ADAPTER -->|Metrics| MONITOR
        ORCHESTRATOR[🔴 Orchestrator<br/>Port 7071<br/>Azure Functions<br/>Workflow Coordination]
    end
    
    subgraph "⚙️ Business Logic Services"
        ADAPTER[🟠 Adapter Service<br/>Port 3002<br/>Azure DevOps Integration<br/>Branch/PR Management]
        LLMPATCH[🟣 LLM-Patch Service<br/>Port 3003<br/>AI Code Generation<br/>Intent Analysis]
    end
    
    subgraph "🤖 AI Infrastructure"
        OLLAMA[🧠 Ollama LLM<br/>Port 11434<br/>Local AI Models<br/>llama3.1:8b + llama3.2:1b]
    end
    
    subgraph "💾 Storage & Infrastructure"
        AZURITE[💽 Azurite<br/>Port 10000-10002<br/>Azure Storage Emulator<br/>Orchestrator Data]
    end
    
    %% Main Workflow
    USER -->|1. Writes Comment| ADO
    ADO -->|2. Webhook| NGROK
    NGROK -->|3. Tunnel| TRAEFIK
    TRAEFIK -->|4. Route| GATEWAY
    GATEWAY -->|5. Process| ORCHESTRATOR
    
    %% Orchestrator Coordination
    ORCHESTRATOR -->|6a. Fetch PR Data| ADAPTER
    ORCHESTRATOR -->|6b. Generate Code| LLMPATCH
    ORCHESTRATOR -->|6c. Create Branches| ADAPTER
    ORCHESTRATOR -->|6d. Create PRs| ADAPTER
    
    %% Service Dependencies
    ADAPTER -.->|Git Operations| ADO
    LLMPATCH -->|AI Requests| OLLAMA
    ORCHESTRATOR -.->|State Storage| AZURITE
    
    %% Styling
    style USER fill:#e3f2fd
    style ADO fill:#0078d4,color:#fff
    style NGROK fill:#1db954,color:#fff
    style TRAEFIK fill:#326ce5,color:#fff
    style GATEWAY fill:#ffeb3b
    style ORCHESTRATOR fill:#f44336,color:#fff
    style ADAPTER fill:#ff9800,color:#fff
    style LLMPATCH fill:#9c27b0,color:#fff
    style OLLAMA fill:#4caf50,color:#fff
    style AZURITE fill:#607d8b,color:#fff
```

### 📊 Monitoring & Observability Stack

```mermaid
graph TB
    subgraph "🐳 All Container Services"
        CORE[Core Services<br/>Gateway, Adapter, LLM-Patch<br/>Orchestrator, Ollama, etc.]
    end
    
    subgraph "📝 Log Collection & Analysis"
        PROMTAIL[📋 Promtail<br/>Internal<br/>Docker Log Collector]
        LOKI[📚 Loki<br/>Port 3100<br/>Log Aggregation & Search]
    end
    
    subgraph "📈 Metrics Collection"
        CADVISOR[📊 cAdvisor<br/>Port 8081<br/>Container Metrics<br/>CPU, RAM, Network]
        NODEEXP[🖥️ Node Exporter<br/>Port 9100<br/>Host System Metrics<br/>Disk, CPU, RAM]
        PROMETHEUS[⚡ Prometheus<br/>Port 9090<br/>Metrics Database<br/>Alert Rules]
    end
    
    subgraph "🚨 Alerting & Notifications"
        ALERTMGR[🔔 Alertmanager<br/>Port 9093<br/>Alert Routing<br/>Notifications]
    end
    
    subgraph "📈 Visualization & Dashboards"
        GRAFANA[📊 Grafana<br/>Port 3000<br/>Dashboards & Visualization<br/>Logs + Metrics]
    end
    
    subgraph "🏥 Health Monitoring"
        HEALTHMON[❤️ Health Monitor<br/>Port 8888<br/>Service Status Checks<br/>All 15 Services]
    end
    
    %% Log Flow
    CORE -->|Docker Logs| PROMTAIL
    PROMTAIL -->|Ship Logs| LOKI
    LOKI -->|Query Logs| GRAFANA
    
    %% Metrics Flow
    CORE -->|Container Stats| CADVISOR
    CORE -->|Host Stats| NODEEXP
    CADVISOR -->|Metrics| PROMETHEUS
    NODEEXP -->|Metrics| PROMETHEUS
    PROMETHEUS -->|Visualize| GRAFANA
    
    %% Alerting Flow
    PROMETHEUS -->|Alert Rules| ALERTMGR
    ALERTMGR -.->|Email/Slack/Webhook| EXTERNAL[📧 External Notifications]
    
    %% Health Monitoring
    CORE -.->|Status Checks| HEALTHMON
    
    %% Styling
    style CORE fill:#e8f5e8
    style PROMTAIL fill:#ff9800
    style LOKI fill:#2196f3,color:#fff
    style CADVISOR fill:#4caf50,color:#fff
    style NODEEXP fill:#9c27b0,color:#fff
    style PROMETHEUS fill:#e74c3c,color:#fff
    style ALERTMGR fill:#ff5722,color:#fff
    style GRAFANA fill:#ff8c00,color:#fff
    style HEALTHMON fill:#f50057,color:#fff
```

### 🔗 Complete Service Interaction Map

```mermaid
graph TB
    subgraph "🎯 Core Application Services (7)"
        TRAEFIK[🔷 Traefik<br/>Port 80/8080<br/>Load Balancer]
        GATEWAY[🟡 Gateway<br/>Port 3001<br/>API Gateway]
        ADAPTER[🟠 Adapter<br/>Port 3002<br/>Azure DevOps Integration]
        LLMPATCH[🟣 LLM-Patch<br/>Port 3003<br/>Code Generation]
        ORCHESTRATOR[🔴 Orchestrator<br/>Port 7071<br/>Workflow Coordination]
        NGROK[🟢 ngrok<br/>Port 4040<br/>External Tunnel]
        OLLAMA[🧠 Ollama<br/>Port 11434<br/>Local LLM]
    end
    
    subgraph "📊 Monitoring & Observability (8)"
        HEALTHMON[❤️ Health Monitor<br/>Port 8888<br/>Status Checks]
        GRAFANA[📊 Grafana<br/>Port 3000<br/>Dashboards]
        PROMETHEUS[⚡ Prometheus<br/>Port 9090<br/>Metrics DB]
        NODEEXP[🖥️ Node Exporter<br/>Port 9100<br/>System Metrics]
        CADVISOR[📊 cAdvisor<br/>Port 8081<br/>Container Metrics]
        LOKI[📚 Loki<br/>Port 3100<br/>Log Storage]
        ALERTMGR[🔔 Alertmanager<br/>Port 9093<br/>Notifications]
        PROMTAIL[📋 Promtail<br/>Internal<br/>Log Collector]
    end
    
    subgraph "💾 Infrastructure & Storage (1)"
        AZURITE[💽 Azurite<br/>Port 10000-10002<br/>Storage Emulator]
    end
    
    subgraph "🌍 External Systems"
        ADO[🔵 Azure DevOps<br/>Git Repository<br/>Pull Requests]
    end
    
    %% Main Application Flow
    ADO -.->|Webhook| NGROK
    NGROK --> TRAEFIK
    TRAEFIK --> GATEWAY
    GATEWAY --> ORCHESTRATOR
    ORCHESTRATOR --> ADAPTER
    ORCHESTRATOR --> LLMPATCH
    ADAPTER -.->|Git Ops| ADO
    LLMPATCH --> OLLAMA
    ORCHESTRATOR -.->|Data| AZURITE
    
    %% Monitoring Connections
    GATEWAY --> PROMETHEUS
    ADAPTER --> PROMETHEUS
    LLMPATCH --> PROMETHEUS
    ORCHESTRATOR --> PROMETHEUS
    OLLAMA --> PROMETHEUS
    TRAEFIK --> PROMETHEUS
    CADVISOR --> PROMETHEUS
    NODEEXP --> PROMETHEUS
    
    %% Log Collection
    GATEWAY --> PROMTAIL
    ADAPTER --> PROMTAIL
    LLMPATCH --> PROMTAIL
    ORCHESTRATOR --> PROMTAIL
    OLLAMA --> PROMTAIL
    TRAEFIK --> PROMTAIL
    PROMTAIL --> LOKI
    
    %% Visualization & Alerting
    PROMETHEUS --> GRAFANA
    LOKI --> GRAFANA
    PROMETHEUS --> ALERTMGR
    
    %% Health Monitoring
    HEALTHMON -.->|Check| GATEWAY
    HEALTHMON -.->|Check| ADAPTER
    HEALTHMON -.->|Check| LLMPATCH
    HEALTHMON -.->|Check| ORCHESTRATOR
    HEALTHMON -.->|Check| OLLAMA
    HEALTHMON -.->|Check| TRAEFIK
    HEALTHMON -.->|Check| GRAFANA
    HEALTHMON -.->|Check| PROMETHEUS
    HEALTHMON -.->|Check| LOKI
    HEALTHMON -.->|Check| ALERTMGR
    
    %% Styling
    style ADO fill:#0078d4,color:#fff
    style NGROK fill:#1db954,color:#fff
    style TRAEFIK fill:#326ce5,color:#fff
    style GATEWAY fill:#ffeb3b
    style ORCHESTRATOR fill:#f44336,color:#fff
    style ADAPTER fill:#ff9800,color:#fff
    style LLMPATCH fill:#9c27b0,color:#fff
    style OLLAMA fill:#4caf50,color:#fff
    style AZURITE fill:#607d8b,color:#fff
    style HEALTHMON fill:#f50057,color:#fff
    style GRAFANA fill:#ff8c00,color:#fff
    style PROMETHEUS fill:#e74c3c,color:#fff
    style LOKI fill:#2196f3,color:#fff
    style ALERTMGR fill:#ff5722,color:#fff
```

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
