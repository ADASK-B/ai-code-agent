# 🚀 Quick Start: C4 Architecture Automation

## **Compact Prompt für AI-Assistenten**

```
Erstelle eine automatisierte C4 Architecture Pipeline mit:

1. C4 DSL-Datei für Microservices-System mit System Context + Container + Component Views
2. GitHub Actions Workflow für automatische Diagramm-Generierung (PNG/SVG)  
3. Responsive HTML-Frontend für Diagramm-Anzeige via GitHub Pages
4. Verwende: Structurizr CLI + PlantUML + Graphviz für Enterprise Standards

WICHTIG: 
- Graphviz Installation für PlantUML SVG-Rendering
- GitHub Actions permissions: contents: write
- Pfad-Handling für verschachtelte Ausgaben beachten
- Static HTML ohne JavaScript-Dependencies

Erwartung: Vollständige Pipeline von DSL-Commit bis Live-Diagramm-Website.
```

## **Minimal Setup (30 Min)**

### 1. DSL erstellen (`docs/c4/workspace.dsl`):
```
workspace "My System" {
    model {
        user = person "User"
        system = softwareSystem "My System" {
            web = container "Web App" "React"
            api = container "API" "Node.js"
            db = container "Database" "PostgreSQL"
        }
    }
    views {
        systemContext system "SystemContext"
        container system "Containers"
        component web "WebComponents"
    }
}
```

### 2. GitHub Actions (`.github/workflows/diagrams.yml`):
```yaml
name: C4 Diagrams
on: [push]
permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
      
      - run: sudo apt-get install -y graphviz
      
      - run: |
          curl -L https://github.com/structurizr/cli/releases/latest/download/structurizr-cli.zip -o cli.zip
          unzip cli.zip -d cli
          chmod +x cli/structurizr.sh
      
      - run: |
          mkdir -p docs/c4/out
          ./cli/structurizr.sh export -workspace docs/c4/workspace.dsl -format plantuml -output docs/c4/out
          
          wget -O plantuml.jar https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar
          java -jar plantuml.jar -tpng docs/c4/out/*.puml -o docs/c4/out
          java -jar plantuml.jar -tsvg docs/c4/out/*.puml -o docs/c4/out
      
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Update diagrams"
          file_pattern: docs/c4/out/*
```

### 3. HTML Frontend (`architecture.html`):
```html
<!DOCTYPE html>
<html>
<head><title>Architecture</title></head>
<body>
    <h1>Architecture Diagrams</h1>
    <img src="docs/c4/out/docs/c4/out/structurizr-SystemContext.png" style="max-width: 100%">
    <img src="docs/c4/out/docs/c4/out/structurizr-Containers.png" style="max-width: 100%">
</body>
</html>
```
**WICHTIG:** HTML-Datei im **Repository-Root** speichern (nicht in docs/)

### 4. Verzeichnis-Struktur:
```
your-repo/
├── .github/workflows/diagrams.yml    # GitHub Actions
├── docs/c4/workspace.dsl              # C4 DSL Quelle  
├── docs/c4/out/                       # Generierte Diagramme (auto)
├── architecture.html                  # Website (im Root!)
└── README.md
```

### 5. Aktivieren:
- GitHub Pages: **Settings → Pages → Source: Deploy from branch → main branch, / (root)**
- DSL committen → Auto-Build → Live Diagrams!
- Website verfügbar unter: `https://username.github.io/repo-name/architecture.html`

**🎯 Result: Professional architecture documentation in 30 minutes!**
