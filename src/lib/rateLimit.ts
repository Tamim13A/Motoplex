/**
 * Motoplex High-Security Rate Limiter
 * In-memory sliding window rate limiter to protect authentication endpoints
 * against brute-force, dictionary, and credential-stuffing attacks.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  keyPrefix: string;
  maxAttempts: number;
  windowMs: number; // e.g. 15 minutes = 15 * 60 * 1000
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {
    keyPrefix: "login",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${options.keyPrefix}:${identifier.toLowerCase()}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    return {
      allowed: true,
      remaining: options.maxAttempts,
      retryAfterSeconds: 0,
    };
  }

  if (record.count >= options.maxAttempts) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  return {
    allowed: true,
    remaining: options.maxAttempts - record.count,
    retryAfterSeconds: 0,
  };
}

export function recordFailedAttempt(
  identifier: string,
  options: RateLimitOptions = {
    keyPrefix: "login",
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
  }
): { remaining: number; locked: boolean } {
  const now = Date.now();
  const key = `${options.keyPrefix}:${identifier.toLowerCase()}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { remaining: options.maxAttempts - 1, locked: false };
  }

  record.count += 1;
  const locked = record.count >= options.maxAttempts;
  const remaining = Math.max(0, options.maxAttempts - record.count);

  return { remaining, locked };
}

export function clearRateLimit(identifier: string, keyPrefix: string = "login"): void {
  const key = `${keyPrefix}:${identifier.toLowerCase()}`;
  rateLimitStore.delete(key);
}

