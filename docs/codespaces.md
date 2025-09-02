# GitHub Codespaces Setup für Code Agent MVP

## Quick Start in Codespaces

1. **Repository in Codespaces öffnen**
   - Auf GitHub: "Code" → "Codespaces" → "Create codespace"
   - Automatischer Setup mit DevContainer

2. **Services starten**
   ```bash
   cd ops/compose
   
   # Mit lokalem LLM (CodeQwen 7B)
   docker compose -f docker-compose.yml -f docker-compose.local-llm.yml up -d --build
   
   # Oder ohne LLM (stub mode)
   docker compose up -d --build
   ```

3. **Port Forwarding prüfen**
   - VS Code zeigt automatisch forwarded ports
   - Gateway: `https://<codespace-name>-80.app.github.dev`
   - Dashboard: `https://<codespace-name>-8080.app.github.dev`

## Warum Codespaces perfekt funktioniert:

### ✅ **Docker-in-Docker Support**
- Alle Services laufen in Containern
- Keine lokale Installation nötig
- Konsistente Umgebung

### ✅ **Automatisches Port Forwarding**
- GitHub forwarded alle Ports automatisch
- HTTPS-URLs für Webhooks verfügbar
- Keine ngrok nötig!

### ✅ **Optimiert für Cloud Development**
- `devcontainer.json` installiert alle Tools
- TypeScript/Node.js/Docker vorkonfiguriert
- Azure Functions Core Tools included

### ✅ **Webhook-Ready**
- Forwarded Ports sind öffentlich erreichbar
- GitHub URLs sind HTTPS (ADO webhook kompatibel)
- Format: `https://<codespace>-80.app.github.dev/gateway/webhook/ado`

## CodeQwen1.5-7B Model Details

**Warum das beste kleine Coding-Model:**
- **Größe**: Nur 7B Parameter (~4GB RAM)
- **Spezialisiert**: Auf Code-Generierung trainiert
- **Sprachen**: TypeScript, Python, Java, Go, etc.
- **Qualität**: Besser als größere General-Purpose Models
- **Speed**: ~2-5 Sekunden pro Patch

**Alternative kleine Models:**
```bash
# Noch kleiner (aber schlechter):
ollama pull deepseek-coder:1.3b    # 1.3B Parameter
ollama pull phi3:mini              # 3.8B Parameter

# Größer aber besser:
ollama pull codeqwen:14b-chat      # 14B Parameter
ollama pull deepseek-coder:6.7b    # 6.7B Parameter
```

## Startup Commands für Codespaces

```bash
# 1. Lokales LLM starten (empfohlen)
cd ops/compose
docker compose -f docker-compose.yml -f docker-compose.local-llm.yml up -d --build

# 2. Warten bis Model geladen (ca. 2-3 Minuten)
docker logs code-agent-ollama-setup -f

# 3. Health Check
curl http://localhost:11434/api/tags

# 4. Test Gateway
curl https://<codespace>-80.app.github.dev/health
```

## GitHub Codespaces Vorteile

1. **Sofort produktiv** - Null Setup-Zeit
2. **Überall verfügbar** - Browser genügt
3. **Skalierbar** - 2-32 CPU Cores wählbar
4. **Kostengünstig** - Nur bei Nutzung
5. **Team-Ready** - Geteilte Umgebungen
6. **HTTPS out-of-the-box** - Keine ngrok/Tunnel nötig

Das System ist **perfekt** für GitHub Codespaces optimiert! 🚀
