# 🔍 Docker Services Vergleich - Was fehlt!

## ❌ **AKTUELL LAUFEND (Minimal Setup):**
```
code-agent-gateway-simple   → node:20-alpine (Port 3001)
code-agent-traefik         → traefik:v3.0 (Port 80, 8080)
```

## ✅ **SOLLTE LAUFEN (Vollständiges System):**

| **Service** | **Container Name** | **Image** | **Port** | **Zweck** |
|-------------|-------------------|-----------|----------|-----------|
| **Gateway** | agent-gateway | Custom Build | 8080 | Webhook-Empfang |
| **Orchestrator** | agent-orchestrator | Azure Functions | 7071 | Workflow-Management |
| **Adapter** | agent-adapter | Custom Build | 8081 | Azure DevOps API |
| **LLM-Patch** | agent-llm-patch | Custom Build | 8082 | Code-Generierung |
| **Traefik** | agent-traefik | traefik:v3.0 | 80/8080 | Reverse Proxy |
| **Azurite** | agent-azurite | Azure Storage | 10000-10002 | Storage Emulator |
| **Supabase** | agent-supabase | postgres | 54322 | Database |

## 🚨 **PROBLEM IDENTIFIZIERT:**

### **Warum nur 2 Container laufen:**
1. ❌ Wir verwenden `docker-compose.local.yml` (minimal)
2. ❌ Statt `docker-compose.yml` (vollständig)
3. ❌ Services fehlen: Orchestrator, Adapter, LLM-Patch, Azurite, Supabase

### **Was fehlt für vollständige Funktionalität:**
- ❌ **Orchestrator** - Kann keine Workflows ausführen
- ❌ **Adapter** - Kann nicht mit Azure DevOps kommunizieren  
- ❌ **LLM-Patch** - Kann keine Code-Patches generieren
- ❌ **Database** - Kann keine Jobs persistieren
- ❌ **Storage** - Kann keine States verwalten

## 🔧 **LÖSUNG:**

### **Option A: Vollständiges System starten**
```bash
cd ops/compose
docker compose down  # Stoppe minimal setup
docker compose up -d --build  # Starte vollständiges System
```

### **Option B: Entwickler-Setup mit allen Services**
```bash
docker compose -f docker-compose.yml -f docker-compose.local-llm.yml up -d --build
```

### **Option C: Schrittweise Services hinzufügen**
```bash
# Erst Orchestrator
docker compose up orchestrator -d

# Dann Adapter  
docker compose up adapter -d

# Dann LLM-Patch
docker compose up llm-patch -d
```

## 🎯 **EMPFEHLUNG:**

### **Für lokale Entwicklung:**
```bash
# Stoppe current minimal setup
docker compose -f docker-compose.local.yml down

# Starte vollständiges Development System
docker compose up -d --build

# Prüfe Status
docker compose ps
```

### **Erwartete Container nach vollständigem Start:**
```
agent-gateway      ✅ Webhook receiver
agent-orchestrator ✅ Workflow management  
agent-adapter      ✅ Azure DevOps integration
agent-llm-patch    ✅ Code generation
agent-traefik      ✅ Reverse proxy
agent-azurite      ✅ Storage emulator
```

## 💡 **FAZIT:**

**Du hattest recht - wir laufen nur mit 20% des Systems!** 

Um den **echten Code Agent** zu haben, müssen wir das vollständige Docker Compose Setup starten mit allen 6-7 Services.

**Nächster Schritt:** Vollständiges System hochfahren! 🚀
