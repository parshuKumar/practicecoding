# 01 — Architecture

One Next.js app on Vercel. No separate backend, no monorepo.

```
Browser
  ▼
Next.js 15 App Router (Vercel)
  ├── app/(app)/*                 Server Components — read data directly
  ├── app/api/auth/[...nextauth]  Auth.js — Google login
  └── app/api/v1/*                route handlers — the writes
        ▼
  src/server/*                    all the logic
        ▼
  Prisma → Neon Postgres
```

## Layout

```
dsa-sheet/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # landing + "Sign in with Google"
│   │   ├── (app)/layout.tsx                # signed-in shell: header, progress, sign out
│   │   ├── (app)/sheet/page.tsx            # the sheet (+ loading.tsx, error.tsx)
│   │   ├── starred/route.ts                # redirect — starred is a tab now
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   └── api/v1/
│   │       ├── problems/[id]/route.ts      # PATCH — done / starred / note
│   │       └── health/route.ts
│   │
│   ├── server/                             # no React, no next/* imports
│   │   ├── db.ts                           # Prisma client singleton
│   │   ├── auth.ts                         # Auth.js config + requireUser()
│   │   ├── handler.ts                      # withAuth wrapper, error → JSON
│   │   ├── sheet.ts                        # cached content + this user's rows
│   │   └── progress.ts                     # upsert done / starred / note
│   │
│   ├── components/
│   │   ├── icons.tsx                       # inline SVG set
│   │   └── sheet/{SheetClient,HeroProgress,CommandBar,PhaseCard,
│   │              PatternCard,ProblemRow,NoteDialog,Toast,ShortcutsOverlay}.tsx
│   └── lib/{types.ts,api.ts}
│
├── prisma/{schema.prisma,seed.ts}
├── data/sheet.json                         # generated once from the old HTML, committed
├── tools/{extract-sheet.ts,verify-import.ts}  # one-off parser + mapping check
├── legacy/{index.html,legacy-progress.json}   # frozen original + rescued ticks
└── docs/
```

Five files in `src/server/`. That's the entire backend.

## The three rules

1. **`src/server/*` never imports `next/*` or React.** Functions take plain arguments
   (`userId`, `problemId`) and return plain objects. This is what lets a Server Component and a
   route handler call the same function, and what makes them testable without a Next runtime.

2. **Route handlers stay thin** — auth, validate, call one function, return. If a handler grows
   past ~10 lines, the logic belongs in `src/server/`.

3. **Prisma only inside `src/server/`.** Never in a component, never in a route handler.

Worth adding `eslint-plugin-boundaries` for rule 1 and 3 — it's ten lines of config and it's
what stops the tidiness eroding in a month.

## The pattern, end to end

```ts
// src/server/progress.ts — plain function, no framework
export async function updateProblem(
  userId: string,
  problemId: number,
  patch: { done?: boolean; starred?: boolean; note?: string },
) {
  return prisma.userProblem.upsert({
    where:  { userId_problemId: { userId, problemId } },
    create: { userId, problemId, ...patch },
    update: patch,
  });
}
```

```ts
// src/app/api/v1/problems/[id]/route.ts — thin adapter
export const PATCH = withAuth(async (user, req, { params }) => {
  const patch = patchProblemSchema.parse(await req.json());
  return updateProblem(user.id, Number(params.id), patch);
});
```

`withAuth` is the only place that knows about `NextRequest`, sessions, and status codes — so
auth can't be forgotten by accident:

```ts
// src/server/handler.ts
export function withAuth<T>(fn: (user: User, req: NextRequest, ctx: Ctx) => Promise<T>) {
  return async (req: NextRequest, ctx: Ctx) => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    try {
      return NextResponse.json({ data: await fn(session.user, req, ctx) });
    } catch (err) {
      if (err instanceof ZodError) return NextResponse.json({ error: 'invalid', issues: err.issues }, { status: 400 });
      console.error(err);
      return NextResponse.json({ error: 'server_error' }, { status: 500 });
    }
  };
}
```

## Reads vs. writes

- **Reads** — Server Components call `getSheet(userId)` directly. No HTTP hop, no spinner, the
  sheet is there on first paint.
- **Writes** — ticking, starring, saving a note go to `/api/v1/problems/:id` from the client,
  applied optimistically and rolled back with a toast if the request fails.

Optimistic updates matter here: a checkbox that waits ~150 ms for the network feels broken.

`getSheet()` splits into two queries: sheet **content** (353 rows, changes only on re-seed) is
memoised in-process with a 10-minute TTL, and only the user's own `UserProblem` rows are fetched
per view. Before that split, every page view — including a tab switch — ran the full nested join.

## Stack

| | |
| --- | --- |
| Next.js 15 (App Router), React 19, TypeScript | |
| Tailwind v4 | dark theme via `@theme` CSS variables |
| zod | one schema for the one endpoint's body |
| Prisma 6 + `@prisma/adapter-neon` | |
| Auth.js v5 + `@auth/prisma-adapter` | Google only |
| Vitest | the parser — nothing else needs tests |

## Local dev

```bash
npm install
npm run db:migrate   # prisma migrate dev
npm run db:seed      # data/sheet.json → Postgres
npm run dev          # localhost:3000
```

Use a Neon **branch** for local work instead of Docker Postgres — free, instant, and identical
to production.
