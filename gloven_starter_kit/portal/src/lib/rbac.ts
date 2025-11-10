/**
 * RBAC Helpers
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Role-Based Access Control utilities for authorization checks
 * and permission management.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from './db';

// Role hierarchy (higher roles have more permissions)
export const ROLE_HIERARCHY = {
  ADMIN: 5,
  STAFF: 4,
  INVESTOR: 3,
  MENTOR: 2,
  FOUNDER: 1,
} as const;

export type RoleName = keyof typeof ROLE_HIERARCHY;

/**
 * Check if user has at least one of the required roles
 */
export function hasRequiredRole(userRole: string, requiredRoles: RoleName[]): boolean {
  if (!userRole) return false;
  
  const userRoleLevel = ROLE_HIERARCHY[userRole as RoleName];
  if (!userRoleLevel) return false;

  return requiredRoles.some(requiredRole => {
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole];
    return userRoleLevel >= requiredRoleLevel;
  });
}

/**
 * Server-side role requirement check
 * Throws an error if user doesn't have required role
 */
export async function requireRole(requiredRoles: RoleName[]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const userRole = session.user.role as string;
  
  if (!hasRequiredRole(userRole, requiredRoles)) {
    throw new Error(`Insufficient permissions. Required roles: ${requiredRoles.join(', ')}`);
  }

  return session;
}

/**
 * Check if user can perform action on resource
 */
export function can(
  action: string,
  resource: string,
  user: { role: string; id?: string },
  resourceOwnerId?: string
): boolean {
  const userRole = user.role as RoleName;
  
  // Admin can do everything
  if (userRole === 'ADMIN') {
    return true;
  }

  // Staff have broad access but not admin-level
  if (userRole === 'STAFF') {
    const staffRestrictedActions = ['delete', 'suspend'];
    const staffRestrictedResources = ['user', 'system'];
    
    if (staffRestrictedActions.includes(action) && staffRestrictedResources.includes(resource)) {
      return false;
    }
    return true;
  }

  // Role-specific permissions
  switch (userRole) {
    case 'INVESTOR':
      return canInvestor(action, resource);
    case 'MENTOR':
      return canMentor(action, resource);
    case 'FOUNDER':
      return canFounder(action, resource, user.id, resourceOwnerId);
    default:
      return false;
  }
}

/**
 * Investor-specific permissions
 */
function canInvestor(action: string, resource: string): boolean {
  const allowedActions = ['view', 'list'];
  const allowedResources = ['startup', 'cohort', 'application'];
  
  return allowedActions.includes(action) && allowedResources.includes(resource);
}

/**
 * Mentor-specific permissions
 */
function canMentor(action: string, resource: string): boolean {
  const allowedActions = ['view', 'list', 'edit', 'score'];
  const allowedResources = ['startup', 'cohort', 'application', 'score'];
  
  return allowedActions.includes(action) && allowedResources.includes(resource);
}

/**
 * Founder-specific permissions
 */
function canFounder(
  action: string,
  resource: string,
  userId?: string,
  resourceOwnerId?: string
): boolean {
  // Founders can only manage their own resources
  const isOwner = userId && resourceOwnerId && userId === resourceOwnerId;
  
  switch (resource) {
    case 'startup':
      return isOwner && ['view', 'edit'].includes(action);
    case 'application':
      return isOwner && ['view', 'edit', 'submit'].includes(action);
    case 'cohort':
      return ['view', 'list'].includes(action);
    default:
      return false;
  }
}

/**
 * Get user's accessible resources based on role
 */
export async function getAccessibleResources(user: { role: string; id?: string }) {
  const userRole = user.role as RoleName;
  
  switch (userRole) {
    case 'ADMIN':
      // Admin can access everything
      return {
        startups: await prisma.startup.findMany(),
        cohorts: await prisma.cohort.findMany(),
        applications: await prisma.application.findMany(),
        users: await prisma.user.findMany(),
      };
    
    case 'STAFF':
      // Staff can access most data
      return {
        startups: await prisma.startup.findMany(),
        cohorts: await prisma.cohort.findMany(),
        applications: await prisma.application.findMany(),
        users: await prisma.user.findMany({
          where: { role: { name: { not: 'ADMIN' } } },
        }),
      };
    
    case 'INVESTOR':
      // Investors can view startups and cohorts
      return {
        startups: await prisma.startup.findMany({
          include: {
            cohort: true,
            investorInterests: {
              where: { investor: { email: user.id } },
            },
          },
        }),
        cohorts: await prisma.cohort.findMany({
          where: { status: 'ACTIVE' },
        }),
      };
    
    case 'MENTOR':
      // Mentors can view active cohort data
      return {
        startups: await prisma.startup.findMany({
          include: { cohort: true },
        }),
        cohorts: await prisma.cohort.findMany({
          where: { status: 'ACTIVE' },
        }),
        applications: await prisma.application.findMany({
          include: { startup: true, cohort: true },
        }),
      };
    
    case 'FOUNDER':
      // Founders can only access their own data
      if (!user.id) return {};
      
      return {
        startups: await prisma.startup.findMany({
          where: { founders: { some: { id: user.id } } },
          include: { cohort: true },
        }),
        applications: await prisma.application.findMany({
          where: { startup: { founders: { some: { id: user.id } } } },
          include: { cohort: true, scores: true },
        }),
        cohorts: await prisma.cohort.findMany({
          where: { status: { in: ['UPCOMING', 'ACTIVE'] } },
        }),
      };
    
    default:
      return {};
  }
}

/**
 * Middleware-friendly role check
 */
export function createRoleCheck(requiredRoles: RoleName[]) {
  return (session: any) => {
    if (!session?.user) return false;
    return hasRequiredRole(session.user.role, requiredRoles);
  };
}