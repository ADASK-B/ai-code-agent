# Security Guide

Dieses Dokument beschreibt alle Sicherheitsaspekte des Code Agent MVP - von Token-Management bis hin zu Compliance-Anforderungen.

## Threat Model

### Assets
- **Source Code** - Kundendaten, Geschäftslogik
- **ADO Access Tokens** - Berechtigung für Repo-Zugriff
- **LLM API Keys** - Zugang zu KI-Services
- **User Context** - ADO-Benutzerinformationen
- **Generated Patches** - Potentiell sensible Code-Änderungen

### Threats
- **Token Theft** - Kompromittierung von ADO/LLM-Tokens
- **Code Injection** - Malicious Code in generierten Patches
- **Data Leakage** - Sensible Daten in Logs/LLM-Requests
- **Privilege Escalation** - Unauthorisierte Repo-Zugriffe
- **Denial of Service** - Resource-Erschöpfung durch Missbrauch

### Mitigations
- Least-Privilege Token
- Input Validation & Sanitization
- Secret Management (Key Vault)
- Rate Limiting & Circuit Breakers
- Comprehensive Logging (ohne Secrets)

## Authentication & Authorization

### ADO Personal Access Token

**Minimale Berechtigungen:**
```yaml
Code:
  - Read: ✅ (Repository-Inhalte lesen)
  - Write: ✅ (Branches/Commits erstellen)
  - Manage: ❌ (Nicht erforderlich)

Pull Requests:
  - Read: ✅ (PR-Metadaten lesen)
  - Write: ✅ (PRs erstellen, Kommentare)
  - Manage: ❌ (Nicht erforderlich)

Project and Team:
  - Read: ✅ (Projekt-Informationen)
  - Write: ❌ (Nicht erforderlich)

Build/Release/Test Plans:
  - Read: ❌ (Nicht erforderlich)
  - Write: ❌ (Nicht erforderlich)
```

**Token-Erstellung:**
```bash
# ADO Portal: User Settings → Personal Access Tokens
# Name: code-agent-production
# Organization: Specific (nicht "All accessible organizations")
# Expiration: 90 Tage (mit Rotation)
# Scopes: Custom defined (siehe oben)
```

**Token-Rotation (alle 60 Tage):**
```bash
#!/bin/bash
# scripts/rotate-ado-token.sh

# 1. Neuen Token generieren (manuell in ADO)
NEW_TOKEN="your-new-token-here"

# 2. In Key Vault aktualisieren
az keyvault secret set \
  --vault-name code-agent-kv \
  --name ado-pat \
  --value "$NEW_TOKEN" \
  --expires "$(date -d '+60 days' -u +%Y-%m-%dT%H:%M:%SZ)"

# 3. Services neu starten (holt neuen Token)
az containerapp revision copy \
  --name code-agent-adapter \
  --resource-group code-agent-rg

# 4. Alten Token widerrufen (nach Bestätigung)
echo "Revoke old token in ADO portal after verification"
```

### LLM Provider Authentication

**Anthropic API Key:**
```bash
# Sichere Speicherung
az keyvault secret set \
  --vault-name code-agent-kv \
  --name anthropic-api-key \
  --value "sk-ant-api03-..." \
  --content-type "text/plain" \
  --tags provider=anthropic service=llm-patch

# Abruf zur Laufzeit
ANTHROPIC_API_KEY=$(az keyvault secret show \
  --vault-name code-agent-kv \
  --name anthropic-api-key \
  --query value -o tsv)
```

**OpenAI Alternative:**
```bash
az keyvault secret set \
  --vault-name code-agent-kv \
  --name openai-api-key \
  --value "sk-proj-..." \
  --tags provider=openai service=llm-patch
```

## Webhook Security

### HMAC Signature Verification

**Gateway Implementation:**
```typescript
import crypto from 'node:crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
    
    const providedSignature = signature.replace('sha256=', '');
    
    // Timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}
```

