# Code Agent - Dateioperation Capabilities

## 📁 **Was der Agent ALLES kann:**

### **1. Bestehende Dateien modifizieren**
```typescript
// Beispiel Intent: "Add logging to all functions"
const patchResult = {
  diff: `
--- a/src/utils.ts
+++ b/src/utils.ts
@@ -1,6 +1,8 @@
 export function processData(input: any) {
+    console.log('Processing data:', input);
     const result = input.transform();
+    console.log('Result:', result);
     return result;
 }`,
  notes: "Added console.log statements for debugging",
  filesChanged: ["src/utils.ts"]
}
```

### **2. Neue Dateien erstellen**
```typescript
// Intent: "Create a new user service class"
const patchResult = {
  diff: `
--- /dev/null
+++ b/src/services/UserService.ts
@@ -0,0 +1,25 @@
+export class UserService {
+    private users: User[] = [];
+
+    async createUser(userData: CreateUserRequest): Promise<User> {
+        const user = new User(userData);
+        this.users.push(user);
+        return user;
+    }
+
+    async getUserById(id: string): Promise<User | null> {
+        return this.users.find(u => u.id === id) || null;
+    }
+}`,
  notes: "Created new UserService class with CRUD operations",
  filesChanged: ["src/services/UserService.ts"]
}
```

### **3. Dateien löschen**
```typescript
// Intent: "Remove deprecated helper functions"
const patchResult = {
  diff: `
--- a/src/legacy/oldHelpers.ts
+++ /dev/null
@@ -1,15 +0,0 @@
-// Deprecated helper functions
-export function oldFunction() {
-    // legacy code
-}`,
  notes: "Removed deprecated helper file",
  filesChanged: ["src/legacy/oldHelpers.ts"]
}
```

### **4. Dateien umbenennen/verschieben**
```typescript
// Intent: "Reorganize components into folders"
const patchResult = {
  diff: `
--- a/components/Button.tsx
+++ /dev/null
@@ -1,10 +0,0 @@
-export const Button = () => {
-    return <button>Click me</button>;
-};

--- /dev/null  
+++ b/components/ui/Button.tsx
@@ -0,0 +1,10 @@
+export const Button = () => {
+    return <button>Click me</button>;
+};`,
  notes: "Moved Button component to ui folder",
  filesChanged: ["components/Button.tsx", "components/ui/Button.tsx"]
}
```

### **5. Komplexe Multi-File Operations**
```typescript
// Intent: "Add TypeScript interfaces for the new API"
const patchResult = {
  diff: `
--- /dev/null
+++ b/types/api.ts
@@ -0,0 +1,20 @@
+export interface ApiResponse<T> {
+    success: boolean;
+    data?: T;
+    error?: string;
+}
+
+export interface User {
+    id: string;
+    name: string;
+    email: string;
+}

--- a/src/api/userApi.ts  
+++ b/src/api/userApi.ts
@@ -1,3 +1,5 @@
+import { ApiResponse, User } from '../types/api';
+
 export async function getUser(id: string) {
-    // TODO: Add proper typing
+    const response: ApiResponse<User> = await fetch(\`/api/users/\${id}\`);
     return response;
 }`,
  notes: "Added TypeScript interfaces and updated API to use them",
  filesChanged: ["types/api.ts", "src/api/userApi.ts"]
}
```

## 🎯 **Praktische Beispiele für Intent-Commands:**

| **Intent** | **Was passiert** | **Dateien** |
|------------|------------------|-------------|
| `"Create a login component"` | Neue React/Vue Komponente | `+components/Login.tsx` |
| `"Add error handling to API calls"` | Try-catch in bestehende Funktionen | `~src/api/*.ts` |
| `"Create database models for users"` | Neue Model-Klassen | `+models/User.ts, +models/index.ts` |
| `"Refactor utils into separate files"` | Aufteilen großer Dateien | `~utils/index.ts → +utils/validation.ts` |
| `"Add tests for user service"` | Neue Test-Dateien | `+tests/UserService.test.ts` |
| `"Remove unused imports"` | Cleanup bestehender Code | `~src/**/*.ts` |
| `"Add documentation comments"` | JSDoc zu Funktionen | `~src/**/*.ts` |
| `"Create API endpoints for CRUD"` | Controller + Routes | `+controllers/UserController.ts, +routes/users.ts` |

## 🔧 **Technische Implementation:**

Der Agent nutzt **Unified Diff Format**, welches ALL diese Operationen unterstützt:

- **`--- /dev/null`** = Neue Datei erstellen
- **`+++ /dev/null`** = Datei löschen  
- **`--- a/path, +++ b/newpath`** = Umbenennen/Verschieben
- **`@@` Zeilen** = Exakte Positionen für Änderungen

Das heißt: **Der Agent kann literarisch ALLES** was ein Entwickler auch kann! 🚀

## ✅ **GitHub Codespaces Workflow:**

1. **Codespace öffnen** → System startet automatisch
2. **ADO Token eintragen** → In `.env` Datei
3. **Webhook konfigurieren** → `https://<codespace>-80.app.github.dev/gateway/webhook/ado`
4. **Intent posten** → `/edit /3 Create user authentication system`
5. **3 Draft-PRs** → Mit Login, Auth-Service, Tests

**→ Vom Zero-Setup zum produktiven AI-Coding in unter 5 Minuten!** ⚡
