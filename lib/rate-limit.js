import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map();

export function rateLimit(limit = 10, windowMs = 60000) {
  return (req) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (rateLimitMap.has(ip)) {
      const requests = rateLimitMap.get(ip).filter(time => time > windowStart);
      rateLimitMap.set(ip, requests);
    }
    
    // Check current requests
    const requests = rateLimitMap.get(ip) || [];
    
    if (requests.length >= limit) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
    
    // Add current request
    requests.push(now);
    rateLimitMap.set(ip, requests);
    
    return null;
  };
}

// AI-specific rate limiting
export const aiRateLimit = rateLimit(5, 60000); // 5 requests per minute for AI operations
export const generalRateLimit = rateLimit(100, 60000); // 100 requests per minute for general operations
