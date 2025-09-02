# 🐛 Troubleshooting Guide

## Quick Diagnostics

### System Status Check
```bash
# Alle Container Status
docker-compose ps

# Spezifische Container Logs
docker logs aiforcoding-gateway-1 --tail 20
docker logs aiforcoding-ngrok-1 --tail 20
docker logs aiforcoding-adapter-1 --tail 20
```

### Port Availability
```bash
# Windows PowerShell
Test-NetConnection -ComputerName localhost -Port 8080
Test-NetConnection -ComputerName localhost -Port 4040

# Alternative mit netstat
netstat -an | findstr ":8080"
netstat -an | findstr ":4040"
```

## Common Issues

### 🔴 ngrok Web Interface nicht erreichbar
**Problem**: localhost:4040 antwortet nicht

**Lösung**:
```bash
# 1. Container Status prüfen
docker logs aiforcoding-ngrok-1

# 2. Port Mapping prüfen
docker port aiforcoding-ngrok-1

# 3. Container neu starten
docker-compose restart ngrok

# 4. Web Interface testen
curl http://localhost:4040/api/tunnels
```

### 🔴 Gateway Health Check fehlgeschlagen
**Problem**: curl http://localhost:8080/health gibt Fehler

**Lösung**:
```bash
# 1. Gateway Container prüfen
docker logs aiforcoding-gateway-1 --tail 20

# 2. Container neu starten
docker-compose restart gateway

# 3. Health Check erneut testen
curl http://localhost:8080/health
```

### 🔴 Webhook empfängt keine Daten
**Problem**: Azure DevOps Webhooks kommen nicht an

**Lösung**:
```bash
# 1. ngrok Tunnel Status prüfen
curl http://localhost:4040/api/tunnels

# 2. Traffic Inspector öffnen
# Browser: http://localhost:4040/inspect/http

# 3. Test Webhook senden
curl -X POST https://xxxxx.ngrok-free.app/webhook/ado \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# 4. Gateway Logs prüfen
docker logs aiforcoding-gateway-1 --follow
```

### 🔴 Container startet nicht
**Problem**: docker-compose up -d schlägt fehl

**Lösung**:
```bash
# 1. Alle Container stoppen
docker-compose down

# 2. Images neu bauen
docker-compose build --no-cache

# 3. System neu starten
docker-compose up -d

# 4. Einzelne Container prüfen
docker-compose logs gateway
docker-compose logs ngrok
```

## Performance Issues

### 🟡 Langsame Antwortzeiten
```bash
# 1. Container Ressourcen prüfen
docker stats

# 2. Logs auf Errors prüfen
docker-compose logs | grep -i error

# 3. Ollama Status prüfen (falls LLM verwendet)
curl http://localhost:11434/api/version
```

### 🟡 Hohe CPU/Memory Usage
```bash
# 1. Container Metriken
docker stats --no-stream

# 2. Monitoring Dashboard
# Browser: http://localhost:3000 (Grafana)

# 3. Prometheus Metriken
curl http://localhost:9090/metrics
```

## Network Issues

### 🔴 Container können sich nicht erreichen
```bash
# 1. Docker Network prüfen
docker network ls
docker network inspect aiforcoding_default

# 2. Container Network Test
docker exec aiforcoding-gateway-1 ping adapter
docker exec aiforcoding-ngrok-1 ping gateway

# 3. DNS Resolution Test
docker exec aiforcoding-gateway-1 nslookup adapter
```

## Emergency Reset

### 🆘 Kompletter System Reset
```bash
# 1. Alle Container und Volumes löschen
docker-compose down -v
docker system prune -a --volumes

# 2. Images neu bauen
docker-compose build --no-cache

# 3. System neu starten
docker-compose up -d

# 4. Status prüfen
docker-compose ps
curl http://localhost:4040/api/tunnels
curl http://localhost:8080/health
```

## Log Analysis

### Wichtige Log Patterns
```bash
# ngrok Tunnel erstellt
docker logs aiforcoding-ngrok-1 | grep "started tunnel"

# Gateway Health Checks
docker logs aiforcoding-gateway-1 | grep "health"

# Webhook Requests
docker logs aiforcoding-gateway-1 | grep "webhook"

# Errors
docker-compose logs | grep -i "error\|exception\|failed"
```

## Contact & Support

### Häufige Befehle Sammlung
```bash
# Quick Health Check aller Services
curl -s http://localhost:8080/health && echo " Gateway OK"
curl -s http://localhost:4040/api/tunnels > /dev/null && echo " ngrok OK"
curl -s http://localhost:8082/health && echo " Adapter OK"
curl -s http://localhost:11434/api/version > /dev/null && echo " Ollama OK"
```
