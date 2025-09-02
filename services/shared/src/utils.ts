/**
 * Common utilities for error handling, retry logic, and validation
 */

export type Logger = {
  info: (msg: string, meta?: any) => void;
  warn: (msg: string, meta?: any) => void;
  error: (msg: string, meta?: any) => void;
  debug: (msg: string, meta?: any) => void;
};

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public correlationId?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, correlationId?: string, details?: any) {
    super(message, 400, correlationId, details);
    this.name = 'ValidationError';
  }
}

export class TimeoutError extends ServiceError {
  constructor(message: string, correlationId?: string) {
    super(message, 408, correlationId);
    this.name = 'TimeoutError';
  }
}

export class RateLimitError extends ServiceError {
  constructor(message: string, correlationId?: string) {
    super(message, 429, correlationId);
    this.name = 'RateLimitError';
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  logger: Logger,
  operationName: string
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        logger.info(`${operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        logger.error(`${operationName} failed after ${attempt} attempts`, { error: lastError.message });
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        options.baseDelayMs * Math.pow(options.backoffFactor, attempt - 1),
        options.maxDelayMs
      );
      
      logger.warn(`${operationName} failed on attempt ${attempt}, retrying in ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxAttempts: options.maxAttempts
      });
      
      await sleep(delay);
    }
  }
  
  throw lastError!;
}

export function generateCorrelationId(): string {
  return [
    Date.now().toString(36),
    Math.random().toString(36).substring(2, 8)
  ].join('-');
}

export function parseRepoUrn(repoUrn: string): {
  org: string;
  project: string;
  repo: string;
} {
  const parts = repoUrn.split(':');
  if (parts.length !== 4 || parts[0] !== 'ado') {
    throw new ValidationError(`Invalid repo URN format: ${repoUrn}`);
  }
  
  return {
    org: parts[1],
    project: parts[2],
    repo: parts[3]
  };
}

export function formatRepoUrn(org: string, project: string, repo: string): string {
  return `ado:${org}:${project}:${repo}`;
}

export function sanitizeForBranchName(input: string): string {
  // Replace invalid chars with dashes, limit length
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export function validateEnvironment(required: string[]): void {
  const missing = required.filter(key => !(key in process.env) || !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export function parseIntOr(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function redactSensitive(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const redacted = { ...obj };
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
  
  for (const [key, value] of Object.entries(redacted)) {
    const keyLower = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitive(value);
    }
  }
  
  return redacted;
}

export function extractPrIdFromComment(content: string): { command: string; prId: number | null; intent: string } | null {
  // Match: /edit /N <intent>
  const match = content.match(/^\/edit\s+\/(\d+)\s+(.+)$/i);
  if (!match) return null;
  
  return {
    command: 'edit',
    prId: parseInt(match[1], 10),
    intent: match[2].trim()
  };
}

export function isFileSupported(filename: string): boolean {
  const supportedExtensions = [
    '.ts', '.js', '.tsx', '.jsx',
    '.py', '.java', '.cs', '.cpp', '.c', '.h',
    '.go', '.rs', '.rb', '.php',
    '.html', '.css', '.scss', '.sass', '.less',
    '.json', '.xml', '.yaml', '.yml',
    '.md', '.txt'
  ];
  
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return supportedExtensions.includes(ext);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Health check utilities
export function createHealthCheck(serviceName: string, version: string) {
  return {
    async check(dependencies: Record<string, () => Promise<boolean>> = {}): Promise<any> {
      const timestamp = new Date().toISOString();
      const dependencyResults: Record<string, 'ok' | 'error'> = {};
      
      for (const [name, checkFn] of Object.entries(dependencies)) {
        try {
          const isHealthy = await checkFn();
          dependencyResults[name] = isHealthy ? 'ok' : 'error';
        } catch {
          dependencyResults[name] = 'error';
        }
      }
      
      const hasErrors = Object.values(dependencyResults).includes('error');
      
      return {
        status: hasErrors ? 'degraded' : 'ok',
        timestamp,
        service: serviceName,
        version,
        dependencies: dependencyResults
      };
    }
  };
}