**ADO Webhook-Konfiguration:**
```json
{
  "publisherId": "tfs",
  "eventType": "git.pullrequest.updated",
  "resourceVersion": "1.0",
  "consumerInputs": {
    "url": "https://your-domain.com/gateway/webhook/ado",
    "httpHeaders": "X-Hub-Signature-256: sha256={signature}",
    "basicAuthUsername": "",
    "basicAuthPassword": ""
  }
}
```

**Webhook-Secret Generation:**
```bash
# Starkes Secret generieren (32 Bytes = 256 Bit)
WEBHOOK_SECRET=$(openssl rand -hex 32)

# In Key Vault speichern
az keyvault secret set \
  --vault-name code-agent-kv \
  --name webhook-secret \
  --value "$WEBHOOK_SECRET"
```

## Input Validation & Sanitization

### PR Comment Validation

```typescript
import { z } from 'zod';

const intentSchema = z.object({
  command: z.literal('/edit'),
  variants: z.number().int().min(1).max(10),
  intent: z.string()
    .min(5, 'Intent must be at least 5 characters')
    .max(200, 'Intent must be under 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, 'Intent contains invalid characters')
});

function parseAndValidateIntent(comment: string): IntentResult | null {
  // Extract command pattern: /edit /N <intent>
  const match = comment.trim().match(/^\/edit\s+\/(\d+)\s+(.+)$/);
  
  if (!match) {
    return null;
  }

  try {
    const parsed = intentSchema.parse({
      command: '/edit',
      variants: parseInt(match[1], 10),
      intent: match[2].trim()
    });
    
    return {
      variants: parsed.variants,
      intent: sanitizeIntent(parsed.intent)
    };
  } catch (error) {
    throw new ValidationError(`Invalid intent: ${error.message}`);
  }
}

function sanitizeIntent(intent: string): string {
  return intent
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/[`]/g, '')  // Remove backticks
    .replace(/\r\n|\r|\n/g, ' ') // Normalize whitespace
    .trim();
}
```

### File Path Validation

```typescript
function validateFilePath(path: string): boolean {
  // Prevent directory traversal
  if (path.includes('..') || path.includes('~')) {
    return false;
  }
  
  // Only allow relative paths within repo
  if (path.startsWith('/') || path.includes(':')) {
    return false;
  }
  
  // Allowed file extensions
  const allowedExtensions = [
    '.ts', '.js', '.tsx', '.jsx',
    '.py', '.java', '.cs', '.cpp', '.c', '.h',
    '.go', '.rs', '.rb', '.php',
    '.html', '.css', '.scss', '.sass',
    '.json', '.yaml', '.yml', '.md', '.txt'
  ];
  
  const extension = path.substring(path.lastIndexOf('.'));
  return allowedExtensions.includes(extension.toLowerCase());
}
```

## Secret Management

### Azure Key Vault Integration

**Service Principal Setup:**
```bash
# Erstelle Service Principal für Code Agent
SP_INFO=$(az ad sp create-for-rbac \
  --name "code-agent-sp" \
  --role "Key Vault Secrets User" \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME/providers/Microsoft.KeyVault/vaults/$KV_NAME")

CLIENT_ID=$(echo $SP_INFO | jq -r '.appId')
CLIENT_SECRET=$(echo $SP_INFO | jq -r '.password')
TENANT_ID=$(echo $SP_INFO | jq -r '.tenant')

# Key Vault Access Policy
az keyvault set-policy \
  --name code-agent-kv \
  --spn $CLIENT_ID \
  --secret-permissions get list
```

**Application Code:**
```typescript
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';

class SecretManager {
  private client: SecretClient;
  
  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(vaultUrl, credential);
  }
  
  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value || '';
    } catch (error) {
      throw new Error(`Failed to retrieve secret ${secretName}: ${error.message}`);
    }
  }
  
  async refreshSecrets(): Promise<void> {
    // Implement secret refresh logic
    const secrets = ['ado-pat', 'anthropic-api-key', 'webhook-secret'];
    
    for (const secretName of secrets) {
      const value = await this.getSecret(secretName);
      process.env[this.envKeyFromSecret(secretName)] = value;
    }
  }
  
  private envKeyFromSecret(secretName: string): string {
    return secretName.toUpperCase().replace(/-/g, '_');
  }
}
```

### Environment Variable Security

**Development (.env):**
```bash
# .env.example - safe to commit
ADO_ORG=your-organization
ADO_PROJECT=your-project
ADO_TOKEN=your-token-here  # Real token only in actual .env

