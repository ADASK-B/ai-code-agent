# ngrok Setup für Code Agent MVP

Diese Anleitung erklärt die ngrok-Konfiguration für lokale Entwicklung mit ADO-Webhook-Integration.

## Warum ngrok?

Azure DevOps muss Webhooks an Ihre lokale Entwicklungsumgebung senden können. ngrok erstellt einen sicheren Tunnel von einer öffentlichen URL zu Ihrem lokalen Gateway.

## Setup

### 1. ngrok Account erstellen

1. Registrierung: https://ngrok.com/signup
2. Auth Token aus Dashboard kopieren: https://dashboard.ngrok.com/get-started/your-authtoken

### 2. ngrok konfigurieren

```bash
cd ops/dev/ngrok
cp ngrok.yml.example ngrok.yml
```

**ngrok.yml editieren:**
```yaml
version: 2
authtoken: YOUR_ACTUAL_TOKEN_HERE

tunnels:
  gateway:
    proto: http
    addr: 80
    schemes:
      - https
```

### 3. Tunnel starten

```bash
# Alle konfigurierten Tunnels starten
ngrok start --all --config ngrok.yml

# Oder nur Gateway-Tunnel
ngrok start gateway --config ngrok.yml
```

### 4. URL für ADO konfigurieren

**ngrok Output:**
```
Forwarding    https://abc123.ngrok.io -> http://localhost:80
```

**ADO Service Hook URL:**
```
https://abc123.ngrok.io/gateway/webhook/ado
```

## Multi-Developer Setup

### Separate Tunnel-Konfigurationen

**alice.ngrok.yml:**
```yaml
version: 2
authtoken: ALICE_TOKEN
tunnels:
  gateway:
    proto: http
    addr: 80
    subdomain: code-agent-alice  # Requires ngrok Pro
```

**bob.ngrok.yml:**
```yaml
version: 2
authtoken: BOB_TOKEN  
tunnels:
  gateway:
    proto: http
    addr: 81  # Different port
    subdomain: code-agent-bob
```

### Starten mit verschiedenen Configs

```bash
# Alice
ngrok start --all --config alice.ngrok.yml

# Bob  
ngrok start --all --config bob.ngrok.yml
```

## ngrok Pro Features (Empfohlen)

### Feste Subdomains

```yaml
tunnels:
  gateway:
    subdomain: your-team-alice
    # → https://your-team-alice.ngrok.io
```

**Vorteile:**
- URL ändert sich nicht bei Neustart
- ADO Service Hook muss nur einmal konfiguriert werden
- Einfacher für Team-Entwicklung

### Custom Domains (Enterprise)

```yaml
hostname: alice.yourcompany.dev
```

### Erweiterte Konfiguration

```yaml
tunnels:
  gateway:
    proto: http
    addr: 80
    schemes: [https]
    
    # Basic Auth für zusätzliche Sicherheit
    auth: "user:password"
    
    # IP Whitelisting  
    allow_cidr: "192.168.1.0/24"
    
    # Request Header Manipulation
    request_header:
      add:
        - "X-Forwarded-Proto: https"
        - "X-Source: ngrok"
      remove:
        - "X-Forwarded-For"

    # Response Header Manipulation  
    response_header:
      add:
        - "X-Agent: code-agent-mvp"
        
    # Webhook verification (optional)
    verify_webhook: true
    webhook_verification:
      provider: "custom"
      secret: "your-webhook-secret"
```

## Monitoring & Debugging

### ngrok Web Interface

**URL:** http://localhost:4040

**Features:**
- Live Request/Response Inspection
- Replay Requests  
- Traffic Statistics
- Tunnel Status

### CLI Commands

```bash
# Status aller Tunnels
ngrok status

# Tunnel-Details
ngrok tunnels list

# Logs anzeigen
ngrok --log=stdout

# Config validieren
ngrok config check

# Version info
ngrok version
```

### Debug-Modus

```bash
# Verbose Logging
ngrok start gateway --config ngrok.yml --log=stdout --log-level=debug

# Mit lokalen Logs
ngrok start gateway --config ngrok.yml --log=ngrok.log
```

## Troubleshooting

### Tunnel startet nicht

```bash
# Auth Token prüfen
ngrok authtoken YOUR_TOKEN

# Config-Syntax prüfen  
ngrok config check --config ngrok.yml

# Port-Konflikte prüfen
netstat -an | grep :80
```

### ADO Webhook erreicht Service nicht

```bash
# Lokalen Gateway testen
curl http://localhost:80/gateway/health

# Über ngrok testen  
curl https://abc123.ngrok.io/gateway/health

# Webhook-Payload simulieren
curl -X POST https://abc123.ngrok.io/gateway/webhook/ado \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=test" \
  -d '{"eventType":"git.pullrequest.commented"}'
```

### Tunnel-Limits erreicht

**ngrok Free Account:**
- 1 simultaner Tunnel
- 40 connections/minute  
- Tunnel-URLs ändern sich

**Lösungen:**
- ngrok Pro Account ($8/Monat)
- Team-Account für feste Subdomains
- Round-Robin zwischen Entwicklern

### Performance Issues

```bash
# Regionalen Endpoint wählen
ngrok start gateway --config ngrok.yml --region=eu

# HTTP/2 deaktivieren (bei Problemen)
ngrok start gateway --config ngrok.yml --http-version=1.1

# Compression aktivieren
ngrok start gateway --config ngrok.yml --compression
```

## Sicherheitshinweise

### Webhook-Verifikation

```yaml
# In ngrok.yml
verify_webhook: true
webhook_verification:
  provider: "custom"  
  secret: "your-webhook-secret"
```

### IP-Whitelisting

```yaml
# Nur ADO IP-Ranges erlauben
allow_cidr: 
  - "13.107.6.0/24"     # ADO Services
  - "13.107.9.0/24"     # ADO Services  
  - "13.107.42.0/24"    # ADO Services
  - "13.107.43.0/24"    # ADO Services
```

### HTTPS-Only

```yaml
schemes: [https]  # HTTP deaktivieren
```

## Alternative zu ngrok

### localtunnel

```bash
npm install -g localtunnel
lt --port 80 --subdomain myagent
```

### serveo

```bash
ssh -R 80:localhost:80 serveo.net
```

### Tailscale (für Team-interne Entwicklung)

```bash
tailscale funnel 80
```

## Production Migration

Wenn Sie von ngrok zu Azure wechseln:

1. **ADO Service Hook URL ändern:**
   - Von: `https://abc123.ngrok.io/gateway/webhook/ado`
   - Zu: `https://youragent.azurecontainerapps.io/gateway/webhook/ado`

2. **Gleiche Webhook-Secrets verwenden**
3. **Monitoring auf Azure umstellen**

ngrok bleibt als Fallback-Option verfügbar.
