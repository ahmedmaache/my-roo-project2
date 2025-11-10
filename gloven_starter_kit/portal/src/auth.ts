/**
 * NextAuth Configuration Export
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Exports the auth configuration for use in server components and actions.
 */

import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import NextAuth from 'next-auth';

export const { 
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authOptions);