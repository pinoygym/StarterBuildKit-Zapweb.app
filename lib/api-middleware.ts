/**
 * API Middleware for Request Validation and Rate Limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { ValidationError } from './api-error';
import { logger } from './logger';

/**
 * Validate request body against Zod schema
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (req: NextRequest): Promise<T> => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);
      return validated;
    } catch (error: any) {
      logger.error('Request validation failed', error, { url: req.url });
      
      if (error.errors) {
        throw new ValidationError('Invalid request data', {
          errors: error.errors.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      throw new ValidationError('Invalid request format');
    }
  };
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based solution
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get existing requests for this identifier
    const requests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.maxRequests) {
      return true;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return false;
  }

  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Cleanup old entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  options?: { windowMs?: number; maxRequests?: number }
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    // Get identifier (IP address or user ID)
    const identifier = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    if (rateLimiter.isRateLimited(identifier)) {
      logger.warn('Rate limit exceeded', { identifier, url: req.url });
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        },
        { status: 429 }
      );
    }

    return handler(req, context);
  };
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (req: NextRequest, context?: any) => Promise<Response>
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    const response = await handler(req, context);
    
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  };
}

/**
 * Combine multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