# .env - never commit
ADO_TOKEN=pat_real_token_value_here
WEBHOOK_SECRET=actual_webhook_secret_here
```

**Production (Container Apps):**
```yaml
# No secrets in ARM template
resources:
  - type: Microsoft.App/containerApps
    properties:
      configuration:
        secrets:
          - name: ado-pat
            keyVaultUrl: https://code-agent-kv.vault.azure.net/secrets/ado-pat
          - name: webhook-secret
            keyVaultUrl: https://code-agent-kv.vault.azure.net/secrets/webhook-secret
        registries:
          - server: myregistry.azurecr.io
            identity: /subscriptions/.../managedIdentities/code-agent-identity
```

## Data Protection

### Sensitive Data Classification

**Public** (Logs OK):
- Correlation IDs
- Timestamps
- Service names
- Status codes
- Non-personal metadata

**Internal** (Logs with care):
- Repository names
- Branch names
- PR numbers
- User display names
- Intent descriptions (may contain business logic)

**Confidential** (Never log):
- Access tokens
- API keys
- Source code content
- LLM prompts/responses (may contain proprietary code)
- Personal identifiers (email addresses)

### Log Sanitization

```typescript
class LogSanitizer {
  private static readonly SENSITIVE_PATTERNS = [
    /pat_[a-zA-Z0-9]{52}/g,           // ADO PAT
    /sk-ant-api03-[a-zA-Z0-9-_]{95}/g, // Anthropic key
    /sk-proj-[a-zA-Z0-9]{48}/g,       // OpenAI key
    /Bearer\s+[a-zA-Z0-9-_.]+/gi,     // Bearer tokens
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g // Email addresses
  ];
  
