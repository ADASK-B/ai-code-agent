# Code Agent MVP - Development Container Setup

## 🚀 Moderne Container-basierte Entwicklung

### ✨ Features

#### 🔄 **Hot Reload & Live Development**
- **Volume Mounts**: Dein Code wird live in Container synchronisiert
- **Hot Reload**: Änderungen werden sofort ohne Neustart übernommen
- **Auto-Rebuild**: package.json Änderungen triggern automatischen Rebuild

#### 🐛 **Remote Debugging**
- **VS Code Integration**: Debugger verbindet sich direkt mit Container
- **Debug Ports**: Gateway (9230), Adapter (9231), LLM-Patch (9232)
- **Breakpoints**: Setze Breakpoints wie bei lokaler Entwicklung

#### 📊 **Integrierte Überwachung**
- **Prometheus**: Metrics Collection läuft automatisch
- **Grafana**: Dashboards sind vorkonfiguriert
- **AlertManager**: Benachrichtigungen bei Problemen

#### 🌐 **Entwicklungstools**
- **ngrok Container**: Automatischer Tunnel für Webhooks
- **Code Quality**: ESLint, Prettier, Tests in separatem Container
- **Multi-Stage Builds**: Development vs Production optimiert

### 🛠️ Verwendung

#### **Vollständiges Development Setup starten:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

#### **Mit automatischem File Watching:**
```bash
docker-compose -f docker-compose.dev.yml watch
```

#### **Nur bestimmte Services:**
```bash
docker-compose -f docker-compose.dev.yml up gateway adapter
```

#### **Code Quality Checks:**
```bash
docker-compose -f docker-compose.dev.yml run --rm code-quality
```

### 🔧 VS Code Integration

#### **Debugging Setup** (.vscode/launch.json):
```json
{
  "name": "Attach to Gateway Container",
  "type": "node",
  "request": "attach",
  "address": "localhost",
  "port": 9230,
  "localRoot": "${workspaceFolder}/services/gateway/src",
  "remoteRoot": "/app/src",
  "protocol": "inspector"
}
```

#### **Dev Containers** (.devcontainer/devcontainer.json):
```json
{
  "name": "Code Agent Development",
  "dockerComposeFile": "../docker-compose.dev.yml",
  "service": "gateway",
  "workspaceFolder": "/app",
  "extensions": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### 📈 Monitoring URLs

- **Grafana**: http://localhost:3000 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9093
- **ngrok Admin**: http://localhost:4040

### 🎯 Warum Container Development?

#### **Konsistenz**
- Identische Umgebung für alle Entwickler
- Keine "Works on my machine" Probleme
- Exakte Production-Nachbildung

#### **Isolation**
- Services beeinflussen sich nicht
- Saubere Dependency-Trennung
- Einfaches Service-Management

#### **Skalierbarkeit**
- Einfach neue Services hinzufügen
- Load Balancer Testing möglich
- Kubernetes Migration vorbereitet

### 🚀 Nächste Schritte

1. **Starte Development Container**: `docker-compose -f docker-compose.dev.yml up --build`
2. **Konfiguriere VS Code Debugging**: Verwende provided launch.json
3. **Teste Hot Reload**: Ändere Code und siehe sofortige Updates
4. **Monitoring prüfen**: Öffne Grafana Dashboard

**Das Beste aus beiden Welten: Production-ready UND development-friendly!** 🎉
