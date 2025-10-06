interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  private getKey(request: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(request);
    }
    
    // Default: Use IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || 'unknown';
    
    // For API routes, include the path for more granular limiting
    const url = new URL(request.url);
    const path = url.pathname;
    
    return `${ip}:${path}`;
  }

  public isAllowed(request: Request): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(request);
    const now = Date.now();
    
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs
      };
      this.store.set(key, entry);
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }
    
    // Update existing entry
    entry.count++;
    
    if (entry.count > this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }
}

// Rate limiting configurations for different endpoints
export const rateLimiters = {
  // General API rate limit: 100 requests per minute
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwarded?.split(',')[0] || realIp || 'unknown';
      return `api:${ip}`;
    }
  }),
  
  // Authentication endpoints: 5 requests per minute
  auth: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwarded?.split(',')[0] || realIp || 'unknown';
      return `auth:${ip}`;
    }
  }),
  
  // Chat endpoints: 60 requests per minute
  chat: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwarded?.split(',')[0] || realIp || 'unknown';
      return `chat:${ip}`;
    }
  }),
  
  // Document upload: 10 requests per minute
  upload: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwarded?.split(',')[0] || realIp || 'unknown';
      return `upload:${ip}`;
    }
  })
};

// Middleware function to apply rate limiting
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (request: Request): Response | null => {
    const result = limiter.isAllowed(request);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          resetTime: result.resetTime
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    return null; // Let the request continue
  };
}

// Helper function to get the appropriate rate limiter for a request
export function getRateLimiterForPath(path: string): RateLimiter {
  if (path.startsWith('/api/auth/') || path.startsWith('/api/signin') || path.startsWith('/api/signup')) {
    return rateLimiters.auth;
  }
  
  if (path.startsWith('/api/chat/')) {
    return rateLimiters.chat;
  }
  
  if (path.startsWith('/api/documents/') && path.includes('/upload')) {
    return rateLimiters.upload;
  }
  
  // Default to general API rate limiter
  return rateLimiters.api;
}
