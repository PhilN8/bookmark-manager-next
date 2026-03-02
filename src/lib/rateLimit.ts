// Simple in-memory rate limiter for auth endpoints
// For production, consider using Redis-based rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000);

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  let entry = store[key];
  
  if (!entry || entry.resetTime < now) {
    // New window
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store[key] = entry;
  }
  
  entry.count++;
  
  const remaining = Math.max(0, config.maxRequests - entry.count);
  
  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitIdentifier(request: Request): string {
  // Use IP address and email combination for auth endpoints
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}
