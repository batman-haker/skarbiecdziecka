/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per IP with sliding window.
 */

const rateMap = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateMap.entries()) {
    if (now > value.resetAt) {
      rateMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

export function rateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig
): { success: boolean; remaining: number } {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { success: true, remaining: config.maxRequests - 1 };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: config.maxRequests - entry.count };
}

// Pre-configured limiters for different endpoints
export const RATE_LIMITS = {
  // Treasury creation: max 3 per 10 minutes (expensive on-chain operation)
  createTreasury: { maxRequests: 3, windowMs: 10 * 60 * 1000 },
  // Withdrawal verification: max 5 per minute (brute-force protection)
  verifyWithdrawal: { maxRequests: 5, windowMs: 60 * 1000 },
  // Sync wallet: max 5 per minute
  syncWallet: { maxRequests: 5, windowMs: 60 * 1000 },
  // Read endpoints: max 30 per minute
  read: { maxRequests: 30, windowMs: 60 * 1000 },
} as const;

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
