// src/lib/cache/queryCache.ts

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Simple in-memory cache for query results
 * Reusable across all KPI endpoints
 */
class QueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(ttlHours: number = 12) {
    this.defaultTTL = ttlHours * 60 * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached data if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Check if expired
    if (age > this.defaultTTL) {
      this.cache.delete(key);
      console.log('🗑️ [Cache] Expired:', { key, age: `${Math.round(age / 1000)}s` });
      return null;
    }

    console.log('✅ [Cache] Hit:', { key, age: `${Math.round(age / 1000)}s` });
    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    console.log('💾 [Cache] Set:', { key, size: this.cache.size });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log('🧹 [Cache] Cleared:', { entriesRemoved: size });
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log('🧹 [Cache] Cleared expired:', { removed, remaining: this.cache.size });
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      ttlHours: this.defaultTTL / (60 * 60 * 1000)
    };
  }
}

// Singleton instance with 12h TTL
export const queryCache = new QueryCache(12);

/**
 * Wrapper function to cache async operations
 * Reusable for any KPI query
 */
export async function withCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  console.log('⏳ [Cache] Miss, fetching:', cacheKey);
  const data = await fetchFn();

  // Store in cache
  queryCache.set(cacheKey, data);

  return data;
}
