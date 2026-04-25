// In-memory rate limiter — sufficient for landing page volumes (<10k leads/month).
// Each entry: { count, resetAt }. Cleaned up on every check to avoid memory leaks.

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

const WINDOW_MS  = 60 * 60 * 1000; // 1 hour
const MAX_HITS   = 5;               // max submissions per IP per window

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Purge expired entries to keep memory bounded
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }

  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= MAX_HITS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
