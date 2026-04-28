// Simple in-memory rate limiter (per Vercel instance)
// Đủ để chặn spam — không cần Redis cho scale nhỏ

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Dọn entries cũ mỗi 5 phút để không leak memory
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(
  ip: string,
  namespace: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}
