class MemoryCache {
  constructor() {
    this.items = new Map();
  }

  get(key) {
    const hit = this.items.get(key);
    if (!hit) return null;
    if (Date.now() > hit.expiresAt) {
      this.items.delete(key);
      return null;
    }
    return hit.value;
  }

  set(key, value, ttlMs) {
    this.items.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this.items.clear();
  }
}

module.exports = { MemoryCache };
