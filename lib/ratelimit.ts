type RateLimitEntry = {
  timestamps: number[];
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

export type RateLimiter = {
  check: (key: string, nowMs?: number) => RateLimitResult;
  reset: () => void;
};

export function createSlidingWindowRateLimiter(limit: number, windowMs: number): RateLimiter {
  const store = new Map<string, RateLimitEntry>();

  const check = (key: string, nowMs = Date.now()): RateLimitResult => {
    const safeKey = key || "unknown";
    const entry = store.get(safeKey) ?? { timestamps: [] };
    const windowStart = nowMs - windowMs;

    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= limit) {
      const oldestInWindow = entry.timestamps[0];
      const retryAfterMs = Math.max(0, windowMs - (nowMs - oldestInWindow));
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      store.set(safeKey, entry);
      return {
        allowed: false,
        retryAfterSeconds,
        remaining: 0,
      };
    }

    entry.timestamps.push(nowMs);
    store.set(safeKey, entry);

    return {
      allowed: true,
      retryAfterSeconds: 0,
      remaining: Math.max(0, limit - entry.timestamps.length),
    };
  };

  return {
    check,
    reset: () => {
      store.clear();
    },
  };
}
