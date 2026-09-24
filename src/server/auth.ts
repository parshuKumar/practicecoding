import { cache } from 'react';
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT sessions: the signed cookie carries the user id, so no Session-table lookup is
  // needed on every page view and every PATCH. User and Account rows still live in Neon.
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  providers: [
    Google({
      // Without this, a browser already signed into one Google account reuses it
      // silently, which is confusing when you have a personal and a work account.
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  pages: { signIn: '/' },
  callbacks: {
    jwt({ token, user }) {
      // On sign-in `user` is the database row; pin its id into the token once.
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      // Load-bearing: without it session.user.id is undefined and every query
      // below has nothing to scope by.
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

export type SessionUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

/** Memoised per request, so the layout and the page share one cookie verification. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  return session?.user?.id ? (session.user as SessionUser) : null;
});
