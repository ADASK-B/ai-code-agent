# Single-Server Installation

Diese Anleitung beschreibt die Installation des Code Agent MVP auf einem einzelnen Server/VM ohne Azure-Abhängigkeiten.

## Übersicht

Der Code Agent wird als Docker Compose Bundle auf einem einzelnen Server betrieben mit:

- **Traefik** als Reverse Proxy mit automatischem TLS
- **Alle Services** (Gateway, Orchestrator, Adapter, LLM-Patch)
- **Azurite** als lokaler Storage-Emulator  
- **Systemd** für automatische Neustarts
- **Optional**: Lokale LLM-Integration

## Prerequisites

### Server-Anforderungen

- **OS**: Ubuntu 20.04+ oder CentOS 8+
- **CPU**: Mindestens 4 Cores (8+ empfohlen für LLM)
- **RAM**: Mindestens 8GB (16GB+ empfohlen)
- **Storage**: 50GB+ freier Speicher
- **Network**: Öffentliche IP mit Port 80/443 erreichbar

### Software-Abhängigkeiten

```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose v2
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Git (falls nicht vorhanden)
sudo apt update && sudo apt install -y git curl

# Optional: nginx-utils für htpasswd
sudo apt install -y apache2-utils
```

## Installation

### 1. Repository klonen

```bash
# Auf dem Server
sudo mkdir -p /opt/code-agent
sudo chown $USER:$USER /opt/code-agent
cd /opt/code-agent

git clone <repository-url> .
cd ops/server
```

### 2. Umgebung konfigurieren

```bash
# Basis-Konfiguration
cp .env.example .env
nano .env
```

**Wichtige Variablen in .env:**

```bash
# Domain & TLS
DOMAIN=your-domain.com
EMAIL=admin@your-domain.com  # Für Let's Encrypt

# Azure DevOps
ADO_ORG=your-org
ADO_PROJECT=your-project
ADO_TOKEN=your-pat-token

# Security
WEBHOOK_SECRET=your-very-secure-webhook-secret-here

# LLM Provider
LLM_PROVIDER=anthropic  # oder: openai, local, stub
ANTHROPIC_API_KEY=your-claude-api-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Optional: Basic Auth für Admin-Interface
TRAEFIK_AUTH_USER=admin
TRAEFIK_AUTH_PASSWORD=secure-password
```

### 3. DNS konfigurieren

```bash
# A-Record für Ihre Domain
your-domain.com    A    YOUR_SERVER_IP

# Optional: Subdomain für Dashboard
dashboard.your-domain.com    A    YOUR_SERVER_IP
```

### 4. Services starten

```bash
# Compose für Server-Betrieb
docker compose -f docker-compose.server.yml up -d

# Logs verfolgen
docker compose -f docker-compose.server.yml logs -f
```

### 5. Systemd Integration

```bash
# Service-Definition erstellen
sudo cp code-agent.service /etc/systemd/system/
sudo systemctl daemon-reload

# Service aktivieren und starten
sudo systemctl enable code-agent
sudo systemctl start code-agent

# Status prüfen
sudo systemctl status code-agent
```

## Konfigurationsdateien

### docker-compose.server.yml

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Dashboard (optional)
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml:ro
      - ./traefik.dynamic.yml:/etc/traefik/dynamic.yml:ro
      - traefik-letsencrypt:/letsencrypt
    environment:
      - DOMAIN=${DOMAIN}
      - EMAIL=${EMAIL}
    networks:
      - agent-network

  gateway:
    build: ../../services/gateway
    restart: unless-stopped
    environment:
      - WEBHOOK_SECRET=${WEBHOOK_SECRET}
      - ORCHESTRATOR_URL=http://orchestrator/api/pr-comment
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.gateway.rule=Host(`${DOMAIN}`) && PathPrefix(`/gateway`)"
      - "traefik.http.routers.gateway.tls.certresolver=letsencrypt"
    networks:
      - agent-network
    depends_on:
      - orchestrator

  orchestrator:
    build: ../../services/orchestrator
    restart: unless-stopped
    environment:
      - AzureWebJobsStorage=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;
      - ADAPTER_URL=http://adapter:8080
      - LLM_PATCH_URL=http://llm-patch:8080
    networks:
      - agent-network
    depends_on:
      - azurite
      - adapter
      - llm-patch

  adapter:
    build: ../../services/adapter
    restart: unless-stopped
    environment:
      - ADO_ORG=${ADO_ORG}
      - ADO_PROJECT=${ADO_PROJECT}
      - ADO_TOKEN=${ADO_TOKEN}
    networks:
      - agent-network

  llm-patch:
    build: ../../services/llm-patch
    restart: unless-stopped
    environment:
      - LLM_PROVIDER=${LLM_PROVIDER}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    networks:
      - agent-network

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite:latest
    restart: unless-stopped
    volumes:
      - azurite-data:/data
    networks:
      - agent-network

networks:
  agent-network:
    driver: bridge

volumes:
  traefik-letsencrypt:
  azurite-data:
```

### traefik.yml (Server-Version)

```yaml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entrypoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
  file:
    filename: "/etc/traefik/dynamic.yml"

certificatesResolvers:
  letsencrypt:
    acme:
      email: ${EMAIL}
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO

accessLog:
  filePath: "/var/log/traefik/access.log"
