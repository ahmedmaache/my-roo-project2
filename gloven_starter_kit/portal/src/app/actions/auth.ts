/**
 * Auth Server Actions
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Server actions for authentication operations.
 */

'use server';

import { signOut as nextAuthSignOut } from '@/auth';

export async function signOut() {
  await nextAuthSignOut({ redirectTo: '/signin' });
}