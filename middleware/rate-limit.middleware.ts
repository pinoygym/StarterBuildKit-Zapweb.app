import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

/**
 * Rate limiting middleware
 * @param request - NextRequest object
 * @param options - Rate limit configuration
 * @param handler - Handler function to call if rate limit not exceeded
 */
export async function withRateLimit(
  request: NextRequest,
  options: RateLimitOptions,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get client identifier (IP address)
    const clientId = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    const now = Date.now();
    const limit = rateLimitMap.get(clientId);

    if (!limit || now > limit.resetTime) {
      // First request or window expired, create new limit
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      
      // Clean up old entries periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup
        cleanupRateLimitMap();
      }
      
      return await handler(request);
    }

    if (limit.count >= options.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Too many requests. Please try again later.',
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        }
      );
    }

    // Increment request count
    limit.count++;
    rateLimitMap.set(clientId, limit);

    return await handler(request);
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // If rate limiting fails, allow the request through
    return await handler(request);
  }
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitMap() {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitMap.delete(key));
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict limit for authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // Standard limit for API endpoints
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
  // Lenient limit for general requests
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },
};
