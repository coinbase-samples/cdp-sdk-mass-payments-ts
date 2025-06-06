class SwapCache {
  private cache: Map<string, any> = new Map();

  // Get swap data by key
  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  // Set swap data with key
  set(key: string, data: any): void {
    this.cache.set(key, data);
  }

  // Check if key exists in cache
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Delete specific entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
  }

  // Get all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get all cached swap data
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.cache.entries()) {
      result[key] = value;
    }
    return result;
  }
}

// Create singleton instance
const swapCache = new SwapCache();

export { SwapCache, swapCache };
