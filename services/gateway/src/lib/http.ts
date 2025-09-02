import { env } from './env';

/**
 * HTTP client with timeout and error handling
 */
export async function httpPost(
  url: string,
  data: any,
  options: {
    timeout?: number;
    headers?: Record<string, string>;
    correlationId?: string;
  } = {}
): Promise<Response> {
  const {
    timeout = env.HTTP_TIMEOUT,
    headers = {},
    correlationId
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'code-agent-gateway/1.0.0',
        ...(correlationId && { 'x-corr-id': correlationId }),
        ...headers
      },
      body: JSON.stringify(data),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  }
}

/**
 * Retry configuration for HTTP requests
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2
};

/**
 * HTTP POST with retry logic
 */
export async function httpPostWithRetry(
  url: string,
  data: any,
  options: {
    timeout?: number;
    headers?: Record<string, string>;
    correlationId?: string;
    retry?: Partial<RetryConfig>;
  } = {}
): Promise<Response> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...options.retry };
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      const response = await httpPost(url, data, options);
      
      // Consider 2xx and some 4xx as success (don't retry)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }
      
      // 5xx errors or network issues - retry
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    // Don't delay after last attempt
    if (attempt < retryConfig.maxAttempts) {
      const delay = Math.min(
        retryConfig.baseDelayMs * Math.pow(retryConfig.backoffFactor, attempt - 1),
        retryConfig.maxDelayMs
      );
      
      // Add jitter (±25%)
      const jitter = delay * 0.25 * (Math.random() - 0.5);
      const finalDelay = Math.max(100, delay + jitter);
      
      await sleep(finalDelay);
    }
  }

  throw new Error(`HTTP request failed after ${retryConfig.maxAttempts} attempts. Last error: ${lastError.message}`);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
