/**
 * Rate Limit Helper
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * In-memory rate limiting with support for Redis in production.
 * Protects against brute force and denial-of-service attacks.
 */

// In-memory store for rate limiting (simple implementation)
// In production, this should be replaced with Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  max: number;         // Maximum number of requests per window
  message?: string;    // Error message
  headers?: boolean;   // Whether to include rate limit headers
}

/**
 * Default rate limit configuration
 */
const defaultConfig: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  headers: true,
};

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
}

/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const finalConfig: RateLimitConfig = { ...defaultConfig, ...config };

  return {
    /**
     * Check if a request is allowed
     */
    check: (identifier: string): RateLimitResult => {
      const now = Date.now();
      const key = `${identifier}:${finalConfig.windowMs}`;
      
      // Get current rate limit data
      const current = rateLimitStore.get(key);
      
      if (!current || now > current.resetTime) {
        // Reset or create new rate limit window
        const resetTime = now + finalConfig.windowMs;
        rateLimitStore.set(key, { count: 1, resetTime });
        
        return {
          success: true,
          limit: finalConfig.max,
          remaining: finalConfig.max - 1,
          resetTime,
        };
      }
      
      // Check if within limit
      if (current.count < finalConfig.max) {
        current.count++;
        rateLimitStore.set(key, current);
        
        return {
          success: true,
          limit: finalConfig.max,
          remaining: finalConfig.max - current.count,
          resetTime: current.resetTime,
        };
      }
      
      // Rate limit exceeded
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      return {
        success: false,
        limit: finalConfig.max,
        remaining: 0,
        resetTime: current.resetTime,
        retryAfter,
        message: finalConfig.message,
      };
    },

    /**
     * Get current rate limit status
     */
    getStatus: (identifier: string): RateLimitResult => {
      const now = Date.now();
      const key = `${identifier}:${finalConfig.windowMs}`;
      const current = rateLimitStore.get(key);
      
      if (!current || now > current.resetTime) {
        return {
          success: true,
          limit: finalConfig.max,
          remaining: finalConfig.max,
          resetTime: now + finalConfig.windowMs,
        };
      }
      
      return {
        success: current.count < finalConfig.max,
        limit: finalConfig.max,
        remaining: Math.max(0, finalConfig.max - current.count),
        resetTime: current.resetTime,
      };
    },

    /**
     * Reset rate limit for an identifier
     */
    reset: (identifier: string): void => {
      const key = `${identifier}:${finalConfig.windowMs}`;
      rateLimitStore.delete(key);
    },
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // General API rate limiting
  api: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  
  // Authentication rate limiting (more restrictive)
  auth: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }),
  
  // File upload rate limiting
  upload: createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }),
  
  // Public endpoints (more generous)
  public: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500 }),
};

/**
 * Rate limit middleware for Next.js API routes
 */
export function rateLimitMiddleware(
  limiter = rateLimiters.api,
  getIdentifier: (req: Request) => string = defaultIdentifier
) {
  return (req: Request) => {
    const identifier = getIdentifier(req);
    const result = limiter.check(identifier);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          message: result.message,
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...(result.retryAfter && {
              'Retry-After': result.retryAfter.toString(),
            }),
            ...getRateLimitHeaders(result),
          },
        }
      );
    }
    
    return result;
  };
}

/**
 * Default identifier function (uses IP address)
 */
function defaultIdentifier(req: Request): string {
  // In a real implementation, this would get the IP address
  // For now, use a combination of headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwarded || 'unknown';
  return ip.split(',')[0].trim(); // Take the first IP in case of multiple
}

/**
 * Generate rate limit headers
 */
function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimitStore(): number {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

/**
 * Get rate limit store statistics
 */
export function getRateLimitStats(): {
  totalEntries: number;
  activeWindows: number;
  expiredEntries: number;
} {
  const now = Date.now();
  let activeWindows = 0;
  let expiredEntries = 0;
  
  for (const value of rateLimitStore.values()) {
    if (now > value.resetTime) {
      expiredEntries++;
    } else {
      activeWindows++;
    }
  }
  
  return {
    totalEntries: rateLimitStore.size,
    activeWindows,
    expiredEntries,
  };
}

/**
 * Rate limit decorator for API routes
 */
export function withRateLimit(
  limiter = rateLimiters.api,
  getIdentifier = defaultIdentifier
) {
  return function(
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const req = args[0]; // Assuming first argument is the request
      
      if (req instanceof Request) {
        const identifier = getIdentifier(req);
        const result = limiter.check(identifier);
        
        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: result.message,
              retryAfter: result.retryAfter,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                ...getRateLimitHeaders(result),
              },
            }
          );
        }
      }
      
      return method.apply(this, args);
    };
    
    return descriptor;
  };
}

// Run cleanup every hour to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 60 * 60 * 1000); // 1 hour
}