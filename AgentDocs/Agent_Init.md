# 🚀 System Initialization Guide

## Quick Start (IMMER ZUERST!)

**1. System starten:**
```bash
docker-compose up -d --build
```

**2. Status prüfen:**
```bash
docker-compose ps
```

**3. ngrok Tunnel Status prüfen:**
- **Web Interface**: http://localhost:4040 (läuft im Container!)
- **Traffic Inspector**: http://localhost:4040/inspect/http
- **API Tunnels**: http://localhost:4040/api/tunnels
- Kopiere die "public_url" (z.B. `https://xxxxx.ngrok-free.app`)
- **Diese URL ist für Azure DevOps Webhooks zu verwenden!**

**4. Webhook URL für ADO:**
```
https://xxxxx.ngrok-free.app/webhook/ado
```

## Alternative: GitHub Codespaces
```bash
cd ops/compose
docker compose up -d --build
```
- ✅ Automatisches Port-Forwarding
- ✅ HTTPS URLs out-of-the-box  
- ✅ Kein ngrok nötig!

## Troubleshooting
```bash
# Alles neu starten
docker-compose down
docker-compose up -d --build

# ngrok Container Status prüfen
docker logs aiforcoding-ngrok-1

# ngrok Web Interface testen
curl http://localhost:4040/api/tunnels
```

## ngrok Container Setup (NEW!)

**Das ngrok System läuft jetzt vollständig containerized:**

### Konfiguration
- **Config File**: `services/ngrok/ngrok.yml` 
- **Key Setting**: `web_addr: 0.0.0.0:4040` (ermöglicht externe Zugriffe)
- **Auth Token**: Automatisch aus Environment Variable `NGROK_AUTHTOKEN`
- **Target**: Gateway Service (`gateway:8080`) im Docker Network

### Web Interface Features
- **Dashboard**: http://localhost:4040
- **Live Traffic**: http://localhost:4040/inspect/http
- **API**: http://localhost:4040/api/tunnels
- **Tunnel Configuration**: Automatisch beim Container Start

### Vorteile der Container-Lösung
- ✅ **Automatischer Start** mit `docker-compose up -d`
- ✅ **Persistente Konfiguration** (überlebt Neustarts)
- ✅ **Integriert in Docker Network** (direkter Gateway Zugriff)
- ✅ **Web Interface immer verfügbar** auf localhost:4040
- ✅ **Keine manuelle ngrok Installation** nötig

**ngrok läuft jetzt vollständig im Container:**
- ✅ Automatischer Start mit docker-compose
- ✅ Web Interface erreichbar über localhost:4040
- ✅ Konfiguration über ngrok.yml mit web_addr: 0.0.0.0:4040
- ✅ Environment Variable NGROK_AUTHTOKEN wird automatisch eingesetzt
