const cache = new Map<string, { data: any; timestamp: number }>();
const DEFAULT_TTL = 30_000;

export function withCache<T>(key: string, fn: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return Promise.resolve(cached.data);
  }
  return fn().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  });
}

export function invalidateCache(keyPattern?: string) {
  if (keyPattern) {
    for (const key of cache.keys()) {
      if (key.startsWith(keyPattern)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
