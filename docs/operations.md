# Operations Guide

Dieses Dokument beschreibt Monitoring, Alerts, SLOs und Wartungsverfahren für den Code Agent MVP.

## Service Level Objectives (SLOs)

### Verfügbarkeit
- **Gateway**: 99.5% (8.77h Downtime/Monat)
- **Orchestrator**: 99.9% (43.8min Downtime/Monat)
- **End-to-End**: 99.0% (7.31h Downtime/Monat)

### Performance
- **P95 Variant Duration** (Stub): < 90 Sekunden
- **P95 Variant Duration** (LLM): < 4 Minuten
- **P99 Variant Duration**: < 8 Minuten
- **Gateway Response Time**: < 500ms (P95)

### Reliability
- **Variant Success Rate**: > 95% (exkl. User-Fehler)
- **System Error Rate**: < 2%
- **ADO Rate Limit Rate**: < 5%

## Monitoring Stack

### Application Insights (Azure)

**Custom Metrics:**
```javascript
// Variant completion
telemetry.trackMetric({
  name: 'variant_duration',
  value: durationMs,
  properties: {
    status: 'success',
    variant: k,
    jobId: jobId,
    llmProvider: 'claude'
  }
});

// Error tracking
telemetry.trackException({
  exception: error,
  properties: {
    correlationId: corrId,
    component: 'adapter',
    operation: 'createBranch'
  }
});

// Business metrics
telemetry.trackEvent({
  name: 'job_completed',
  properties: {
    totalVariants: 3,
    successfulVariants: 2,
    intent: 'make-buttons-red',
    actor: 'alice@company.com'
  }
});
```

**Kusto Queries:**
```kusto
// SLO: Variant success rate
customEvents
| where name == "variant_completed"
| where timestamp > ago(24h)
| summarize 
    Total = count(),
    Successful = countif(customDimensions.status == "success"),
    SuccessRate = round(100.0 * countif(customDimensions.status == "success") / count(), 2)

// P95 Duration by LLM Provider
customMetrics
| where name == "variant_duration"
| where timestamp > ago(24h)
| summarize percentile(value, 95) by tostring(customDimensions.llmProvider)

// Error rate by component
exceptions
| where timestamp > ago(1h)
| summarize count() by tostring(customDimensions.component)
| order by count_ desc
```

### Prometheus + Grafana (Alternative)

**Metrics Collection:**
```javascript
// Prometheus metrics in each service
const promClient = require('prom-client');

const variantDuration = new promClient.Histogram({
  name: 'code_agent_variant_duration_seconds',
  help: 'Time to complete a code variant',
  labelNames: ['status', 'llm_provider', 'variant_number'],
  buckets: [1, 5, 10, 30, 60, 180, 300]
});

const httpRequests = new promClient.Counter({
  name: 'code_agent_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'service']
});
```

### Health Checks

**Gateway Health:**
```bash
curl -f https://your-domain.com/gateway/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T14:30:25.123Z",
  "service": "gateway",
  "version": "1.0.0",
  "environment": "production",
  "dependencies": {
    "orchestrator": "ok"
  }
}
```

**Deep Health Check:**
```bash
curl -f https://your-domain.com/gateway/ready
```

## Alert Rules

### Critical Alerts (PagerDuty)

**High Error Rate:**
```kusto
// Alert: Error rate > 5% over 5 minutes
exceptions
| where timestamp > ago(5m)
| summarize 
    errors = count(),
    total = (errors + toscalar(requests | where timestamp > ago(5m) | count))
| extend error_rate = 100.0 * errors / total
| where error_rate > 5.0
```

**Service Down:**
```kusto
// Alert: No heartbeats for 2 minutes
availabilityResults
| where timestamp > ago(2m)
| summarize latest = max(timestamp) by name
| where latest < ago(2m)
```

**High Latency:**
```kusto
// Alert: P95 > 8 minutes for variants
customMetrics
| where name == "variant_duration"
| where timestamp > ago(10m)
| summarize p95 = percentile(value, 95)
| where p95 > 480000  // 8 minutes in ms
```

### Warning Alerts (Slack)

**Circuit Breaker Open:**
```kusto
customEvents
| where name == "circuit_breaker_state_change"
| where customDimensions.newState == "open"
| where timestamp > ago(5m)
```

**Queue Backlog:**
```kusto
// Alert: > 10 jobs queued
customMetrics
| where name == "orchestrator_queue_depth"
| where timestamp > ago(5m)
| summarize avg(value)
| where avg_value > 10
```

**Rate Limit Warning:**
```kusto
// Alert: ADO rate limiting > 10 requests/minute
customEvents
| where name == "ado_rate_limited"
| where timestamp > ago(5m)
| summarize count()
| where count_ > 10
```

## Incident Response

### Severity Levels

**P0 - Critical (< 15min response)**
- Complete service outage
- Data loss or corruption
- Security breach

**P1 - High (< 1h response)**
- Significant feature unavailable
- Performance severely degraded
- Partial service outage

**P2 - Medium (< 4h response)**
- Minor feature issues
- Performance degraded
- Workaround available

**P3 - Low (< 24h response)**
- Cosmetic issues
- Documentation problems
- Enhancement requests

### Incident Response Playbooks

**Service Down:**
1. Check Application Insights dashboard
2. Verify external dependencies (ADO, Supabase, LLM providers)
3. Check recent deployments
4. Scale resources if needed
5. Rollback if deployment-related

**High Error Rate:**
1. Identify error patterns in logs
2. Check for recent configuration changes
3. Verify ADO token validity
4. Check LLM provider status
5. Implement circuit breaker if needed

**Performance Degradation:**
1. Check resource utilization (CPU, memory)
2. Verify database performance
3. Check LLM provider response times
4. Scale horizontally if bottleneck identified

### Communication Template

```markdown
## Incident Update: {title}

**Status:** {investigating|identified|monitoring|resolved}
**Impact:** {description}
**Started:** {timestamp}
**Services Affected:** {list}

### Current Status
{detailed update}

### Next Steps
{action items}

### Workaround
{if available}

*Next update in 30 minutes or when status changes*
```

## Deployment Process

### Blue-Green Deployment (Azure Container Apps)

```bash
# Deploy to staging revision
az containerapp revision copy \
  --name code-agent-gateway \
  --resource-group code-agent-rg \
  --from-revision gateway--abc123 \
  --image myregistry.azurecr.io/gateway:v1.2.0

# Test staging
curl -H "x-staging: true" https://code-agent.azurecontainerapps.io/health

# Traffic split (10% to new revision)
az containerapp ingress traffic set \
  --name code-agent-gateway \
  --resource-group code-agent-rg \
  --revision-weight gateway--abc123=90 gateway--def456=10

# Monitor for 30 minutes
# If no issues, complete migration
az containerapp ingress traffic set \
  --name code-agent-gateway \
  --resource-group code-agent-rg \
  --revision-weight gateway--def456=100

# Cleanup old revision
az containerapp revision deactivate \
  --name code-agent-gateway \
  --resource-group code-agent-rg \
  --revision gateway--abc123
```

### Database Migration

```sql
-- 1. Create migration script
-- migrations/003_add_performance_tracking.sql
BEGIN;

ALTER TABLE variants ADD COLUMN llm_provider TEXT;
ALTER TABLE variants ADD COLUMN llm_duration_ms INTEGER;

CREATE INDEX idx_variants_llm_provider ON variants(llm_provider);

-- Backfill existing data
UPDATE variants SET llm_provider = 'claude' WHERE llm_provider IS NULL;

COMMIT;
```

```bash
# 2. Apply migration
psql $DATABASE_URL < migrations/003_add_performance_tracking.sql

# 3. Verify migration
psql $DATABASE_URL -c "\d variants"
```

## Backup & Recovery

### Automated Backups

**Azure Storage (Orchestrator State):**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
CONTAINER="orchestrator-backups"

# Backup storage account
az storage blob sync \
  --source $SOURCE_STORAGE_ACCOUNT \
  --destination $BACKUP_STORAGE_ACCOUNT \
  --destination-container $CONTAINER/$DATE

# Retention: 30 days
az storage blob delete-batch \
  --source $CONTAINER \
  --pattern "*$(date -d '30 days ago' +%Y%m%d)*"
