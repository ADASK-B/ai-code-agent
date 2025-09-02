# Lokale Entwicklung mit ngrok

Diese Anleitung führt Sie durch das Setup einer vollständigen lokalen Entwicklungsumgebung mit ngrok für ADO-Webhook-Integration.

## Prerequisites

- **Node.js 20+** mit npm
- **Docker & Docker Compose**
- **ngrok Account** mit Auth Token
- **Azure DevOps** Projekt mit Admin-Rechten

## Setup-Schritte

### 1. Repository klonen und Abhängigkeiten

```bash
git clone <repo-url>
cd code-agent-mvp
```

### 2. ngrok konfigurieren

```bash
# ngrok Account erstellen: https://ngrok.com/signup
# Auth Token aus Dashboard kopieren

cd ops/dev/ngrok
cp ngrok.yml.example ngrok.yml

# ngrok.yml editieren - Ihren Auth Token eintragen
```

**ngrok.yml:**
```yaml
version: 2
authtoken: YOUR_NGROK_TOKEN_HERE
tunnels:
  gateway:
    proto: http
    addr: 80
    schemes:
      - https
    inspect: false
```

### 3. Environment Variables

```bash
cd ops/compose
cp .env.example .env
```

**Wichtige Variablen in .env:**
```bash
# Webhook Security
WEBHOOK_SECRET=dev-change-me-secure-secret

# Azure DevOps
ADO_ORG=your-org
ADO_PROJECT=your-project  
ADO_TOKEN=your-personal-access-token

# LLM Provider
LLM_PROVIDER=stub  # stub|anthropic|openai
ANTHROPIC_API_KEY=  # Optional: für echte Claude-Integration

# Developer ID (für Multi-Dev)
DEV_ID=alice  # Eindeutige ID pro Entwickler
```

### 4. ADO Personal Access Token erstellen

1. ADO → User Settings → Personal Access Tokens
2. **Name:** `code-agent-dev-token`
3. **Scopes:**
   - Code: Read & Write
   - Pull Requests: Read & Write
   - Project and Team: Read
4. Token kopieren → in `.env` als `ADO_TOKEN`

### 5. Services starten

```bash
cd ops/compose
docker compose up -d --build

# Logs verfolgen
docker compose logs -f
```

**Services Check:**
```bash
# Gateway Health
curl http://localhost/gateway/health

# Adapter Health  
curl http://localhost/adapter/health

# LLM-Patch Health
curl http://localhost/llm/health

# Orchestrator Health
curl http://localhost:7071/api/health
```

### 6. ngrok Tunnel starten

```bash
cd ops/dev/ngrok
ngrok start --all --config ngrok.yml
```

**Output sollte zeigen:**
```
Forwarding    https://abc123.ngrok.io -> http://localhost:80
```

### 7. ADO Service Hook konfigurieren

1. **ADO Projekt** → Settings → Service Hooks
2. **Create subscription**
3. **Service:** Web Hooks
4. **Event:** Pull request commented
5. **URL:** `https://abc123.ngrok.io/gateway/webhook/ado`
6. **HTTP Headers:** 
   ```
   Content-Type: application/json
   X-ADO-Event: pullrequest.commented
   ```
7. **Resource details:** All
8. **Messages:** All
9. **Test** → sollte 200 OK zurückgeben

### 8. Webhook Secret setzen

**Option A: ADO GUI (falls verfügbar)**
- Service Hook → Settings → Basic auth oder Custom headers
- Header: `X-Hub-Signature-256: sha256=<computed-hmac>`

**Option B: REST API**
```bash
# Webhook Secret via ADO REST API setzen
curl -X PATCH \
  -H "Authorization: Basic $(echo -n ':YOUR_PAT' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"consumerInputs":{"httpHeaders":"X-Webhook-Secret: dev-change-me-secure-secret"}}' \
  "https://dev.azure.com/your-org/_apis/hooks/subscriptions/{subscription-id}?api-version=7.0"
```

## Test End-to-End

### 1. Test-PR erstellen

```bash
# Neuen Branch im ADO-Repo erstellen
git checkout -b test-ai-agent
echo "# Test File" > test.md
git add test.md
git commit -m "Add test file"
git push origin test-ai-agent

# PR über ADO GUI erstellen
```

### 2. AI-Agent triggern

**Kommentar in PR schreiben:**
```
/edit /2 Add more content to README file
```

