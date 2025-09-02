# 🏥 Health Check Service

**Docker-nativer Health Monitor für das Code Agent MVP System.**

## 🎯 Überblick

Der Health Check Service ist ein **Node.js Container** der alle anderen Services überwacht:

- ✅ **Container Status** - Prüft Docker Container über Docker Socket
- ✅ **HTTP Health Checks** - Testet Service Endpoints im Docker Network  
- ✅ **Web Dashboard** - Live Status auf Port 8888
- ✅ **JSON API** - Maschinenlesbarer Status für externe Tools
- ✅ **Kontinuierliche Überwachung** - Automatische Checks alle 30s
- ✅ **Traefik Integration** - Erreichbar über Reverse Proxy

## 🚀 Schnellstart

```bash
# Alle Services + Health Monitor starten
cd ops/compose
docker compose up -d --build

# Dashboard öffnen
http://localhost:8888
```

## 📊 Status Zugriff

| Service | URL | Beschreibung |
|---------|-----|--------------|
| **Dashboard** | http://localhost:8888 | HTML Dashboard mit Auto-Refresh |
| **API** | http://localhost:8888/health | JSON Status für Scripts/Tools |
| **Traefik** | http://localhost/health-monitor | Via Reverse Proxy |

### API Response Beispiel:
```json
{
  "status": "HEALTHY",
  "timestamp": "2025-08-31T10:15:30.000Z",
  "services": {
    "Gateway": { "status": "OK", "container": true, "health": true },
    "Orchestrator": { "status": "OK", "container": true, "health": true }
  },
  "summary": { "total": 6, "passed": 6, "failed": 0, "successRate": 100 }
}
```

## 🔍 Status Bedeutungen

### Overall Status
- **HEALTHY** 🟢 - Alle Services laufen perfekt
- **DEGRADED** 🟡 - Mehr als 50% der Services laufen
- **UNHEALTHY** 🔴 - Weniger als 50% der Services laufen
- **UNKNOWN** ⚪ - Status noch nicht ermittelt

### Service Status
- **OK** ✅ - Container läuft und HTTP Health Check erfolgreich
- **FAIL** ❌ - Container nicht da oder HTTP Health Check fehlgeschlagen

## 🐳 Integration in Docker Compose

Der Health Monitor ist automatisch in `docker-compose.yml` integriert:

```yaml
health-monitor:
  build:
    context: ../../health-check
  container_name: agent-health-monitor
  ports:
    - "8888:8888"
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
  depends_on:
    - gateway
    - orchestrator
    - adapter
    - llm-patch
    - traefik
    - azurite
```

## � Quick Commands

```bash
# System Status prüfen
curl http://localhost:8888/health | jq .status

# Health Monitor Logs
docker logs -f agent-health-monitor

# Alle Agent Container anzeigen  
docker ps --filter "name=agent-"

# Health Monitor neu starten
docker restart agent-health-monitor
```

## 🚨 Troubleshooting

**Services werden nicht erkannt:**
```bash
# Container im gleichen Network?
docker network inspect code-agent-mvp_agent-network

# Service direkt testen
curl http://localhost:3001/health  # Gateway
curl http://localhost:7071/admin/host/ping  # Orchestrator
```

**Health Monitor startet nicht:**
```bash
# Docker Socket verfügbar?
ls -la /var/run/docker.sock

# Container neu bauen
cd health-check && docker build -t code-agent-health . --no-cache
```

---

**🎯 Verwendung:** Der Health Monitor läuft automatisch und zeigt dir sofort ob alles funktioniert!

**💡 Tipp:** Bookmark das Dashboard für schnellen Status-Check: `http://localhost:8888`
