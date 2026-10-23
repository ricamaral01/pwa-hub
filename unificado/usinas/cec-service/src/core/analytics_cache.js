const { MemoryCache } = require('./cache');
const { log } = require('./logger');

class AnalyticsCache extends MemoryCache {
  constructor() {
    super();
    // Tracks key -> Set of affected month-year keys (e.g., '2026-07')
    this.keyMetadata = new Map();
  }

  set(key, value, ttlMs, affectedMonths = []) {
    super.set(key, value, ttlMs);
    this.keyMetadata.set(key, new Set(affectedMonths));
  }

  invalidateForMonth(anoMes) {
    const keysToDelete = [];
    for (const [key, months] of this.keyMetadata.entries()) {
      // Invalidate if the query explicitly matches the updated month OR is a global query (size === 0)
      if (months.size === 0 || months.has(anoMes)) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      log('INFO', 'cache_invalidation_triggered', {
        updated_month: anoMes,
        invalidated_keys_count: keysToDelete.length,
        keys: keysToDelete
      });
    }

    keysToDelete.forEach(key => {
      this.items.delete(key);
      this.keyMetadata.delete(key);
    });
  }

  clear() {
    super.clear();
    this.keyMetadata.clear();
  }
}

const analyticsCache = new AnalyticsCache();
module.exports = { analyticsCache };
