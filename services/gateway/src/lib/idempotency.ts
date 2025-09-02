/**
 * Simple in-memory idempotency store for development
 * In production, use Redis or similar distributed cache
 */
class IdempotencyStore {
  private store = new Map<string, { timestamp: number; result?: any }>();
  private readonly ttl: number;

  constructor(ttlMs = 60000) { // 1 minute default
    this.ttl = ttlMs;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.ttl;
    if (isExpired) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Set idempotency key with optional result
   */
  set(key: string, result?: any): void {
    this.store.set(key, {
      timestamp: Date.now(),
      result
    });
  }

  /**
   * Get stored result for idempotency key
   */
  get(key: string): any {
    const entry = this.store.get(key);
    return entry?.result;
  }

  /**
   * Clear expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get store size (for monitoring)
   */
  size(): number {
    return this.store.size;
  }
}

// Global instance for the service
export const idempotencyStore = new IdempotencyStore();

// Cleanup job
setInterval(() => {
  idempotencyStore.cleanup();
}, 60000); // Every minute

/**
 * Generate idempotency key for ADO webhook
 */
export function generateIdempotencyKey(
  org: string,
  project: string,
  repo: string,
  prId: number,
  commentId: number
): string {
  return `ado:${org}:${project}:${repo}:${prId}:${commentId}`;
}