```

### code-agent.service (Systemd)

```ini
[Unit]
Description=Code Agent MVP
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/code-agent/ops/server
ExecStart=/usr/local/bin/docker-compose -f docker-compose.server.yml up -d
ExecStop=/usr/local/bin/docker-compose -f docker-compose.server.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

## TLS/HTTPS Setup

### Automatisch mit Let's Encrypt (Empfohlen)

```yaml
# In traefik.yml bereits konfiguriert
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@your-domain.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

### Manuell mit eigenen Zertifikaten

```bash
# Zertifikate nach /opt/code-agent/certs/ kopieren
sudo mkdir -p /opt/code-agent/certs
sudo cp your-cert.pem /opt/code-agent/certs/
sudo cp your-key.pem /opt/code-agent/certs/

# docker-compose.server.yml anpassen
volumes:
  - ./certs:/certs:ro
```

## Monitoring & Logs

### Logs zentral sammeln

```bash
# Alle Service-Logs
docker compose -f docker-compose.server.yml logs

# Specific Service
docker compose -f docker-compose.server.yml logs gateway

# Live-Logs mit Follow
docker compose -f docker-compose.server.yml logs -f --tail=100
```

### Systemd-Logs

```bash
# Service-Status
sudo systemctl status code-agent

# Service-Logs
sudo journalctl -u code-agent -f

# Boot-Logs
sudo journalctl -b
```

### Health Checks

```bash
# Alle Services prüfen
curl -k https://your-domain.com/gateway/health
curl -k https://your-domain.com/adapter/health
curl -k https://your-domain.com/llm/health

# Traefik Dashboard
curl -k https://your-domain.com:8080/dashboard/
```

## Backup & Recovery

### Daten sichern

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR="/opt/backups/code-agent"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Docker Volumes
docker run --rm -v azurite-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/azurite_$DATE.tar.gz /data

# Konfiguration
tar czf $BACKUP_DIR/config_$DATE.tar.gz /opt/code-agent/ops/server/.env /opt/code-agent/ops/server/*.yml

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### Wiederherstellen

```bash
# Services stoppen
sudo systemctl stop code-agent

# Volumes wiederherstellen
docker run --rm -v azurite-data:/data -v /opt/backups:/backup alpine tar xzf /backup/azurite_20240101_120000.tar.gz

# Services starten
sudo systemctl start code-agent
```

## Firewall-Konfiguration

### UFW (Ubuntu)

```bash
# Firewall aktivieren
sudo ufw enable

# HTTP/HTTPS erlauben
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH erlauben (wichtig!)
sudo ufw allow 22/tcp

# Optional: Traefik Dashboard (nur von vertrauenswürdigen IPs)
sudo ufw allow from YOUR_ADMIN_IP to any port 8080

# Status prüfen
sudo ufw status
```

### iptables

```bash
# HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Regeln speichern
sudo iptables-save > /etc/iptables/rules.v4
```

## Lokale LLM Integration (Optional)

### vLLM Setup

```bash
# GPU-Server mit vLLM
docker run -d --name vllm \
  --gpus all \
  -p 8000:8000 \
  vllm/vllm-openai:latest \
  --model microsoft/CodeLlama-13b-Instruct-hf \
  --served-model-name codellama-13b \
  --max-model-len 4096

# In .env konfigurieren
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:8000/v1
LOCAL_LLM_MODEL=codellama-13b
```

### Ollama Alternative

```bash
# Ollama installieren
curl https://ollama.ai/install.sh | sh

# Model herunterladen
ollama pull codellama:13b

# API Server starten
ollama serve

# In .env
LOCAL_LLM_URL=http://localhost:11434/v1
```

## Troubleshooting

### Service startet nicht

```bash
# Docker-Status prüfen
sudo systemctl status docker
docker ps -a

# Compose-Validation
docker compose -f docker-compose.server.yml config

# Port-Konflikte
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### TLS-Probleme

```bash
# Let's Encrypt Logs
docker compose -f docker-compose.server.yml logs traefik | grep acme

# Zertifikat manuell testen
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### Performance-Probleme

```bash
# Resource-Verbrauch
docker stats

# Disk-Space
df -h
docker system df

# Memory
free -h
cat /proc/meminfo
```

## Wartung

### Updates

```bash
# Images updaten
cd /opt/code-agent/ops/server
docker compose -f docker-compose.server.yml pull
docker compose -f docker-compose.server.yml up -d

# Code-Updates
git pull origin main
docker compose -f docker-compose.server.yml build
docker compose -f docker-compose.server.yml up -d
```

### Log-Rotation

```bash
# /etc/logrotate.d/code-agent
/var/log/traefik/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
```

## Security Hardening

### OS-Level

```bash
# Automatische Updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Fail2Ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Docker-Security

```bash
# Non-root User in Containers (bereits implementiert)
# Secrets via Environment nur
# Read-only Root-Filesystem wo möglich
# Resource-Limits setzen
```

### Monitoring

```bash
# Optional: Node Exporter für Prometheus
docker run -d --name node-exporter \
  -p 9100:9100 \
  prom/node-exporter

# In Grafana/Prometheus integrieren
```

Dies ist eine vollständige Anleitung für die Server-Installation. Der Agent läuft produktionsreif mit automatischem TLS, Monitoring und Backup-Strategien.
