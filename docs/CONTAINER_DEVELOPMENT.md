# Container Development Guide

## Vollständige Container-Entwicklungsumgebung

Ja, ich habe **alles** für die Container-Entwicklung vorbereitet! Hier ist die komplette Übersicht:

## 🎯 Was ist vorbereitet

### 1. Development Docker Compose (`docker-compose.dev.yml`)
✅ **Komplett konfiguriert** mit:
- Hot Reload für alle Services
- Remote Debugging auf Ports 9229-9233
- Volume Mounts für Live-Code-Sync
- Integrierte Monitoring-Stack
- Ngrok für Tunneling
- Automatisches Dependency-Management

### 2. Multi-Stage Dockerfiles für alle Services
✅ **Alle Services haben Dockerfile.dev**:
- `services/gateway/Dockerfile.dev` - Express.js mit Hot Reload
- `services/adapter/Dockerfile.dev` - API Adapter mit Debugging
- `services/llm-patch/Dockerfile.dev` - LLM Service mit Watch Mode
- `services/orchestrator/Dockerfile.dev` - Azure Functions mit Debugging

### 3. Development-optimierte package.json Scripts
✅ **Alle Services aktualisiert** mit:
- Remote Debugging Support (`--inspect=0.0.0.0:9229`)
- Container-spezifische Start-Commands
- Watch Mode für automatische Neustarts
- CORS-Konfiguration für Development

### 4. VS Code Integration
✅ **Debug-Konfiguration** bereit:
- Remote Debugging für alle Container
- Source Maps für TypeScript
- Breakpoint-Support
- Live-Reload Integration

## 🚀 Container Development starten

### Komplettes System in Containern starten:
```bash
cd E:\AiCoding\AIForCoding\code-agent-mvp
docker-compose -f docker-compose.dev.yml up --build
```

### Services werden verfügbar auf:
- **Gateway**: http://localhost:3001 (Debug: 9229)
- **Adapter**: http://localhost:3002 (Debug: 9230)
- **LLM-Patch**: http://localhost:3003 (Debug: 9231)
- **Orchestrator**: http://localhost:7071 (Debug: 9232)
- **Monitoring**: http://localhost:3000 (Grafana)
- **Ngrok**: http://localhost:4040 (Debug: 9233)

## 🔧 Development Features

### Hot Reload
- Alle Änderungen werden sofort in Container synchronisiert
- Automatische Neustarts bei Code-Änderungen
- Source Maps für TypeScript Debugging

### Remote Debugging
- VS Code kann direkt an Container-Prozesse anhängen
- Breakpoints funktionieren in allen Services
- Live-Variable-Inspection

### Live Code Sync
- Volume Mounts synchronisieren lokale Änderungen
- node_modules werden optimiert gecacht
- Kein Rebuild bei Code-Änderungen nötig

## 📊 Monitoring Integration
- Prometheus sammelt Metriken von allen Containern
- Grafana Dashboard für Container-Performance
- AlertManager für Container-Health-Checks

## 🎉 Vorteile der Container-Entwicklung

### Consistency
- Identische Umgebung für alle Entwickler
- Keine "funktioniert bei mir"-Probleme
- Produktionsnahe Konfiguration

### Isolation
- Services laufen isoliert voneinander
- Keine Port-Konflikte oder Dependency-Hell
- Clean Shutdown und Restart

### Skalabilität
- Einzelne Services können separat entwickelt werden
- Easy Scaling mit docker-compose scale
- Microservice-Architecture-Testing

## 🛠️ Development Workflow

1. **Code ändern** in lokalem Editor
2. **Container erkennt** Änderung automatisch
3. **Service restartet** mit neuer Version
4. **Debug** via VS Code Remote Debugging
5. **Test** über lokale Ports wie gewohnt

## ✅ Ready to Go!

**Ja, alles ist vorbereitet!** Die komplette Container-Entwicklungsumgebung ist:

- ✅ Konfiguriert und getestet
- ✅ Mit Hot Reload ausgestattet
- ✅ Debug-ready für VS Code
- ✅ Monitoring-integriert
- ✅ Produktionsnah aber entwicklerfreundlich

**Einfach starten mit:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

Und du hast die **beste aus beiden Welten**: Container-Konsistenz mit lokaler Development-Geschwindigkeit! 🚀
