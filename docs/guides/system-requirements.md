# System Requirements

**Author:** Arthur Schwan  
**Last Updated:** September 11, 2025  
**Status:** Complete

## 🖥️ Hardware Requirements

### Minimum Requirements
- **CPU:** 4 cores
- **RAM:** 8GB (minimum for Ollama LLM models)
- **Storage:** 20GB free disk space
- **Network:** Broadband internet connection

### Recommended Requirements
- **CPU:** 8+ cores
- **RAM:** 16GB+ (better LLM performance)
- **Storage:** 50GB+ SSD
- **GPU:** Optional (NVIDIA GPU for faster LLM inference)

## 💻 Software Requirements

### Required Software
- **Docker:** Latest version with Docker Compose
- **Git:** For repository access
- **Operating System:** 
  - Windows 10/11 with WSL2
  - macOS 10.15+
  - Linux (Ubuntu 20.04+, CentOS 8+)

### Required Accounts & Tokens
- **ngrok Account:** Free tier sufficient
  - Get auth token from https://ngrok.com/
- **Azure DevOps:** Project with admin rights
  - Personal Access Token (PAT) required
- **Optional:** Claude API Key, OpenAI API Key
  - System works fully offline with Ollama

## 🔑 Environment Configuration

### Required Environment Variables
```bash
# ngrok configuration
NGROK_AUTHTOKEN=your_ngrok_token

# Azure DevOps configuration
AZDO_PAT=your_azure_devops_personal_access_token
AZDO_ORG=your_organization
AZDO_PROJECT=your_project
AZDO_REPO=your_repository

# Webhook security
WEBHOOK_SECRET=generate_random_secret

# Optional: External LLM providers
CLAUDE_API_KEY=your_claude_key  # Optional
OPENAI_API_KEY=your_openai_key  # Optional
```

### Port Requirements
The system uses these ports (ensure they're available):
- **80/8080:** Traefik (reverse proxy)
- **3000:** Grafana (monitoring dashboards)
- **3001:** Gateway service
- **3002:** Adapter service  
- **3003:** LLM-Patch service
- **4040:** ngrok tunnel
- **7071:** Orchestrator (Azure Functions)
- **8888:** Health Monitor
- **9090:** Prometheus
- **9093:** Alertmanager
- **11434:** Ollama LLM

## 🔧 Installation Prerequisites

### Docker Installation
```bash
# Windows: Download Docker Desktop
# macOS: Download Docker Desktop  
# Linux (Ubuntu):
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Git Installation
```bash
# Windows: Download from git-scm.com
# macOS: brew install git
# Linux: sudo apt install git
```

### ngrok Setup
1. Create account at https://ngrok.com/
2. Get auth token from dashboard
3. Add token to `.env` file

### Azure DevOps Setup
1. Create Personal Access Token:
   - Go to User Settings → Personal Access Tokens
   - Create token with "Code (read & write)" and "Pull Request (read & write)" scopes
2. Add PAT to `.env` file

## ✅ Verification Steps

### Pre-Installation Check
```bash
# Verify Docker
docker --version
docker-compose --version

# Verify Git
git --version

# Check available ports
netstat -tulpn | grep -E ':(80|3000|3001|3002|3003|4040|7071|8888|9090|11434)'
```

### Post-Installation Verification
```bash
# Health check all services
curl http://localhost:8888/health

# Verify individual services
curl http://localhost:3001/health
curl http://localhost:3002/health  
curl http://localhost:3003/health

# Check Ollama models
docker exec agent-local-llm ollama list
```

---

**Next:** [Quick Setup Guide](../../README.md#quick-start) for installation instructions.
