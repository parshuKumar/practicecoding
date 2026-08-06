# DSA Sheet

353 problems across 35 patterns, with a login so progress follows you to any machine.

Tick problems done, ★ star the ones worth another pass, keep a note on each. Built as one
Next.js app on Vercel with Neon Postgres — free tier throughout.

Planning docs live in [docs/](docs/).

## Setup

### 1. Install

```bash
npm install
```

### 2. Neon

Create a project at [console.neon.tech](https://console.neon.tech), then copy both connection
strings:

- **Pooled** (host contains `-pooler`) → `DATABASE_URL`
- **Direct** (no `-pooler`) → `DIRECT_URL`

### 3. Google OAuth

[console.cloud.google.com](https://console.cloud.google.com) → new project →
**APIs & Services → OAuth consent screen** (External, add your own email as a test user) →
**Credentials → Create OAuth client ID → Web application**.

Authorised redirect URIs — add both:

```
http://localhost:3000/api/auth/callback/google
https://<your-project>.vercel.app/api/auth/callback/google
```

### 4. Environment

```bash
cp .env.example .env.local
```

Fill in the Neon URLs, the Google client id/secret, and:

```bash
openssl rand -base64 32     # -> AUTH_SECRET
```

### 5. Database

```bash
npx prisma migrate dev --name init    # create the schema
npm run db:seed                       # load the 353 problems
```

### 6. Run

```bash
npm run dev
```

Sign in at http://localhost:3000.

## Using it

| | |
| --- | --- |
| Tick a problem | click the checkbox, or `x` on the focused row |
| Star for revision | the star icon, or `s`. The **Starred** tab filters to them. |
| Write a note | the note icon, or `n`. Autosaves. |
| Move around | `j` / `k`, `/` to search, `r` for a random unsolved problem |
| Everything else | press `?` |

Starred is a tab, not a page — switching is instant client-side state, no network round trip.

## The legacy import

The original tracker kept ticks in `localStorage` keyed by row position
(`dsa-task-master-7` = the 8th checkbox), and `Problem.id` was seeded to be exactly that index.
Those 47 problems were imported once and the import UI has since been removed.

The inputs are kept for good: [`legacy/index.html`](legacy/index.html) (what each id means) and
[`legacy/legacy-progress.json`](legacy/legacy-progress.json) (the original ticks). Re-check the
mapping any time, without a database:

```bash
npx tsx tools/verify-import.ts
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Create/apply a migration locally |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Load `data/sheet.json` into Postgres — idempotent |
| `npm run db:studio` | Prisma Studio |
| `npm run extract` | Re-parse `legacy/index.html` → `data/sheet.json` (already done) |

## Layout

```
src/
├── app/                    routes — thin
│   ├── (app)/{sheet,starred,import}/
│   └── api/{auth,v1}/
├── server/                 all logic; imports no next/*, no React
│   ├── db.ts  auth.ts  handler.ts
│   └── sheet.ts  progress.ts  import.ts
├── components/             UI
└── lib/                    shared types + zod schemas

prisma/    schema + seed
data/      sheet.json — content source of truth
legacy/    the frozen original sheet + rescued ticks
tools/     one-off parser and the import verifier
```

Three rules keep it tidy: `src/server/` never imports `next/*` or React; route handlers stay
thin and delegate; Prisma is only touched inside `src/server/`.

## Deploying

Import the repo on Vercel (preset: Next.js), add the same env vars plus
`AUTH_URL=https://<project>.vercel.app` and `AUTH_TRUST_HOST=true`, then:

```bash
npm run db:deploy && npm run db:seed
```

Migrations run from your machine, not the build — see
[docs/06-deployment.md](docs/06-deployment.md).
