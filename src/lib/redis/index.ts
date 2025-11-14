import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/env";

// Initialize Redis client
export const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiters
export const ratelimit = redis
  ? {
      // API rate limit: 100 requests per minute
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        analytics: true,
        prefix: "@ratelimit/api",
      }),

      // Auth rate limit: 5 login attempts per minute
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "@ratelimit/auth",
      }),

      // Strict rate limit: 10 requests per minute (for sensitive operations)
      strict: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"),
        analytics: true,
        prefix: "@ratelimit/strict",
      }),
    }
  : null;

// Cache helpers
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  if (!redis) {
    return fetcher();
  }

  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}

export async function invalidateCache(pattern: string) {
  if (!redis) return;

  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
