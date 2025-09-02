# Bot Comment Templates

Diese Datei enthält alle Templates für die automatisierten PR-Kommentare des Code Agent MVP.

## Template Variablen

Alle Templates verwenden folgende Variablen:

- `{intent}` - Der User-Intent (z.B. "Make all buttons red")
- `{variants}` - Anzahl der angeforderten Varianten
- `{jobId}` - Eindeutige Job-ID für Tracking
- `{variant}` - Varianten-Nummer (1, 2, 3, ...)
- `{branch}` - Branch-Name der Variante
- `{prNumber}` - PR-Nummer der Draft-PR
- `{prUrl}` - URL zur Draft-PR
- `{actor}` - ADO-Benutzername des Auslösers
- `{timestamp}` - Zeitstempel
- `{duration}` - Verarbeitungsdauer
- `{error}` - Fehlermeldung (bei Fehlern)

## Start Comment

Wird gepostet, wenn die Verarbeitung beginnt.

```markdown
🤖 **AI Agent gestartet**

**Intent:** {intent}
**Varianten:** {variants}
**Job ID:** {jobId}
**Gestartet von:** @{actor}

Erstelle Branches:
{branchList}

⏳ **Verarbeitung läuft...** 

*Geschätzte Dauer: {estimatedDuration} Minuten*

---
*Job ID: `{jobId}` • Gestartet: {timestamp}*
```

**Beispiel:**
```markdown
🤖 **AI Agent gestartet**

**Intent:** Make all buttons red
**Varianten:** 3
**Job ID:** job_abc123def456
**Gestartet von:** @alice.smith

Erstelle Branches:
- `users/alice/make-buttons-red/v1`
- `users/alice/make-buttons-red/v2` 
- `users/alice/make-buttons-red/v3`

⏳ **Verarbeitung läuft...**

*Geschätzte Dauer: 4-8 Minuten*

---
*Job ID: `job_abc123def456` • Gestartet: 2024-01-15 14:30:25*
```

## Variant DONE Comment

Wird für jede erfolgreich abgeschlossene Variante gepostet.

```markdown
✅ **DONE v{variant}**

**Branch:** `{branch}`
**PR:** [#{prNumber} 🔧 AI Edit v{variant}: {intentSlug}]({prUrl})
**Status:** ✅ success
**Dauer:** {duration}
**Änderungen:** {filesChanged} Datei(en), +{linesAdded}/-{linesDeleted} Zeilen

{notes}

---
*Job ID: `{jobId}` • Variante {variant}/{variants}*
```

**Beispiel:**
```markdown
✅ **DONE v1**

**Branch:** `users/alice/make-buttons-red/v1`
**PR:** [#1234 🔧 AI Edit v1: make-buttons-red](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1234)
**Status:** ✅ success  
**Dauer:** 3m 24s
**Änderungen:** 5 Datei(en), +18/-12 Zeilen

Ich habe alle Button-Komponenten gefunden und ihre Farbe zu Rot (#dc3545) geändert. Betroffen sind primäre Buttons, sekundäre Buttons und Icon-Buttons in den Komponenten ButtonPrimary.tsx, ButtonSecondary.tsx und IconButton.tsx sowie die zugehörigen CSS-Dateien.

---
*Job ID: `job_abc123def456` • Variante 1/3*
```

## Variant FAILED Comment

Wird für fehlgeschlagene Varianten gepostet.

```markdown
❌ **FAILED v{variant}**

**Branch:** `{branch}` (falls erstellt)
**Status:** ❌ failed  
**Dauer:** {duration}
**Grund:** {error}

{troubleshootingHint}

---
*Job ID: `{jobId}` • Variante {variant}/{variants}*
```

**Beispiel:**
```markdown
❌ **FAILED v2**

**Branch:** `users/alice/make-buttons-red/v2` 
**Status:** ❌ failed
**Dauer:** 2m 15s  
**Grund:** Patch zu groß (245KB > 200KB Limit)

💡 **Tipp:** Der Intent könnte zu umfassend sein. Versuchen Sie eine spezifischere Beschreibung oder teilen Sie die Änderung in kleinere Schritte auf.

---
*Job ID: `job_abc123def456` • Variante 2/3*
```

## Final Overview Comment

Wird am Ende gepostet mit einer Zusammenfassung aller Varianten.

```markdown
🎯 **AI Agent abgeschlossen**

**Intent:** {intent}
**Gestartet von:** @{actor}
**Gesamtdauer:** {totalDuration}

## Ergebnisse

{variantResults}

## Zusammenfassung

**Status:** {overallStatus}
**Erfolgreich:** {successCount}/{totalVariants} Varianten
**Fehlgeschlagen:** {failedCount}/{totalVariants} Varianten

{nextStepsAdvice}

---
*Job ID: `{jobId}` • Abgeschlossen: {timestamp}*
```

