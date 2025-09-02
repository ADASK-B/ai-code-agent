# 🔧 ngrok Container Configuration

## Overview
Vollständige Dokumentation der ngrok Container-Implementierung für Azure DevOps Webhook Tunneling.

## Container Setup

### Dateien
```
services/ngrok/
├── Dockerfile          # Container Konfiguration
├── entrypoint.sh       # Startup Script mit Environment Variable Ersetzung
└── ngrok.yml          # ngrok Konfigurationsdatei
```

### ngrok.yml Konfiguration
```yaml
authtoken: ${NGROK_AUTHTOKEN}
web_addr: 0.0.0.0:4040  # ← CRITICAL: Ermöglicht externe Zugriffe
version: 2

tunnels:
  web:
    proto: http
    addr: gateway:8080   # Docker Network Target
    schemes: [https]
    inspect: true
```

### entrypoint.sh Script
```bash
#!/bin/sh
# Replace environment variable in config
sed "s/\${NGROK_AUTHTOKEN}/$NGROK_AUTHTOKEN/g" /ngrok.yml > /tmp/ngrok.yml
exec ngrok start --config /tmp/ngrok.yml web
```

### Dockerfile
```dockerfile
FROM ngrok/ngrok:latest
COPY --chmod=755 entrypoint.sh /entrypoint.sh
COPY ngrok.yml /ngrok.yml
ENTRYPOINT ["/entrypoint.sh"]
```

## Docker Compose Integration
```yaml
ngrok:
  build:
    context: ./services/ngrok
    dockerfile: Dockerfile
  ports:
    - "4040:4040"  # ngrok Web Interface
  environment:
    - NGROK_AUTHTOKEN=${NGROK_AUTHTOKEN}
  networks:
    - default
  depends_on:
    - gateway
```

## Web Interface Features

### Endpoints
- **Dashboard**: http://localhost:4040
- **Traffic Inspector**: http://localhost:4040/inspect/http
- **API**: http://localhost:4040/api/tunnels
- **Status**: http://localhost:4040/status

### API Usage
```bash
# Get tunnel information
curl http://localhost:4040/api/tunnels

# Get specific tunnel
curl http://localhost:4040/api/tunnels/web
```

## Troubleshooting

### Container nicht erreichbar
```bash
# Container Status prüfen
docker ps | grep ngrok

# Logs anschauen
docker logs aiforcoding-ngrok-1

# Container neu starten
docker-compose restart ngrok
```

### Web Interface funktioniert nicht
- **Problem**: ngrok bindet an 127.0.0.1:4040 statt 0.0.0.0:4040
- **Lösung**: `web_addr: 0.0.0.0:4040` in ngrok.yml
- **Test**: `curl http://localhost:4040/api/tunnels`

### Tunnel wird nicht erstellt
```bash
# Environment Variable prüfen
docker exec aiforcoding-ngrok-1 env | grep NGROK

# Konfiguration prüfen
docker exec aiforcoding-ngrok-1 cat /tmp/ngrok.yml

# Gateway erreichbar?
docker exec aiforcoding-ngrok-1 nc -zv gateway 8080
```

## Migration von Native zu Container

### Vorher (Native)
```bash
ngrok http 8080 --authtoken=... --log=stdout
```

### Nachher (Container)
```bash
docker-compose up -d ngrok
```

### Vorteile
- ✅ **Automatischer Start** mit System
- ✅ **Persistente Konfiguration**
- ✅ **Integriert in Docker Network**
- ✅ **Einfache Wartung**
- ✅ **Consistent Environment**
