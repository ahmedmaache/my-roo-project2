/**
 * Prisma Client Loader
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Provides a singleton Prisma client instance with proper error handling
 * and development/production optimizations.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Export Prisma types for use throughout the application
export * from '@prisma/client';

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Safe database query with error handling
 */
export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error('Database query failed:', error);
    return fallback ?? null;
  }
}

/**
 * Database transaction wrapper
 */
export async function transaction<T>(
  operations: (tx: PrismaClient) => Promise<T>
): Promise<T | null> {
  try {
    return await prisma.$transaction(operations);
  } catch (error) {
    console.error('Database transaction failed:', error);
    return null;
  }
}