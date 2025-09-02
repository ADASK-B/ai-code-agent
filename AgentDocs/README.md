# AgentDocs - Modular Documentation Structure

## 📁 Document Structure

### Core Documents
- **[Agent_Init.md](./Agent_Init.md)** - System Initialization & Quick Start
- **[Agent_Ngrok.md](./Agent_Ngrok.md)** - ngrok Container Configuration & Setup  
- **[Agent_Troubleshooting.md](./Agent_Troubleshooting.md)** - Problem Resolution & Diagnostics

### Navigation
- **[../Agent.md](../Agent.md)** - Main Navigation Hub with Service Overview

## 📋 Document Purpose

### Agent_Init.md
**Target**: Schneller System-Start
- Docker-compose Befehle
- ngrok Tunnel Setup (Container-basiert)
- Webhook URLs für Azure DevOps
- GitHub Codespaces Alternative
- Basic Troubleshooting

### Agent_Ngrok.md  
**Target**: Technische ngrok Details
- Container Setup (Dockerfile, entrypoint.sh, ngrok.yml)
- Web Interface Features (localhost:4040)  
- API Endpoints & Traffic Inspector
- Migration von Native zu Container
- Konfiguration & Environment Variables

### Agent_Troubleshooting.md
**Target**: Problem-Lösung
- Common Issues (ngrok, Gateway, Webhooks)
- Performance & Network Debugging
- Emergency Reset Procedures  
- Log Analysis Patterns
- Health Check Commands

## 🔄 Usage Pattern

1. **Start Here**: [../Agent.md](../Agent.md) für Überblick
2. **Quick Setup**: [Agent_Init.md](./Agent_Init.md) für sofortigen Start
3. **Deep Dive**: [Agent_Ngrok.md](./Agent_Ngrok.md) für technische Details
4. **Problems**: [Agent_Troubleshooting.md](./Agent_Troubleshooting.md) bei Fehlern

## 🎯 Benefits

### Modular Structure
- ✅ **Focused Content** - Jedes Dokument hat klaren Zweck
- ✅ **Easy Navigation** - Links zwischen Dokumenten
- ✅ **Maintainable** - Änderungen nur in relevanten Bereichen
- ✅ **Scalable** - Neue Dokumente einfach hinzufügbar

### User Experience  
- ✅ **Quick Access** - Agent.md als Einstiegspunkt
- ✅ **Progressive Detail** - Von Überblick zu Spezifika
- ✅ **Context Separation** - Setup vs. Troubleshooting vs. Technical Details
- ✅ **Cross-References** - Alle Dokumente verlinkt

---

*Created: September 3, 2025*
