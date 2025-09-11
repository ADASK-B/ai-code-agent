# Core Services Architecture

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Production-Ready (8 Services Running)

## 🎯 Core Application Services

The AI Code Agent's core functionality is powered by **8 specialized microservices** that handle the complete PR automation workflow.

## 📊 Service Overview

| Port | Service | Container | Purpose | Technology |
|------|---------|-----------|---------|------------|
| **80/8080** | **Traefik** | agent-traefik | Reverse Proxy & Load Balancer | Go-based proxy |
| **3001** | **Gateway** | agent-gateway | API Gateway for Azure DevOps Webhooks | Node.js/Fastify |
| **7071** | **Orchestrator** | agent-orchestrator | Workflow Coordination | Azure Functions |
| **3002** | **Adapter** | agent-adapter | Azure DevOps Integration | Node.js/TypeScript |
| **3003** | **LLM-Patch** | agent-llm-patch | AI Code Generation | Node.js/TypeScript |
| **4040** | **ngrok** | agent-ngrok | External Tunnel | ngrok tunnel |
| **11434** | **Ollama** | agent-local-llm | Local LLM Models | Ollama runtime |
| **10000-10002** | **Azurite** | agent-azurite | Storage Emulator | Azure Storage API |

## 🔄 Service Interactions

### Request Flow
```
Azure DevOps PR Comment
    ↓ (Webhook)
ngrok Tunnel (4040)
    ↓ (HTTP)
Traefik Load Balancer (80)
    ↓ (Route)
Gateway Service (3001)
    ↓ (Process Intent)
Orchestrator (7071)
    ↓ (Coordinate)
Adapter (3002) ← → LLM-Patch (3003)
    ↓                 ↓
Azure DevOps         Ollama AI (11434)
(Create PRs)         (Generate Code)
```

## 🏗️ Detailed Service Descriptions

### 🌐 **Traefik (Port 80/8080)**
**Purpose:** Reverse Proxy & Load Balancer  
**Technology:** Go-based HTTP reverse proxy  
**Role:**
- Routes incoming requests to appropriate services
- Provides SSL termination and load balancing
- Dashboard available at http://localhost:8080
- Handles service discovery and health checking

**Key Features:**
- Automatic service discovery
- Health check integration
- Request routing based on headers/paths
- Metrics export for monitoring

### 🚪 **Gateway (Port 3001)**
**Purpose:** API Gateway for Azure DevOps Webhooks  
**Technology:** Node.js with Fastify framework  
**Role:**
- Receives Azure DevOps webhook events
- Validates webhook signatures and payloads
- Extracts PR comment intents (@user /edit /N commands)
- Forwards requests to Orchestrator for processing

**Key Features:**
- Webhook signature validation
- Rate limiting and security
- Correlation ID generation
- Prometheus metrics export
- Health check endpoint (/health, /ready)

### ⚡ **Orchestrator (Port 7071)**
**Purpose:** Workflow Coordination Engine  
**Technology:** Azure Functions with TypeScript  
**Role:**
- Coordinates the entire AI code generation workflow
- Manages state and retries for long-running operations
- Orchestrates parallel variant generation
- Handles error recovery and compensation

**Key Features:**
- Serverless workflow orchestration
- State persistence with Azurite
- Parallel processing of multiple variants
- Timeout and retry handling
- Idempotency for reliable processing

### 🔄 **Adapter (Port 3002)**
**Purpose:** Azure DevOps Integration Service  
**Technology:** Node.js with TypeScript  
**Role:**
- Creates branches and pull requests in Azure DevOps
- Applies generated code patches to repositories
- Posts status updates and comments back to PRs
- Manages Azure DevOps API authentication

**Key Features:**
- Azure DevOps REST API integration
- Git operations (branch creation, commits)
- Pull request management
- Comment posting and status updates
- Personal Access Token (PAT) authentication

