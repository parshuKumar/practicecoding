# 06 — Deployment

One Vercel project, one Neon database, one Google OAuth client. Free tier throughout.

## Neon

1. [console.neon.tech](https://console.neon.tech) → new project. Pick the region closest to
   your Vercel region — a mismatch adds ~200 ms per query and is the usual reason an app
   "feels slow" for no visible reason.
2. Two connection strings from the dashboard:
   - **Pooled** (host contains `-pooler`) → `DATABASE_URL`, for runtime queries
   - **Direct** (no `-pooler`) → `DIRECT_URL`, for migrations only
3. `neonctl branches create --name dev` for local work. Branches are copy-on-write, free, and
   instant. Reset with `neonctl branches reset dev`.

Free tier: 0.5 GB storage, autosuspend after 5 min idle. Your data will be well under 1 MB.

### Prisma client

```ts
// src/server/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

const g = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  g.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon(new Pool({ connectionString: process.env.DATABASE_URL })),
  });

if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
```

The `globalThis` cache isn't optional — without it, Next's dev hot reload opens a new pool on
every file save until Neon refuses connections.

## Google OAuth setup

1. [console.cloud.google.com](https://console.cloud.google.com) → new project
2. **APIs & Services → OAuth consent screen** → External. Add your own email as a test user.
   Scopes: `userinfo.email`, `userinfo.profile`. No need to publish — test mode allows 100
   users and you are one.
3. **Credentials → Create OAuth client ID → Web application**
4. Authorised redirect URIs — add both, or login breaks in whichever one you forgot:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<project>.vercel.app/api/auth/callback/google`

Preview deployments get generated URLs that Google will reject. Don't bother registering them —
test login locally and on production.

### Auth.js config

```ts
// src/server/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 },
  providers: [Google({ authorization: { params: { prompt: 'select_account' } } })],
  pages: { signIn: '/' },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

The `session` callback is load-bearing — without it `session.user.id` is undefined and every
query has nothing to scope by.

`prompt: 'select_account'` saves confusion when a browser is signed into more than one Google
account.

## Vercel

Import the repo, preset **Next.js**, defaults otherwise.

```jsonc
// package.json
{
  "scripts": {
    "build":     "prisma generate && next build",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:deploy":  "prisma migrate deploy",
    "db:seed":    "tsx prisma/seed.ts"
  }
}
```

`prisma generate` in both places on purpose: Vercel caches `node_modules`, a cached install
skips `postinstall`, and you get a stale client and a baffling type error at build time.

**Migrations do not run in the build.** Run them yourself before pushing:

```
1. pnpm db:deploy     # apply migrations against DIRECT_URL
2. git push           # Vercel builds and deploys
3. pnpm db:seed       # only when content changed
```

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `DATABASE_URL` | all | Neon **pooled**, `?sslmode=require` |
| `DIRECT_URL` | all | Neon **direct**, migrations only |
| `AUTH_SECRET` | all | `openssl rand -base64 32`, different per environment |
| `AUTH_GOOGLE_ID` | all | |
| `AUTH_GOOGLE_SECRET` | all | |
| `AUTH_URL` | prod | `https://<project>.vercel.app` |
| `AUTH_TRUST_HOST` | all | `true` — required on Vercel |

Auth.js v5 reads `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` by name, so the provider needs no
config. The old `NEXTAUTH_*` names are v4 and are silently ignored — a genuinely annoying
half-hour if you hit it.

Point Preview and Development at the Neon `dev` branch. Never let a preview deploy write to
production data.

`.env.example` is committed with every key and no values. `.env.local` is gitignored.

## Runtime notes

- **Node runtime, not Edge.** Prisma and `@auth/prisma-adapter` need Node. Don't add
  `export const runtime = 'edge'` anywhere touching the database.
- Set the Vercel function region to match Neon's.
- Pages under `(app)/` are dynamic — they read a session. That's correct, not a problem to fix.

## Cost

Vercel Hobby + Neon Free + Google OAuth test mode = **₹0/month**, indefinitely, at this scale.

## Backup

Neon's free tier keeps 24 hours of point-in-time restore. That's thin for data you spent months
building. Once a month:

```bash
pg_dump "$DIRECT_URL" -Fc -f "backup-$(date +%F).dump"
```

Or simpler, and arguably better: a `/export` route that dumps your `UserProblem` rows as JSON —
same shape the import accepts, so a restore is just re-importing. Ten lines, and it means your
progress is never trapped in one database.
