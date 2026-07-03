import { createClient } from 'redis';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type RedisClient = ReturnType<typeof createClient>;

const memoryCache = new Map<string, CacheEntry<unknown>>();
let redisClient: RedisClient | null = null;
let redisConnectPromise: Promise<RedisClient | null> | null = null;

async function getRedisClient(): Promise<RedisClient | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (redisClient?.isOpen) return redisClient;

  if (!redisConnectPromise) {
    redisConnectPromise = (async () => {
      try {
        const client = createClient({ url });
        client.on('error', () => {});
        await client.connect();
        redisClient = client;
        return client;
      } catch {
        redisConnectPromise = null;
        return null;
      }
    })();
  }

  return redisConnectPromise;
}

export function cacheKey(parts: string[]): string {
  return parts.join(':');
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // fallback to memory
    }
  }

  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {
      // fallback to memory
    }
  }

  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}