  static sanitize(message: string): string {
    let sanitized = message;
    
    for (const pattern of this.SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }
  
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitize(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip sensitive keys entirely
        if (['token', 'password', 'secret', 'key'].some(s => 
            key.toLowerCase().includes(s))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  }
}

// Usage in logger
const logger = pino({
  serializers: {
    req: (req) => LogSanitizer.sanitizeObject({
      id: req.id,
      method: req.method,
      url: req.url,
      headers: req.headers
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: (err) => LogSanitizer.sanitizeObject({
      message: err.message,
      stack: err.stack
    })
  }
});
```

### LLM Request Security

**Content Filtering:**
```typescript
function sanitizeForLLM(content: string): string {
  // Remove potential secrets from code
  return content
    .replace(/password\s*[:=]\s*["'][^"']+["']/gi, 'password: "[REDACTED]"')
    .replace(/api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, 'api_key: "[REDACTED]"')
    .replace(/token\s*[:=]\s*["'][^"']+["']/gi, 'token: "[REDACTED]"')
    .replace(/secret\s*[:=]\s*["'][^"']+["']/gi, 'secret: "[REDACTED]"');
}

function validateContentSize(content: string): void {
  const maxSize = 100 * 1024; // 100KB
  if (content.length > maxSize) {
    throw new Error(`Content too large: ${content.length} bytes > ${maxSize} bytes`);
  }
}
```

## Rate Limiting & DoS Protection

### Multi-Layer Rate Limiting

**Layer 1: Gateway (Global)**
```typescript
import rateLimit from '@fastify/rate-limit';

app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: (req, context) => ({
    error: 'Rate limit exceeded',
    retryAfter: Math.round(context.ttl / 1000)
  })
});
```

**Layer 2: Per-User**
```typescript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const userLimiter = new RateLimiterMemory({
  keyPrefix: 'user',
  points: 10, // 10 requests
  duration: 300, // per 5 minutes
  blockDuration: 300 // block for 5 minutes
});

async function checkUserLimit(userId: string): Promise<void> {
  try {
    await userLimiter.consume(userId);
  } catch (rateLimiterRes) {
    throw new Error(`Rate limit exceeded. Retry after ${rateLimiterRes.msBeforeNext}ms`);
  }
}
```

**Layer 3: Per-Repository**
```typescript
const repoLimiter = new RateLimiterMemory({
  keyPrefix: 'repo',
  points: 50, // 50 variants
  duration: 3600, // per hour
  blockDuration: 1800 // block for 30 minutes
});
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const adoCircuitBreaker = new CircuitBreaker(5, 30000);

async function callADOAPI(operation: () => Promise<any>) {
  return adoCircuitBreaker.execute(operation);
}
```

## Access Control

### Repository Permissions

**ADO Project-Level Restrictions:**
```yaml
# azure-pipelines.yml
trigger: none # No automatic builds

permissions:
  contents: read
  pull-requests: write
  issues: read

# Restrict to specific repositories
resources:
  repositories:
    - repository: allowed-repo-1
      type: git
      name: MyOrg/MyProject/AllowedRepo1
    - repository: allowed-repo-2  
      type: git
      name: MyOrg/MyProject/AllowedRepo2
```

**Runtime Permission Check:**
```typescript
interface RepoPermission {
  org: string;
  project: string;
  repo: string;
  allowedUsers: string[];
  allowedGroups: string[];
}

class PermissionChecker {
  private allowedRepos: RepoPermission[] = [];
  
  async checkPermission(
    repoUrn: string,
    userId: string
  ): Promise<boolean> {
    const [, org, project, repo] = repoUrn.split(':');
    
    const permission = this.allowedRepos.find(p => 
      p.org === org && 
      p.project === project && 
      p.repo === repo
    );
    
    if (!permission) {
      throw new Error(`Repository ${repoUrn} not configured for AI agent`);
    }
    
    if (permission.allowedUsers.includes(userId)) {
      return true;
    }
    
    // Check group membership via ADO API
    const userGroups = await this.getUserGroups(userId);
    return permission.allowedGroups.some(group => 
      userGroups.includes(group)
    );
  }
  
  private async getUserGroups(userId: string): Promise<string[]> {
    // Implementation: Query ADO for user's group memberships
    // Cache results for performance
  }
}
```

## Compliance & Auditing

### Audit Trail

**Database Schema:**
```sql
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Event Details
    event_type TEXT NOT NULL, -- 'auth_success', 'auth_failure', 'token_used', etc.
    event_category TEXT NOT NULL, -- 'authentication', 'authorization', 'data_access'
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- User Context
    user_id TEXT,
    user_ip_address INET,
    user_agent TEXT,
    
    -- Resource Context  
    resource_type TEXT, -- 'repository', 'pr', 'branch'
    resource_id TEXT,   -- 'org:project:repo:123'
    
    -- Action Details
    action TEXT NOT NULL, -- 'read', 'write', 'create', 'delete'
    outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
    
    -- Additional Context
    correlation_id TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Indexes
    INDEX idx_security_audit_timestamp (timestamp),
    INDEX idx_security_audit_user (user_id),
    INDEX idx_security_audit_resource (resource_type, resource_id),
    INDEX idx_security_audit_event (event_type, outcome)
);
```

**Audit Logging:**
```typescript
class SecurityAuditor {
  async logEvent(event: SecurityEvent): Promise<void> {
    const auditEntry = {
      event_type: event.type,
      event_category: event.category,
      severity: event.severity,
      user_id: event.userId,
      user_ip_address: event.userIp,
      user_agent: event.userAgent,
      resource_type: event.resourceType,
      resource_id: event.resourceId,
      action: event.action,
      outcome: event.outcome,
      correlation_id: event.correlationId,
      metadata: event.metadata
    };
    
    await this.database.insert('security_audit_logs', auditEntry);
    
    // Real-time alerting for high-severity events
    if (event.severity === 'critical' || event.severity === 'high') {
      await this.sendSecurityAlert(auditEntry);
    }
  }
  
