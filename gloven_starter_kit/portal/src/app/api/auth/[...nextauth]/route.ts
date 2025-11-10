/**
 * NextAuth API Route
 * Enterprise Maturity Pack v1 - Slice 1
 * 
 * Provides authentication with Prisma Adapter and development/production modes:
 * - Email magic links if SMTP configured
 * - Development credentials flow with one-time codes
 */

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '@/lib/db';

// Development credentials provider for one-time code flow
const developmentCredentialsProvider = CredentialsProvider({
  name: 'development',
  credentials: {
    email: { label: 'Email', type: 'email' },
    code: { label: 'One-Time Code', type: 'text' },
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.code) {
      return null;
    }

    // In development, we accept a fixed one-time code for simplicity
    // In a real implementation, this would validate against a stored code
    const validCode = process.env.NODE_ENV === 'development' ? '123456' : null;
    
    if (credentials.code !== validCode) {
      console.warn('Invalid one-time code attempt:', credentials.email);
      return null;
    }

    try {
      // Find or create user with FOUNDER role by default in development
      let user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: { role: true },
      });

      if (!user) {
        // Create new user with FOUNDER role
        const founderRole = await prisma.role.findUnique({
          where: { name: 'FOUNDER' },
        });

        if (!founderRole) {
          throw new Error('FOUNDER role not found in database');
        }

        user = await prisma.user.create({
          data: {
            email: credentials.email,
            name: credentials.email.split('@')[0],
            roleId: founderRole.id,
            emailVerified: new Date(),
          },
          include: { role: true },
        });
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        image: user.image,
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  },
});

// Email provider for production magic links
const emailProvider = EmailProvider({
  server: {
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  },
  from: process.env.EMAIL_FROM,
});

// Determine which providers to use based on environment
const providers = [];
if (process.env.EMAIL_SERVER_HOST) {
  // Production: Use email magic links
  providers.push(emailProvider);
} else {
  // Development: Use credentials with one-time code
  providers.push(developmentCredentialsProvider);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Add role to token on initial sign in
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session
      if (token) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };