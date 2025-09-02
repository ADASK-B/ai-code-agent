# Supabase Database Setup

Diese Ordner enthält die Datenbankstruktur für den Code Agent MVP.

## Setup

### Option 1: Supabase Cloud (Empfohlen für Entwicklung)

1. **Projekt erstellen**: https://supabase.com/dashboard
2. **Schema importieren**:
   ```sql
   -- In Supabase SQL Editor ausführen
   -- Inhalt von schema.sql kopieren und ausführen
   ```
3. **Umgebungsvariablen** in allen Services setzen:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

### Option 2: Lokale Supabase (Optional)

```bash
# Supabase CLI installieren
npm install -g supabase

# Projekt initialisieren
supabase init

# Lokale Instanz starten
supabase start

# Schema anwenden
supabase db reset

# Studio öffnen
supabase studio
```

### Option 3: Docker Compose (Enthalten)

```bash
# Mit Supabase-Profile starten
docker compose --profile supabase-local up -d

# Studio: http://localhost:3000
# Postgres: localhost:5432
```

## Datenbankstruktur

### Core Tables

- **`jobs`** - Haupt-Orchestrierung (1 pro PR-Kommentar)
- **`variants`** - Einzelne Varianten (N pro Job)
- **`audit_logs`** - Detaillierte Aktivitätsprotokolle
- **`performance_metrics`** - Metriken für Monitoring

### Wichtige Felder

**jobs table:**
```sql
id                    -- UUID, Primary Key
origin_pr            -- "ado:org:project:repo:prId"
repo_key             -- "ado:org:project:repo" 
intent               -- User's natural language intent
variants_requested   -- Number of variants (1-10)
status               -- started|in_progress|success|partial_success|failed
correlation_id       -- x-corr-id for tracing
```

**variants table:**
```sql
job_id              -- FK to jobs
k                   -- Variant number (1, 2, 3...)
branch_name         -- Git branch name
pr_number           -- ADO PR number
status              -- pending|processing|success|failed|timeout
```

## Queries

### Job Status

```sql
-- Get job with variant summary
SELECT * FROM job_summary WHERE id = $1;

-- Recent jobs by repo
SELECT * FROM jobs 
WHERE repo_key = 'ado:myorg:myproject:myrepo'
ORDER BY created_at DESC 
LIMIT 10;
```

### Performance Monitoring

```sql
-- Average job duration by status
SELECT 
    status,
    AVG(duration_ms) as avg_duration_ms,
    COUNT(*) as count
FROM jobs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- Variant success rate
SELECT 
    COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate
FROM variants 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Debugging

```sql
-- Get full audit trail for a job
SELECT 
    al.*,
    v.k as variant_number
FROM audit_logs al
LEFT JOIN variants v ON al.variant_id = v.id
WHERE al.job_id = $1
ORDER BY al.created_at;

-- Failed activities
SELECT 
    activity_name,
    COUNT(*) as failure_count,
    string_agg(DISTINCT error_data->>'message', '; ') as error_messages
FROM audit_logs 
WHERE status = 'failed' 
    AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY activity_name
ORDER BY failure_count DESC;
```

## Maintenance

### Cleanup Old Data

```sql
-- Delete jobs older than 30 days
DELETE FROM jobs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Archive completed jobs to separate table (optional)
INSERT INTO jobs_archive 
SELECT * FROM jobs 
WHERE status IN ('success', 'failed') 
    AND completed_at < NOW() - INTERVAL '7 days';
```

### Index Maintenance

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Reindex if needed
REINDEX TABLE jobs;
```

## Security

### Row Level Security

RLS ist aktiviert für alle Tabellen. Aktuell sind alle Operationen erlaubt. Für Produktion:

```sql
-- Beispiel: Nur eigene Jobs sehen
CREATE POLICY "Users see own jobs" ON jobs
    FOR SELECT USING (created_by = auth.jwt() ->> 'email');

-- Service Role für Backend-Services
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
```

### Secrets Management

- **Development**: `.env` files (nicht in Git)
- **Production**: Azure Key Vault oder Supabase Vault

## Monitoring

### Wichtige Metriken

- Jobs pro Stunde/Tag
- Variant-Erfolgsrate
- Durchschnittliche Job-Dauer
- Fehlerrate nach Aktivität
- Datenbank-Performance

### Alerts einrichten

```sql
-- Beispiel: Hohe Fehlerrate
SELECT 
    COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
FROM jobs 
WHERE created_at > NOW() - INTERVAL '1 hour';
-- Alert wenn > 5%
```

## Migration

Bei Schema-Änderungen:

1. **Backup erstellen**
2. **Migration-Script** in `migrations/` Ordner
3. **Test in Staging**
4. **Rollout in Production**

Beispiel Migration:
```sql
-- migrations/002_add_retry_tracking.sql
ALTER TABLE variants ADD COLUMN retry_count INTEGER DEFAULT 0;
ALTER TABLE variants ADD COLUMN last_retry_at TIMESTAMP WITH TIME ZONE;
```