### 🧠 **LLM-Patch (Port 3003)**
**Purpose:** AI Code Generation & Analysis  
**Technology:** Node.js with TypeScript  
**Role:**
- Analyzes natural language intents from PR comments
- Generates code patches using LLM providers
- Supports multiple LLM backends (Ollama, Claude, OpenAI)
- Creates different coding styles per variant

**Key Features:**
- Multi-provider LLM support (Ollama primary)
- Intent clarification for vague requests
- Unified diff patch generation
- Coding style variation (conservative, modern, creative)
- Context-aware code analysis

### 🌍 **ngrok (Port 4040)**
**Purpose:** External Access Tunnel  
**Technology:** ngrok tunneling service  
**Role:**
- Provides public HTTPS endpoint for Azure DevOps webhooks
- Tunnels external requests to local Gateway service
- Enables development and testing with real Azure DevOps

**Key Features:**
- HTTPS tunnel to localhost
- Subdomain persistence with paid plans
- Webhook URL for Azure DevOps configuration
- Dashboard at http://localhost:4040

### 🤖 **Ollama (Port 11434)**
**Purpose:** Local LLM Runtime  
**Technology:** Ollama with LLaMA models  
**Role:**
- Runs local AI models for code generation
- Provides privacy-first AI processing
- Supports multiple model sizes (1b, 8b parameters)
- GPU acceleration when available

**Key Features:**
- Local model execution (no external API calls)
- Model: llama3.1:8b (primary), llama3.2:1b (fallback)
- REST API compatible with OpenAI format
- Automatic model downloading and caching

### 💾 **Azurite (Port 10000-10002)**
**Purpose:** Azure Storage Emulator  
**Technology:** Microsoft Azurite  
**Role:**
- Provides local Azure Storage API compatibility
- Stores Orchestrator state and workflow data
- Enables Azure Functions local development
- Blob, Queue, and Table storage emulation

**Key Features:**
- Full Azure Storage API compatibility
- Persistent storage for workflow state
- Queue storage for async processing
- Development-time storage solution

## 🚀 Deployment

### Quick Start
```bash
# Start all core services
docker-compose -f docker-compose.full.yml up -d --build

# Verify core services
curl http://localhost:3001/health  # Gateway
curl http://localhost:3002/health  # Adapter
curl http://localhost:3003/health  # LLM-Patch
curl http://localhost:8080/health  # Traefik
```

### Health Verification
```bash
# Check all services are running
docker-compose ps

# Test the complete flow
curl -X POST http://localhost:3001/webhook/ado \
  -H "Content-Type: application/json" \
  -d '{"eventType":"git.pullrequest.created","resource":{"description":"@user /edit /1 test"}}'
```

## 🔧 Configuration

### Environment Variables
```bash
# Core service configuration
AZDO_PAT=your_azure_devops_token
AZDO_ORG=your_organization
AZDO_PROJECT=your_project
AZDO_REPO=your_repository

# ngrok configuration
NGROK_AUTHTOKEN=your_ngrok_token

# LLM configuration
OLLAMA_MODEL=llama3.1:8b
CLAUDE_API_KEY=optional_claude_key
OPENAI_API_KEY=optional_openai_key
```

## 📈 Performance Characteristics

| Service | CPU Usage | Memory Usage | Response Time | Scaling |
|---------|-----------|--------------|---------------|---------|
| **Traefik** | Low | ~50MB | <10ms | Horizontal |
| **Gateway** | Low | ~100MB | <100ms | Horizontal |
| **Orchestrator** | Medium | ~200MB | 2-5min | Vertical |
| **Adapter** | Low | ~150MB | 1-3sec | Horizontal |
| **LLM-Patch** | High | ~500MB | 10-30sec | Vertical |
| **ngrok** | Low | ~30MB | <50ms | N/A |
| **Ollama** | High | ~4GB | 5-15sec | GPU |
| **Azurite** | Low | ~100MB | <10ms | Vertical |

---

**Next:** [Monitoring Stack](monitoring-stack.md) for observability services documentation.
