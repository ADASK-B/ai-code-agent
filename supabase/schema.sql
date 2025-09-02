-- Code Agent MVP Database Schema
-- Supabase/PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Jobs table - tracks orchestration instances
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_pr TEXT NOT NULL, -- Format: "ado:org:project:repo:prId"
    repo_key TEXT NOT NULL, -- Format: "ado:org:project:repo"
    intent TEXT NOT NULL,
    variants_requested INTEGER NOT NULL CHECK (variants_requested BETWEEN 1 AND 10),
    created_by TEXT NOT NULL, -- ADO user unique name
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'started' CHECK (
        status IN ('started', 'in_progress', 'success', 'partial_success', 'failed')
    ),
    orchestrator_instance_id TEXT UNIQUE, -- Durable Functions instance ID
    correlation_id TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Additional context
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER, -- Total duration in milliseconds
    error_message TEXT,
    
    -- Indexes
    CONSTRAINT unique_origin_pr_correlation UNIQUE (origin_pr, correlation_id)
);

-- Variants table - tracks individual variant outcomes
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    k INTEGER NOT NULL CHECK (k >= 1), -- Variant number (1, 2, 3, etc.)
    branch_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'success', 'failed', 'timeout')
    ),
    pr_number INTEGER,
    pr_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    notes TEXT, -- LLM explanation or error details
    patch_size_bytes INTEGER,
    files_changed INTEGER,
    commit_sha TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT unique_job_variant UNIQUE (job_id, k)
);

-- Audit logs table - detailed activity tracking
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL, -- e.g., 'createBranch', 'getPatch', 'commitPatch'
    status TEXT NOT NULL CHECK (status IN ('started', 'success', 'failed', 'retry')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_ms INTEGER,
    correlation_id TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    error_data JSONB,
    attempt_number INTEGER DEFAULT 1,
    
    -- Indexes for performance
    INDEX idx_audit_job_id (job_id),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_correlation_id (correlation_id)
);

-- Performance metrics table - for monitoring and SLOs
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT NOT NULL, -- 'ms', 'count', 'bytes', etc.
    tags JSONB DEFAULT '{}', -- Additional dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_metrics_name_time (metric_name, created_at),
    INDEX idx_metrics_tags (tags)
);

-- Rate limiting tracking (optional - can use Redis instead)
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_name TEXT NOT NULL, -- e.g., "user:alice", "repo:myorg/myproject/myrepo"
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_duration_seconds INTEGER NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_rate_limit_window UNIQUE (key_name, window_start)
);

-- Indexes for performance
CREATE INDEX idx_jobs_repo_key ON jobs(repo_key);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_jobs_correlation_id ON jobs(correlation_id);

CREATE INDEX idx_variants_job_id ON variants(job_id);
CREATE INDEX idx_variants_status ON variants(status);
CREATE INDEX idx_variants_pr_number ON variants(pr_number);

CREATE INDEX idx_rate_limits_key_window ON rate_limits(key_name, window_start);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limits_updated_at 
    BEFORE UPDATE ON rate_limits 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW job_summary AS
SELECT 
    j.id,
    j.origin_pr,
    j.repo_key,
    j.intent,
    j.variants_requested,
    j.created_by,
    j.status,
    j.created_at,
    j.completed_at,
    j.duration_ms,
    COUNT(v.id) as variants_total,
    COUNT(v.id) FILTER (WHERE v.status = 'success') as variants_successful,
    COUNT(v.id) FILTER (WHERE v.status = 'failed') as variants_failed,
    COUNT(v.id) FILTER (WHERE v.status = 'timeout') as variants_timeout,
    ARRAY_AGG(v.pr_number) FILTER (WHERE v.pr_number IS NOT NULL) as pr_numbers
FROM jobs j
LEFT JOIN variants v ON j.id = v.job_id
GROUP BY j.id;

-- Row Level Security (RLS) policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (customize based on your auth strategy)
-- Allow all for now, restrict in production
CREATE POLICY "Allow all for authenticated users" ON jobs
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON variants
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON audit_logs
    FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON performance_metrics
    FOR ALL USING (true);

-- Grant permissions to service role
-- Replace 'service_role' with your actual service role name
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Sample data for testing (remove in production)
INSERT INTO jobs (
    origin_pr, 
    repo_key, 
    intent, 
    variants_requested, 
    created_by, 
    status,
    correlation_id,
    orchestrator_instance_id
) VALUES (
    'ado:myorg:myproject:myrepo:123',
    'ado:myorg:myproject:myrepo',
    'Make all buttons red',
    2,
    'alice@company.com',
    'success',
    'test-corr-001',
    'test-instance-001'
);

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Main orchestration jobs tracking';
COMMENT ON TABLE variants IS 'Individual variant outcomes per job';
COMMENT ON TABLE audit_logs IS 'Detailed activity logs for debugging';
COMMENT ON TABLE performance_metrics IS 'System performance metrics for monitoring';
COMMENT ON TABLE rate_limits IS 'Rate limiting counters (alternative to Redis)';

COMMENT ON COLUMN jobs.origin_pr IS 'Full identifier of the originating PR';
COMMENT ON COLUMN jobs.repo_key IS 'Repository identifier for grouping';
COMMENT ON COLUMN jobs.orchestrator_instance_id IS 'Azure Durable Functions instance ID for correlation';
COMMENT ON COLUMN variants.k IS 'Variant number within the job (1-indexed)';
COMMENT ON COLUMN variants.patch_size_bytes IS 'Size of the unified diff in bytes';
