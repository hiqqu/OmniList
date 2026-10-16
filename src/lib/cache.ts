interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global singleton cache for server-side Next.js route handlers
const globalForCache = globalThis as unknown as { searchCache?: MemoryCache };

export const searchCache = globalForCache.searchCache ?? new MemoryCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.searchCache = searchCache;
}