```

**Supabase Database:**
```bash
# Automated database backup
pg_dump $DATABASE_URL | gzip > backups/db_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore
gunzip -c backups/db_20240115_143025.sql.gz | psql $DATABASE_URL
```

### Disaster Recovery

**RTO (Recovery Time Objective):** 2 hours
**RPO (Recovery Point Objective):** 15 minutes

**Recovery Procedure:**
1. **Assess impact** - What's affected?
2. **Restore infrastructure** - Redeploy from IaC
3. **Restore data** - Latest backups
4. **Verify functionality** - End-to-end tests
5. **Communicate** - Update stakeholders

## Capacity Planning

### Resource Requirements

**Gateway:**
- CPU: 1 vCPU per 100 RPS
- Memory: 512MB base + 1MB per concurrent request
- Storage: Minimal (stateless)

**Orchestrator:**
- CPU: 2 vCPU per 50 concurrent jobs
- Memory: 1GB base + 10MB per job
- Storage: 100MB per 1000 jobs (state)

**Adapter:**
- CPU: 1 vCPU per 20 ADO operations/sec
- Memory: 512MB base + 5MB per operation
- Storage: Minimal (stateless)

**LLM-Patch:**
- CPU: 2 vCPU (I/O bound)
- Memory: 1GB base + provider-specific
- Storage: 1GB cache per 10,000 requests

### Scaling Triggers

**Horizontal Scaling (Container Apps):**
```yaml
scale:
  minReplicas: 2
  maxReplicas: 10
  rules:
  - name: http-requests
    http:
      metadata:
        concurrentRequests: '10'
  - name: cpu-utilization
    custom:
      type: cpu
      metadata:
        value: '70'
```

**Vertical Scaling Indicators:**
- Memory usage > 80% for 5 minutes
- CPU usage > 90% for 2 minutes
- Response time increase > 50%

## Security Operations

### Token Rotation

**ADO Personal Access Token:**
```bash
# Monthly rotation
# 1. Generate new token in ADO
# 2. Update Key Vault
az keyvault secret set \
  --vault-name code-agent-kv \
  --name ado-pat \
  --value $NEW_TOKEN

# 3. Restart services (picks up new token)
az containerapp revision copy \
  --name code-agent-adapter \
  --resource-group code-agent-rg
```

**Webhook Secret:**
```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Update in Key Vault
az keyvault secret set \
  --vault-name code-agent-kv \
  --name webhook-secret \
  --value $NEW_SECRET

# Update ADO webhook configuration
# (Manual step in ADO portal)
```

### Security Monitoring

```kusto
// Suspicious activity detection
customEvents
| where name in ("authentication_failed", "invalid_signature", "rate_limit_exceeded")
| where timestamp > ago(1h)
| summarize count() by tostring(customDimensions.source_ip)
| where count_ > 10
```

### Vulnerability Management

**Container Scanning:**
```bash
# Weekly Trivy scan
trivy image --severity HIGH,CRITICAL myregistry.azurecr.io/gateway:latest

# Update base images monthly
docker build --no-cache -t gateway:latest .
```

**Dependency Updates:**
```bash
# Monthly npm audit
npm audit --audit-level high
npm update

# Security-only updates (as needed)
npm audit fix --only=prod
```

## Performance Optimization

### Caching Strategies

**LLM Response Caching:**
```javascript
// Cache key: hash(intent + files + provider)
const cacheKey = crypto
  .createHash('sha256')
  .update(JSON.stringify({ intent, files, provider }))
  .digest('hex');

// TTL: 5 minutes for dev, 1 hour for prod
const ttl = process.env.NODE_ENV === 'production' ? 3600 : 300;
```

**ADO Metadata Caching:**
```javascript
// Cache PR metadata for 10 minutes
const prMetaCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCachedPrMeta(repoUrn, prId) {
  const key = `${repoUrn}:${prId}`;
  const cached = prMetaCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  return null;
}
```

### Database Optimization

**Query Performance:**
```sql
-- Monitor slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements 
WHERE mean_exec_time > 100  -- 100ms threshold
ORDER BY mean_exec_time DESC;

-- Index recommendations
SELECT 
  schemaname,
  tablename,
  attname,
  correlation,
  n_distinct,
  most_common_vals
FROM pg_stats
WHERE tablename IN ('jobs', 'variants', 'audit_logs')
ORDER BY correlation DESC;
```

**Connection Pooling:**
```javascript
// Supabase connection pool
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: { 'x-application-name': 'code-agent' }
  }
});
```

Dieses Operations-Guide stellt sicher, dass der Code Agent MVP professionell überwacht, gewartet und bei Problemen schnell wiederhergestellt werden kann.
