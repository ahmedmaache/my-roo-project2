/**
 * Security Headers Middleware
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Implements strict security headers for the Gloven portal:
 * - Content Security Policy (CSP)
 * - X-Frame-Options
 * - Referrer-Policy
 * - X-Content-Type-Options
 * - Permissions-Policy
 * - Strict-Transport-Security (HSTS)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Content Security Policy configuration
 * Strict by default, can be modified for specific needs
 */
const csp = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Next.js in development
    "'unsafe-eval'",   // Required for Next.js in development
    "https://vercel.live", // Vercel preview deployments
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS and inline styles
    "https://fonts.googleapis.com",
  ],
  'font-src': [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  'img-src': [
    "'self'",
    "data:",
    "blob:",
    "https:",
  ],
  'connect-src': [
    "'self'",
    "https://*.googleapis.com",
    "https://*.vercel.app",
    "ws://localhost:3000", // WebSocket for development
  ],
  'frame-src': [
    "'self'",
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'block-all-mixed-content': [],
  'upgrade-insecure-requests': [],
};

/**
 * Convert CSP object to header string
 */
function generateCSPHeader(): string {
  return Object.entries(csp)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
  ].join(', '),
  
  // Force HTTPS (1 year for production)
  'Strict-Transport-Security': 
    process.env.NODE_ENV === 'production' 
      ? 'max-age=31536000; includeSubDomains; preload'
      : 'max-age=0',
  
  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent DNS prefetching
  'X-DNS-Prefetch-Control': 'off',
};

/**
 * Security headers middleware
 * Applies security headers to all responses
 */
export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Remove unnecessary headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}

/**
 * Apply security headers to a specific response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([header, value]) => {
    response.headers.set(header, value);
  });
  
  // Remove unnecessary headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}

/**
 * Get security headers as an object (for use in next.config.js)
 */
export function getSecurityHeaders(): Record<string, string> {
  return securityHeaders;
}

/**
 * Development-specific CSP relaxation
 * Allows more flexible policies during development
 */
export function getDevelopmentCSP(): string {
  if (process.env.NODE_ENV !== 'development') {
    return generateCSPHeader();
  }
  
  const devCsp = {
    ...csp,
    'script-src': [
      ...csp['script-src'],
      "'unsafe-inline'",
      "'unsafe-eval'",
      "http://localhost:3000",
    ],
    'connect-src': [
      ...csp['connect-src'],
      "ws://localhost:3000",
      "http://localhost:3000",
    ],
  };
  
  return Object.entries(devCsp)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}