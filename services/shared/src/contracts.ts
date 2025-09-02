// Minimal type definitions without external dependencies

// =============================================================================
// Gateway Contracts
// =============================================================================

export interface AdoWebhookEvent {
  subscriptionId: string;
  notificationId: number;
  id: string;
  eventType: string;
  publisherId: string;
  message: {
    text: string;
  };
  detailedMessage: {
    text: string;
  };
  resource: {
    id: number;
    status?: string;
    pullRequestId?: number;
    repository: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
      };
    };
    createdBy: {
      displayName: string;
      uniqueName: string;
      id: string;
    };
    content?: string;
    commentType?: string;
    pullRequest?: {
      pullRequestId: number;
      status: string;
      sourceRefName: string;
      targetRefName: string;
      repository: {
        id: string;
        name: string;
        project: {
          id: string;
          name: string;
        };
      };
    };
  };
  resourceVersion: string;
  resourceContainers: {
    collection: {
      id: string;
      baseUrl: string;
    };
    account: {
      id: string;
      baseUrl: string;
    };
    project: {
      id: string;
      baseUrl: string;
    };
  };
  createdDate: string;
}

// =============================================================================
// Orchestrator Contracts
// =============================================================================

export interface EditVariantsInput {
  repoUrn: string; // "ado:org:project:repo"
  prId: number;
  commentId: number;
  sourceRef: string;
  targetRef: string;
  actor: string;
  intent: string;
  variantsRequested: number;
  correlationId: string;
  idempotencyKey: string;
}

export interface VariantResult {
  variantNumber: number;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'timeout';
  branch: string | null;
  prNumber: number | null;
  prUrl: string | null;
  commitSha: string | null;
  patchNotes: string | null;
  error: string | null;
  duration: number | null; // milliseconds
}

export interface EditVariantsResult {
  status: 'success' | 'partial_success' | 'failed';
  variants: VariantResult[];
  metrics: {
    totalRequested: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

// =============================================================================
// Adapter Contracts
// =============================================================================

export interface PrMetadata {
  id: number;
  title: string;
  description: string;
  sourceRefName: string;
  targetRefName: string;
  repository: {
    id: string;
    name: string;
    project: {
      name: string;
    };
  };
  createdBy: {
    displayName: string;
    uniqueName: string;
  };
  files: Array<{
    path: string;
    changeType: 'add' | 'edit' | 'delete';
    content?: string;
    size: number;
  }>;
}

export interface CreateBranchInput {
  repoUrn: string;
  baseBranch: string;
  newBranch: string;
  correlationId: string;
}

export interface CreateBranchResult {
  branchName: string;
  objectId: string; // Base commit SHA
}

export interface CommitPatchInput {
  repoUrn: string;
  branch: string;
  patch: string; // Unified diff
  message: string;
  correlationId: string;
}

export interface CommitPatchResult {
  commitId: string;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
}

export interface OpenDraftPrInput {
  repoUrn: string;
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description: string;
  correlationId: string;
}

export interface OpenDraftPrResult {
  prNumber: number;
  prUrl: string;
  prId: string;
}

export interface PostCommentInput {
  repoUrn: string;
  prId: number;
  comment: string;
  parentCommentId?: number;
  correlationId: string;
}

export interface PostCommentResult {
  commentId: number;
  url: string;
}

export interface SetPrStatusInput {
  repoUrn: string;
  prId: number;
  status: 'pending' | 'in_progress' | 'success' | 'failed' | 'partial_success';
  description: string;
  targetUrl?: string;
  correlationId: string;
}

// =============================================================================
// LLM Patch Contracts
// =============================================================================

export interface GetPatchInput {
  intent: string;
  variantNumber: number;
  prMeta: PrMetadata;
  correlationId: string;
}

export interface PatchResult {
  diff: string; // Unified diff format
  notes: string; // LLM explanation
  confidence: number; // 0.0-1.0
  filesChanged: string[];
}

// =============================================================================
// Common Types
// =============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  version: string;
  dependencies?: Record<string, 'ok' | 'error'>;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: string;
  statusCode: number;
  correlationId?: string;
  timestamp: string;
  details?: any;
}

// =============================================================================
// Database Types (Supabase)
// =============================================================================

export interface Job {
  id: string;
  origin_pr: string;
  repo_key: string;
  intent: string;
  variants_requested: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'started' | 'in_progress' | 'success' | 'partial_success' | 'failed';
  orchestrator_instance_id?: string;
  correlation_id: string;
  metadata: Record<string, any>;
  completed_at?: string;
  duration_ms?: number;
  error_message?: string;
}

export interface Variant {
  id: string;
  job_id: string;
  k: number;
  branch_name?: string;
  status: 'pending' | 'processing' | 'success' | 'failed' | 'timeout';
  pr_number?: number;
  pr_url?: string;
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
  notes?: string;
  patch_size_bytes?: number;
  files_changed?: number;
  commit_sha?: string;
  error_message?: string;
  retry_count: number;
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  job_id: string;
  variant_id?: string;
  activity_name: string;
  status: 'started' | 'success' | 'failed' | 'retry';
  created_at: string;
  duration_ms?: number;
  correlation_id: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_data?: Record<string, any>;
  attempt_number: number;
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_RETRY_OPTIONS: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 500,
  maxDelayMs: 30000,
  backoffFactor: 2.0
};

export const LLM_RETRY_OPTIONS: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2.0
};

export const ADO_RETRY_OPTIONS: RetryConfig = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
  backoffFactor: 1.5
};

export const SUPPORTED_FILE_EXTENSIONS = [
  '.ts', '.js', '.tsx', '.jsx',
  '.py', '.java', '.cs', '.cpp', '.c', '.h',
  '.go', '.rs', '.rb', '.php',
  '.html', '.css', '.scss', '.sass', '.less',
  '.json', '.xml', '.yaml', '.yml',
  '.md', '.txt'
];

export const MAX_PATCH_SIZE_BYTES = 200000;
export const MAX_FILES_IN_PATCH = 50;
export const MAX_VARIANTS = 10;
export const VARIANT_TIMEOUT_MINUTES = 8;