**Beispiel (Alle erfolgreich):**
```markdown
🎯 **AI Agent abgeschlossen**

**Intent:** Make all buttons red
**Gestartet von:** @alice.smith
**Gesamtdauer:** 7m 42s

## Ergebnisse

- ✅ **v1:** [PR #1234](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1234) - Standard-Ansatz mit CSS-Variablen
- ✅ **v2:** [PR #1235](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1235) - Styled-Components Variante  
- ✅ **v3:** [PR #1236](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1236) - Theme-basierte Lösung

## Zusammenfassung

**Status:** ✅ Vollständig erfolgreich
**Erfolgreich:** 3/3 Varianten
**Fehlgeschlagen:** 0/3 Varianten

🎉 **Alle Varianten erfolgreich erstellt!** Sie können nun die verschiedenen Ansätze vergleichen und den besten für Ihr Projekt auswählen.

---
*Job ID: `job_abc123def456` • Abgeschlossen: 2024-01-15 14:38:07*
```

**Beispiel (Teilweise erfolgreich):**
```markdown
🎯 **AI Agent abgeschlossen**

**Intent:** Refactor entire authentication system
**Gestartet von:** @bob.developer  
**Gesamtdauer:** 12m 18s

## Ergebnisse

- ✅ **v1:** [PR #1240](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1240) - JWT-Token Optimierung
- ❌ **v2:** Patch zu groß (über Limit)
- ✅ **v3:** [PR #1241](https://dev.azure.com/myorg/myproject/_git/myrepo/pullrequest/1241) - Session-Management Update

## Zusammenfassung

**Status:** ⚠️ Teilweise erfolgreich
**Erfolgreich:** 2/3 Varianten
**Fehlgeschlagen:** 1/3 Varianten

💡 **Empfehlung:** Der Intent ist möglicherweise zu umfassend. Betrachten Sie die erfolgreichen Varianten oder teilen Sie das Refactoring in kleinere, fokussierte Schritte auf.

---
*Job ID: `job_def789ghi012` • Abgeschlossen: 2024-01-15 15:45:33*
```

## Error Comments

### Validation Errors

```markdown
⚠️ **Ungültiger Intent**

**Problem:** {validationError}

**Korrekte Syntax:**
```
/edit /N <intent>
```

**Beispiele:**
- `/edit /2 Add error handling to login form`
- `/edit /3 Update button colors to match design system`
- `/edit /1 Fix typo in README`

**Limits:**
- Varianten: 1-10
- Intent: 5-200 Zeichen
- Nur Textdateien werden verarbeitet

---
*Weitere Hilfe: [Dokumentation](https://docs.your-company.com/code-agent)*
```

### System Errors

```markdown
🚨 **System-Fehler**

**Problem:** Ein technischer Fehler ist aufgetreten
**Fehler-ID:** {errorId}
**Zeitstempel:** {timestamp}

Das Problem wurde automatisch an unser Team gemeldet. Bitte versuchen Sie es in wenigen Minuten erneut.

**Sofort-Hilfe:**
- Prüfen Sie die [Systemstatus-Seite](https://status.your-company.com)
- Kontaktieren Sie den Support mit Fehler-ID `{errorId}`

---
*Automatische Benachrichtigung gesendet*
```

## Template Functions

### Generierte Listen

**Branch List:**
```javascript
function generateBranchList(actor, intentSlug, variants) {
  return Array.from({length: variants}, (_, i) => 
    `- \`users/${actor}/${intentSlug}/v${i+1}\``
  ).join('\n');
}
```

**Variant Results:**
```javascript
function generateVariantResults(variants) {
  return variants.map(v => {
    const status = v.status === 'success' ? '✅' : '❌';
    const link = v.prUrl ? `[PR #${v.prNumber}](${v.prUrl})` : 'Nicht erstellt';
    return `- ${status} **v${v.k}:** ${link} - ${v.notes || v.error}`;
  }).join('\n');
}
```

### Status Icons

- ✅ `success`
- ❌ `failed` 
- ⏳ `in_progress`
- ⚠️ `partial_success`
- 🚨 `system_error`
- 💡 `hint/tip`
- 🎯 `completion`
- 🤖 `bot_action`

### Duration Formatting

```javascript
function formatDuration(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
```

## Localization

Für internationale Teams können Templates lokalisiert werden:

```javascript
const templates = {
  'en': { /* English templates */ },
  'de': { /* German templates */ },
  'fr': { /* French templates */ },
  // ...
};

function getTemplate(key, locale = 'en') {
  return templates[locale]?.[key] || templates['en'][key];
}
```

## Markdown Guidelines

### Konsistente Formatierung

- **Fett** für wichtige Labels
- `Code` für technische Begriffe (Branch-Namen, IDs)
- Links für PRs und externe Ressourcen
- Emojis für visuelle Orientierung
- Horizontale Linien `---` für Abschnitte

### Responsive Design

Templates sollten in verschiedenen ADO-Themes lesbar sein:
- Heller Modus
- Dunkler Modus  
- Hoher Kontrast

### Accessibility

- Alt-Text für komplexe Diagramme
- Klare Farbkodierung auch ohne Farbe verständlich
- Logische Überschriften-Hierarchie

Dies stellt sicher, dass alle Bot-Kommentare konsistent, informativ und benutzerfreundlich sind.
