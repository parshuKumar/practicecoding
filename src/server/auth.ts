import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 },
  providers: [
    Google({
      // Without this, a browser already signed into one Google account reuses it
      // silently, which is confusing when you have a personal and a work account.
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: { signIn: '/' },
  callbacks: {
    session({ session, user }) {
      // Load-bearing: without it session.user.id is undefined and every query
      // below has nothing to scope by.
      session.user.id = user.id;
      return session;
    },
  },
});

export type SessionUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

export async function getUser(): Promise<SessionUser | null> {
  const session = await auth();
  return session?.user?.id ? (session.user as SessionUser) : null;
}
