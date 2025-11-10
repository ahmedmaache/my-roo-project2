/**
 * Simple Authentication Utilities
 * 
 * Provides basic password protection for admin routes.
 * Edge-safe with minimal dependencies.
 */

/**
 * Check if admin password is configured
 */
export function isAuthEnabled(): boolean {
  return !!process.env.PORTAL_ADMIN_PASSWORD;
}

/**
 * Verify password against configured admin password
 */
export function verifyPassword(password: string): boolean {
  const adminPassword = process.env.PORTAL_ADMIN_PASSWORD;
  
  if (!adminPassword) {
    // If no password is set, allow access
    return true;
  }
  
  return password === adminPassword;
}

/**
 * Get authentication status from request headers
 * In a real implementation, this would check httpOnly cookies or session tokens
 */
export function isAuthenticated(authHeader?: string): boolean {
  if (!isAuthEnabled()) {
    // If auth is not enabled, everyone is authenticated
    return true;
  }
  
  if (!authHeader) {
    return false;
  }
  
  // Simple Basic Auth check
  // Format: "Basic base64(password)"
  const matches = authHeader.match(/^Basic (.+)$/);
  if (!matches) {
    return false;
  }
  
  try {
    const decoded = Buffer.from(matches[1], 'base64').toString();
    // For simplicity, we just expect the password (no username)
    return verifyPassword(decoded);
  } catch {
    return false;
  }
}

/**
 * Create Basic Auth header value
 */
export function createAuthHeader(password: string): string {
  const encoded = Buffer.from(password).toString('base64');
  return `Basic ${encoded}`;
}