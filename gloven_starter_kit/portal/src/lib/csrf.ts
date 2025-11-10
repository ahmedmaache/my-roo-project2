/**
 * CSRF Protection Helper
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Implements CSRF token generation and validation to protect against
 * Cross-Site Request Forgery attacks.
 */

import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

// CSRF token configuration
const CSRF_SECRET = process.env.CSRF_SECRET || 'change-this-in-production';
const TOKEN_BYTES = 32;
const TOKEN_LIFETIME = 15 * 60 * 1000; // 15 minutes

/**
 * CSRF Token structure
 */
export interface CSRFToken {
  token: string;
  expires: number;
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): CSRFToken {
  const randomToken = randomBytes(TOKEN_BYTES).toString('hex');
  const expires = Date.now() + TOKEN_LIFETIME;
  
  // Create HMAC signature for the token
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${randomToken}:${expires}`);
  const signature = hmac.digest('hex');
  
  // Combine token, expiry, and signature
  const token = `${randomToken}:${expires}:${signature}`;
  
  return { token, expires };
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (!token) return false;
  
  try {
    const [randomToken, expiresStr, signature] = token.split(':');
    
    if (!randomToken || !expiresStr || !signature) {
      return false;
    }
    
    const expires = parseInt(expiresStr, 10);
    
    // Check if token has expired
    if (Date.now() > expires) {
      return false;
    }
    
    // Recreate HMAC signature for validation
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(`${randomToken}:${expires}`);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * CSRF protection middleware for API routes
 */
export function csrfProtection() {
  return {
    /**
     * Generate and set CSRF token in response
     */
    generate: (): string => {
      const { token } = generateCSRFToken();
      return token;
    },

    /**
     * Validate CSRF token from request
     */
    validate: (requestToken: string | null): boolean => {
      return validateCSRFToken(requestToken || '');
    },

    /**
     * Middleware for Express/Next.js API routes
     */
    middleware: (req: any, res: any, next: any) => {
      // Skip CSRF for GET, HEAD, OPTIONS requests
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
      }

      // Get token from header or body
      const token = 
        req.headers['x-csrf-token'] || 
        req.headers['xsrf-token'] ||
        req.body?._csrf;

      if (!validateCSRFToken(token)) {
        return res.status(403).json({
          error: 'Invalid CSRF token',
          code: 'INVALID_CSRF_TOKEN'
        });
      }

      next();
    }
  };
}

/**
 * Get CSRF token for use in forms
 */
export function getCSRFToken(): string {
  return generateCSRFToken().token;
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(token: string): { valid: boolean; reason?: string } {
  if (!token) {
    return { valid: false, reason: 'Token missing' };
  }

  if (!validateCSRFToken(token)) {
    return { valid: false, reason: 'Invalid or expired token' };
  }

  return { valid: true };
}

/**
 * CSRF token storage utilities for client-side
 */
export const csrfStorage = {
  /**
   * Store CSRF token in localStorage
   */
  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('csrf-token', token);
    }
  },

  /**
   * Get CSRF token from localStorage
   */
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('csrf-token');
    }
    return null;
  },

  /**
   * Remove CSRF token from localStorage
   */
  clearToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('csrf-token');
    }
  }
};

/**
 * Example: Add CSRF token to fetch requests
 */
export function withCSRF(headers: Record<string, string> = {}): Record<string, string> {
  const token = csrfStorage.getToken();
  return {
    ...headers,
    ...(token && { 'X-CSRF-Token': token })
  };
}