  private async sendSecurityAlert(entry: any): Promise<void> {
    // Send to SIEM, Slack, PagerDuty, etc.
  }
}

// Usage throughout application
const auditor = new SecurityAuditor();

// Authentication success
await auditor.logEvent({
  type: 'webhook_auth_success',
  category: 'authentication',
  severity: 'low',
  userId: 'alice@company.com',
  userIp: '192.168.1.100',
  action: 'authenticate',
  outcome: 'success',
  correlationId: 'corr-123'
});

// Authorization failure
await auditor.logEvent({
  type: 'repo_access_denied',
  category: 'authorization',
  severity: 'medium',
  userId: 'bob@company.com',
  resourceType: 'repository',
  resourceId: 'ado:org:project:restricted-repo',
  action: 'read',
  outcome: 'denied',
  correlationId: 'corr-456'
});
```

### Compliance Reports

**GDPR Compliance:**
```sql
-- User data report (for GDPR requests)
SELECT 
  j.id as job_id,
  j.created_by as user_email,
  j.intent,
  j.created_at,
  j.status,
  COUNT(v.id) as variants_created
FROM jobs j
LEFT JOIN variants v ON j.id = v.job_id
WHERE j.created_by = $1  -- User email
  AND j.created_at > $2  -- Date range
GROUP BY j.id
ORDER BY j.created_at DESC;
```

**SOC 2 Audit Trail:**
```sql
-- Access logs for specific time period
SELECT 
  sal.timestamp,
  sal.event_type,
  sal.user_id,
  sal.resource_id,
  sal.action,
  sal.outcome,
  sal.user_ip_address
FROM security_audit_logs sal
WHERE sal.timestamp BETWEEN $1 AND $2
  AND sal.event_category = 'authorization'
ORDER BY sal.timestamp;
```

**Data Retention Policy:**
```sql
-- Automated cleanup (run weekly)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM security_audit_logs 
WHERE timestamp < NOW() - INTERVAL '7 years'; -- Legal requirement

-- Archive before deletion
INSERT INTO audit_logs_archive 
SELECT * FROM audit_logs 
WHERE created_at BETWEEN NOW() - INTERVAL '2 years 1 day' 
                      AND NOW() - INTERVAL '2 years';
```

## Security Testing

### Penetration Testing Checklist

**Authentication & Authorization:**
- [ ] Invalid webhook signatures rejected
- [ ] Expired tokens properly handled
- [ ] Permission boundaries enforced
- [ ] Rate limiting effective

**Input Validation:**
- [ ] SQL injection attempts blocked
- [ ] Command injection prevented
- [ ] Path traversal attacks fail
- [ ] Large payloads rejected

**Information Disclosure:**
- [ ] Error messages don't leak internals
- [ ] Logs don't contain secrets
- [ ] Debug endpoints disabled in production
- [ ] CORS properly configured

**Infrastructure:**
- [ ] Default passwords changed
- [ ] Unnecessary services disabled
- [ ] Network segmentation in place
- [ ] TLS configuration secure

### Automated Security Testing

```bash
# OWASP ZAP security scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://your-domain.com \
  -J zap-report.json

# Trivy container scanning
trivy image --severity HIGH,CRITICAL \
  myregistry.azurecr.io/gateway:latest

# npm audit for dependencies
npm audit --audit-level high

# Secrets scanning with git-secrets
git secrets --scan

# SSL/TLS testing
testssl.sh https://your-domain.com
```

Diese umfassende Security-Dokumentation stellt sicher, dass der Code Agent MVP enterprise-tauglich und compliant betrieben werden kann.
