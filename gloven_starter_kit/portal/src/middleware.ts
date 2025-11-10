/**
 * Route Protection Middleware
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Protects routes based on user authentication and role-based access control.
 * Uses NextAuth for session management and RBAC for authorization.
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route configuration for role-based access
const routePermissions = {
  // Public routes (no authentication required)
  public: [
    '/',
    '/signin',
    '/faq',
    '/api/auth',
  ],
  
  // Authenticated routes (any logged-in user)
  authenticated: [
    '/dashboard',
    '/cohort',
    '/report',
  ],
  
  // Admin-only routes
  admin: [
    '/admin',
    '/api/admin',
    '/users',
  ],
  
  // Staff and above routes
  staff: [
    '/staff',
    '/api/staff',
  ],
  
  // Founder-specific routes
  founder: [
    '/my-startup',
    '/my-applications',
  ],
};

/**
 * Check if user has access to a specific path based on their role
 */
function hasPathAccess(path: string, userRole: string): boolean {
  // Public routes are accessible to everyone
  if (routePermissions.public.some(route => path.startsWith(route))) {
    return true;
  }

  // Check role-specific permissions
  switch (userRole) {
    case 'ADMIN':
      return true; // Admin has access to everything
    
    case 'STAFF':
      return (
        routePermissions.authenticated.some(route => path.startsWith(route)) ||
        routePermissions.staff.some(route => path.startsWith(route)) ||
        routePermissions.founder.some(route => path.startsWith(route))
      );
    
    case 'INVESTOR':
    case 'MENTOR':
      return routePermissions.authenticated.some(route => path.startsWith(route));
    
    case 'FOUNDER':
      return (
        routePermissions.authenticated.some(route => path.startsWith(route)) ||
        routePermissions.founder.some(route => path.startsWith(route))
      );
    
    default:
      return false;
  }
}

export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.nextauth?.token;
    
    // Redirect to signin if trying to access protected route without authentication
    if (!token && !routePermissions.public.some(route => pathname.startsWith(route))) {
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(signInUrl);
    }

    // Check role-based access for authenticated users
    if (token) {
      const userRole = token.role as string;
      
      // Redirect to dashboard if trying to access signin while already authenticated
      if (pathname.startsWith('/signin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Check if user has access to the requested path
      if (!hasPathAccess(pathname, userRole)) {
        // Redirect to unauthorized page or dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Public routes don't require authorization
        if (routePermissions.public.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // All other routes require authentication
        return !!token;
      },
    },
  }
);

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};