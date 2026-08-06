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
│   │   ├── (app)/sheet/page.tsx            # the sheet
│   │   ├── (app)/starred/page.tsx          # same list, starred only
│   │   ├── (app)/import/page.tsx           # one-time legacy import
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   └── api/v1/
│   │       ├── problems/[id]/route.ts      # PATCH — done / starred / note
│   │       └── import/legacy/route.ts
│   │
│   ├── server/                             # no React, no next/* imports
│   │   ├── db.ts                           # Prisma client singleton
│   │   ├── auth.ts                         # Auth.js config + requireUser()
│   │   ├── handler.ts                      # withAuth wrapper, error → JSON
│   │   ├── sheet.ts                        # read the sheet + user progress + stats
│   │   ├── progress.ts                     # upsert done / starred / note
│   │   └── import.ts                       # legacy localStorage import
│   │
│   ├── components/
│   │   ├── sheet/{PhaseSection,PatternSection,ProblemRow,NotePopup}.tsx
│   │   ├── ProgressHeader.tsx
│   │   └── ui/                             # button, checkbox, dialog, badge
│   └── lib/{types.ts,api.ts,cn.ts}
│
├── prisma/{schema.prisma,seed.ts}
├── data/sheet.json                         # generated once from the old HTML, committed
├── tools/extract-sheet.ts                  # the one-off parser
├── legacy/index.html                       # frozen original, never edited again
└── docs/
```

Seven files in `src/server/`. That's the entire backend.

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
  problemId: string,
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
  return updateProblem(user.id, params.id, patch);
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
  through TanStack Query with an optimistic update.

Optimistic updates matter here: a checkbox that waits ~150 ms for the network feels broken.
Update the UI immediately, roll back if the request fails.

## Stack

| | |
| --- | --- |
| Next.js 15 (App Router), React 19, TypeScript | |
| Tailwind v4 | port the existing dark palette to CSS variables |
| TanStack Query v5 | optimistic ticks |
| zod | one schema for the one endpoint's body |
| Prisma 6 + `@prisma/adapter-neon` | |
| Auth.js v5 + `@auth/prisma-adapter` | Google only |
| Vitest | the parser and the import — nothing else needs tests |

## Local dev

```bash
pnpm install
pnpm db:migrate      # prisma migrate dev
pnpm db:seed         # data/sheet.json → Postgres
pnpm dev             # localhost:3000
```

Use a Neon **branch** for local work instead of Docker Postgres — free, instant, and identical
to production.
