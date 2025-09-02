# 🚀 Container-System Start nach PC-Neustart

## ⚡ SCHNELL-START (Ein Kommando)

```powershell
cd E:\AiCoding\AIForCoding\code-agent-mvp
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 SCHRITT-FÜR-SCHRITT Anleitung

### 1. Terminal öffnen und ins richtige Verzeichnis
```powershell
cd E:\AiCoding\AIForCoding\code-agent-mvp
```

### 2. Container-System starten
```powershell
# Startet alle Container im Hintergrund (-d = detached)
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Status prüfen
```powershell
# Zeigt alle laufenden Container
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🎯 WAS GESTARTET WIRD

### Container-Services:
- ✅ **Gateway** (Port 3001) + Debug (9230)
- ✅ **Adapter** (Port 3002) + Debug (9231)  
- ✅ **LLM-Patch** (Port 3003) + Debug (9232)
- ✅ **Orchestrator** (Port 7071)
- ✅ **Azurite Storage** (Ports 10000-10002)

### Monitoring Stack:
- ✅ **Prometheus** (Port 9090)
- ✅ **Grafana** (Port 3000)
- ✅ **AlertManager** (bei Bedarf)

### Development Tools:
- ⚠️ **Ngrok** (Port 4040) - Aktuell NICHT gestartet
  - **Grund:** Port-Konflikt mit lokalem ngrok
  - **Container:** Bereit, aber gestoppt
- ❌ **Traefik Reverse Proxy** - Nicht im aktuellen Setup

## 🔧 TROUBLESHOOTING

### Falls ein Container nicht startet:
```powershell
# Logs eines spezifischen Containers anzeigen
docker logs code-agent-mvp-orchestrator-1

# Container einzeln neustarten
docker restart code-agent-mvp-orchestrator-1
```

### Falls Port-Konflikte auftreten:
```powershell
# Alle lokalen Container stoppen
docker stop $(docker ps -q)

# Dann normal starten
docker-compose -f docker-compose.dev.yml up -d
```

### Ngrok Container aktivieren:
```powershell
# 1. Lokalen ngrok stoppen (falls läuft)
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process

# 2. Ngrok Container starten
docker-compose -f docker-compose.dev.yml up ngrok -d
```

### Reverse Proxy hinzufügen (Optional):
```powershell
# Traefik für intelligentes Routing
# (Separate Konfiguration erforderlich)
```

## ✅ QUICK CHECK

### Services testen:
```powershell
# Gateway Health Check (kann initial Verbindungsabbruch haben)
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Adapter Health Check
Invoke-RestMethod -Uri "http://localhost:3002/health"

# LLM-Patch Health Check  
Invoke-RestMethod -Uri "http://localhost:3003/health"

# Orchestrator Check (Azure Functions)
Invoke-RestMethod -Uri "http://localhost:7071/api/health" -ErrorAction SilentlyContinue

# Prometheus Check
Invoke-RestMethod -Uri "http://localhost:9090/-/healthy"

# Grafana Check
Invoke-RestMethod -Uri "http://localhost:3000/api/health"
```

### Ngrok Status prüfen:
```powershell
# Container Status
docker ps | findstr ngrok

# Ngrok Dashboard (falls Container läuft)
# http://localhost:4040
```

## 🎮 DEVELOPMENT FEATURES

### Hot Reload:
- Alle Code-Änderungen werden automatisch übernommen
- Kein Neustart der Container nötig

### Remote Debugging:
- VS Code kann sich an Container anhängen
- Debug-Ports: 9230 (Gateway), 9231 (Adapter), 9232 (LLM-Patch)

### Live Monitoring:
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

## ⚠️ WICHTIGE HINWEISE

1. **KEIN BUILD nötig** beim normalen Start
2. **Images sind bereits gebaut** und bleiben nach Neustart erhalten
3. **Nur bei Code-Änderungen** an Dockerfiles: `--build` verwenden
4. **Volume-Daten bleiben erhalten** (node_modules, etc.)
5. **Ngrok Container** ist vorbereitet, aber aktuell gestoppt (Port-Konflikt)
6. **Lokaler ngrok** blockiert möglicherweise Port 4040

## 🌐 DEVELOPMENT OPTIONEN

### Option A: Vollständig containerisiert
```powershell
# Lokalen ngrok stoppen und Container-ngrok nutzen
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process
docker-compose -f docker-compose.dev.yml up ngrok -d
```

### Option B: Hybrid (aktuell)
```powershell
# Lokaler ngrok läuft weiter (PID prüfen mit: Get-Process ngrok)
# Container-Services laufen isoliert
```

### Option C: Mit Reverse Proxy
```powershell
# Traefik für intelligentes Load Balancing
# (Erfordert zusätzliche Konfiguration)
```

## 🚨 NOTFALL: Kompletter Rebuild

Falls etwas schiefgeht:
```powershell
# Alles stoppen und neu bauen
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d
```

---

**Nach PC-Neustart einfach:**
```powershell
cd E:\AiCoding\AIForCoding\code-agent-mvp && docker-compose -f docker-compose.dev.yml up -d
```

**Das wars! 🎉**
