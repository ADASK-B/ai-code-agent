# 🚀 Deployment Scripts

This directory contains essential scripts for system deployment and management.

## 📋 Available Scripts

### `start-full-system.ps1` / `start-full-system.sh`
**Complete system startup with health checks**
- Starts all 16 services (Core + Monitoring)
- Automatic health verification
- Cross-platform support (Windows PowerShell & Linux Bash)

```powershell
# Windows
.\scripts\start-full-system.ps1

# Linux/macOS
./scripts/start-full-system.sh
```

### `start-ngrok.ps1`
**ngrok tunnel management with retry logic**
- Starts ngrok for public URL exposure
- Retry mechanism for stable startup
- Provides Azure DevOps webhook URL

```powershell
.\scripts\start-ngrok.ps1
```

## 🔧 Usage

1. **First-time setup:** Ensure `.env` file exists (copy from `.env.example`)
2. **Start system:** Run the appropriate start script for your platform
3. **Public access:** Use ngrok script if external access needed

## 📊 Health Check Endpoints

The startup scripts verify these endpoints:
- **Core Services:** Gateway, Adapter, LLM-Patch, Orchestrator, Azurite
- **Monitoring:** Grafana, Prometheus, Node Exporter, cAdvisor
- **Infrastructure:** Traefik, ngrok
