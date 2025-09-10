# 🔧 C4 Pipeline Troubleshooting Guide

## **Häufige Probleme & Lösungen**

### ❌ **SVG zeigt "Dot executable does not exist"**
```
Ursache: Graphviz fehlt im GitHub Actions Runner
Lösung: 
- Add step: sudo apt-get install -y graphviz
- Test: java -jar plantuml.jar -testdot
```

### ❌ **Workflow schlägt bei Auto-Commit fehl**
```
Ursache: Fehlende Write-Permissions
Lösung:
permissions:
  contents: write
```

### ❌ **Diagramme laden nicht auf Website**
```
Ursache: Pfad-Mismatch (verschachtelte Verzeichnisse)
Lösung: Prüfe tatsächliche Pfade in docs/c4/out/
- Oft: docs/c4/out/docs/c4/out/ statt docs/c4/out/
- HTML entsprechend anpassen
```

### ❌ **DSL Parsing schlägt fehl**
```
Ursache: Syntax-Fehler in workspace.dsl
Häufig: styles-Section oder ungültige View-Keys
Lösung: 
- styles { } entfernen
- View-Namen prüfen
- Validate: ./structurizr.sh validate -workspace docs/c4/workspace.dsl
```

### ❌ **PlantUML Download schlägt fehl**
```
Ursache: GitHub Rate Limiting
Lösung: PlantUML JAR cachen
- uses: actions/cache@v3
  with:
    path: plantuml.jar
    key: plantuml-jar
```

### ❌ **GitHub Pages zeigt 404**
```
Ursache: Pages nicht aktiviert oder falscher Branch
Lösung:
- Settings → Pages → Source: Deploy from branch
- Branch: main, Folder: / (root)
```

### ❌ **Leere oder korrupte PNG-Dateien**
```
Ursache: PlantUML Output-Path-Problem
Lösung: Absolute Pfade verwenden
java -jar plantuml.jar -tpng "$(pwd)/docs/c4/out/*.puml" -o "$(pwd)/docs/c4/out"
```

## **Debug Commands**

### Lokales Testing:
```bash
# DSL validieren
./structurizr.sh validate -workspace docs/c4/workspace.dsl

# PlantUML testen
java -jar plantuml.jar -testdot

# Einzelnes Diagramm generieren
java -jar plantuml.jar -tpng docs/c4/out/structurizr-SystemContext.puml
```

### GitHub Actions Debug:
```yaml
# Workflow-Debugging aktivieren
env:
  ACTIONS_STEP_DEBUG: true
  ACTIONS_RUNNER_DEBUG: true

# File-Listing für Debugging
- run: find docs/c4/out -type f -name "*.png" -o -name "*.svg" | head -20
```

## **Performance Monitoring**

### Erwartete Build-Zeiten:
- Structurizr Export: < 30s
- PlantUML Rendering: < 2min
- Gesamt-Workflow: < 5min

### File-Size Guidelines:
- PNG: < 500KB pro Diagramm
- SVG: < 200KB pro Diagramm
- Bei Überschreitung: Diagramm-Komplexität reduzieren

## **Quick Health Check**

```bash
# Nach erfolgreichem Build prüfen:
curl -I https://yourusername.github.io/your-repo/docs/c4/out/docs/c4/out/structurizr-SystemContext.png
# Erwartung: HTTP 200, Content-Type: image/png

curl -I https://yourusername.github.io/your-repo/docs/c4/out/docs/c4/out/structurizr-SystemContext.svg  
# Erwartung: HTTP 200, Content-Type: image/svg+xml
```

## **Maintenance Tasks**

### Monatlich:
- [ ] Structurizr CLI Version prüfen
- [ ] PlantUML Version update
- [ ] GitHub Actions Dependencies updaten

### Bei Problemen:
1. GitHub Actions Logs prüfen
2. Lokale Reproduktion mit gleichen Tool-Versionen
3. File-Permissions in repo prüfen
4. GitHub Pages Deployment-Status validieren

**💡 Tipp: Immer zuerst lokal testen, dann in GitHub Actions debuggen!**
