import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private isConnected = false;

  constructor() {
    const redisHost = process.env.REDIS_HOST || '10.20.110.117';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
    const redisPassword = process.env.REDIS_PASSWORD || undefined;

    try {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: (times) => {
          if (times > 3) return null; // Stop retrying quickly to avoid log spam
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      this.redis.connect()
        .then(() => {
          this.isConnected = true;
          console.log(`Connected to Redis at ${redisHost}:${redisPort}`);
        })
        .catch((err) => {
          console.warn(`Redis connection skipped (${err.message}). Using in-memory cache.`);
          this.isConnected = false;
        });

      this.redis.on('error', () => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.redis) {
      try {
        const raw = await this.redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryCache.get(key);
    if (item) {
      if (item.expiresAt > Date.now()) {
        return item.value as T;
      }
      this.memoryCache.delete(key);
    }
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 30): Promise<void> {
    if (this.isConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export const cacheService = new CacheService();
