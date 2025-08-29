export class RateLimiter {
  private buckets = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? [];

    // Remove old entries outside the window
    const valid = bucket.filter((timestamp) => now - timestamp < this.windowMs);

    if (valid.length >= this.maxRequests) {
      this.buckets.set(key, valid);
      return false;
    }

    valid.push(now);
    this.buckets.set(key, valid);
    return true;
  }

  /**
   * Clean up old buckets periodically to prevent memory leaks
   * Call this method periodically in a background task
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.buckets) {
      const valid = timestamps.filter((timestamp) =>
        now - timestamp < this.windowMs
      );
      if (valid.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, valid);
      }
    }
  }

  /**
   * Get the number of remaining requests for a key
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? [];
    const valid = bucket.filter((timestamp) => now - timestamp < this.windowMs);
    return Math.max(0, this.maxRequests - valid.length);
  }

  /**
   * Get reset time for a key (when the window resets)
   */
  getResetTime(key: string): number {
    const bucket = this.buckets.get(key) ?? [];
    if (bucket.length === 0) return Date.now();

    const oldest = Math.min(...bucket);
    return oldest + this.windowMs;
  }

  /**
   * Clear all rate limiting data for a key
   */
  clearKey(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * Clear all rate limiting data
   */
  clear(): void {
    this.buckets.clear();
  }

  /**
   * Get current bucket count (for monitoring)
   */
  getBucketCount(): number {
    return this.buckets.size;
  }
}