### 3. Erwartete Outputs

**In ADO PR - Start Comment:**
```
🤖 **AI Agent gestartet**

**Intent:** Add more content to README file
**Varianten:** 2
**Job ID:** job_abc123

Erstelle Branches:
- users/alice/add-more-content-readme/v1  
- users/alice/add-more-content-readme/v2

⏳ Verarbeitung läuft...
```

**DONE Comments (je Variante):**
```
✅ **DONE v1** 
**Branch:** users/alice/add-more-content-readme/v1
**PR:** #456 🔧 AI Edit v1: add-more-content-readme
**Status:** success
```

**Final Overview:**
```
🎯 **AI Agent abgeschlossen**

**Ergebnisse:**
- ✅ **v1:** PR #456 (3 Dateien geändert)
- ✅ **v2:** PR #457 (2 Dateien geändert)

**Status:** 2/2 erfolgreich
```

### 4. Logs überprüfen

```bash
# Gateway Logs
docker compose logs gateway

# Orchestrator Logs  
docker compose logs orchestrator

# Adapter Logs
docker compose logs adapter

# Alle Logs mit Filter
docker compose logs | grep "corr-id=abc123"
```

## Multi-Developer Setup

### Profile-basierte Isolation

**alice.override.yml:**
```yaml
version: '3.8'
services:
  traefik:
    ports:
      - "80:80"
      - "8080:8080"
  gateway:
    environment:
      - DEV_ID=alice
  orchestrator:
    ports:
      - "7071:7071"
```

**bob.override.yml:**
```yaml
version: '3.8'
services:
  traefik:
    ports:
      - "81:80"  # Anderer Port
      - "8081:8080"
  gateway:
    environment:
      - DEV_ID=bob
  orchestrator:
    ports:
      - "7072:7071"  # Anderer Port
```

**Starten mit Profile:**
```bash
# Alice
docker compose -f docker-compose.yml -f profiles/alice.override.yml up -d

# Bob  
docker compose -f docker-compose.yml -f profiles/bob.override.yml up -d
```

## Troubleshooting

### Gateway erreicht ngrok nicht

```bash
# ngrok Status
ngrok status

# Local Gateway Test
curl -v http://localhost/gateway/health

# ngrok Logs
ngrok http 80 --log=stdout
```

### ADO Webhook funktioniert nicht

```bash
# Webhook-Signatur Debug
echo -n '{"eventType":"git.pullrequest.commented"}' | \
  openssl dgst -sha256 -hmac "dev-change-me-secure-secret" -binary | \
  openssl base64
```

### Orchestrator startet nicht

```bash
# Azure Functions Core Tools lokal
cd services/orchestrator
npm install
npm run start:host

# Container Debug
docker compose exec orchestrator bash
cd /home/site/wwwroot
ls -la
```

### LLM-Service Fehler

```bash
# Stub-Modus testen
curl -X POST http://localhost/llm/patch \
  -H "Content-Type: application/json" \
  -d '{"intent":"test intent","files":[]}'

# Claude API Test (falls konfiguriert)
export ANTHROPIC_API_KEY="your-key"
docker compose restart llm-patch
```

### Branch/PR-Erstellung fehlschlägt

```bash
# ADO Token Permissions prüfen
curl -H "Authorization: Basic $(echo -n ':YOUR_PAT' | base64)" \
  "https://dev.azure.com/your-org/_apis/projects/your-project?api-version=7.0"

# Git Credentials
docker compose exec adapter bash
git config --list
```

## Performance & Limits

### Lokale Limits

- **Gleichzeitige Varianten:** 5 (Orchestrator)
- **Max Patch Size:** 200KB
- **Timeout pro Variante:** 8 Minuten
- **Rate Limit:** 10 RPS (Adapter)

### ngrok Limits (Free Account)

- **1 simultaner Tunnel**
- **40 connections/minute**
- **Tunnel-URLs ändern sich** bei Neustart

**Upgrade auf ngrok Pro empfohlen für:**
- Feste URLs
- Mehr Tunnels
- Höhere Limits

## Nächste Schritte

1. **Cloud Deployment:** [ops/infra/README.md](../infra/README.md)
2. **Production Security:** [../security.md](../security.md)  
3. **Monitoring Setup:** [../operations.md](../operations.md)
4. **Custom LLMs:** [../llm-integration.md](../llm-integration.md)
