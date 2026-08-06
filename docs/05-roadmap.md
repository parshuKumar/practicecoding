# 05 — Roadmap

Six milestones, roughly 16 hours. Evening-sized chunks, each one shippable.

---

## M0 — Rescue and freeze ✅ done · ~15 min left

- [x] Ticks captured → [`legacy/legacy-progress.json`](../legacy/legacy-progress.json), 47 solved
- [x] Verified: every index maps to a real row, `[0]` = Two Sum, `[344]` = Power of Two
- [ ] `git mv index.html legacy/index.html` and commit

**Done when:** `index.html` no longer sits at the repo root and both legacy files are committed.

---

## M1 — Scaffold · ~1.5 h

`create-next-app` with TypeScript, Tailwind v4, App Router. Port the palette from
`legacy/index.html` into `@theme` variables. Folder skeleton from
[01-architecture.md](01-architecture.md). Prettier, ESLint, `.env.example`.

**Done when:** `pnpm dev` serves a dark page with the right colours.

Optional but worth the ten minutes: `eslint-plugin-boundaries` banning `next/*` imports inside
`src/server/` and Prisma imports outside it. Rules nobody enforces stop being true.

---

## M2 — Database and seed · ~3 h

Neon project + a `dev` branch. `prisma/schema.prisma` from
[02-data-model.md](02-data-model.md). First migration. `tools/extract-sheet.ts` with all eight
assertions. `data/sheet.json` generated and committed. `prisma/seed.ts`.

**Done when:**

```sql
SELECT count(*) FROM "Problem";  -- 353
SELECT count(*) FROM "Pattern";  -- 35
SELECT count(*) FROM "Phase";    -- 4
```

and a second `pnpm db:seed` changes nothing.

---

## M3 — Login · ~2 h

Google Cloud OAuth client ([06-deployment.md](06-deployment.md#google-oauth-setup)). Auth.js
config, the `[...nextauth]` route, `requireUser()`, `withAuth`, middleware redirect, landing
page with the sign-in button, avatar menu with sign out.

**Done when:** you sign in with Google, `/sheet` bounces you to `/` when signed out, and a
`User` + `Session` row exist in Neon.

---

## M4 — The sheet and ticking · ~5 h

The big one.

- `getSheet(userId)` and `getStats(userId)` in `src/server/sheet.ts`
- `/sheet` as a Server Component
- Phase and pattern sections, collapsible, with bars and counts
- Problem rows: checkbox, LeetCode link, badges
- Progress header: ring, `x / 353`, Easy/Medium/Hard split
- `PATCH /api/v1/problems/:id` + optimistic updates with rollback

**Done when:** all 353 problems render grouped correctly, ticking updates instantly, survives a
hard refresh, and shows up on your phone.

Test the failure path deliberately: DevTools → offline, tick a box, confirm it rolls back
instead of showing a lie.

---

## M5 — Import · ~1.5 h · **the one that brings your 47 back**

~~`src/server/import.ts`, `POST /api/v1/import/legacy` with `dryRun`, and the `/import` page:~~ **Done, then removed once the 47 were in.**

Was:
upload → dry run with matched titles → confirm.

**Done when:** the report says `imported: 47`, the header reads `47 / 353`, the three spot-check
titles in [04-migration.md](04-migration.md#check-before-confirming) are correct, and a second
run reports `imported: 0`.

---

## M6 — Stars, notes, polish · ~3 h

- Star icon on every row → `PATCH { starred }`
- `/starred` tab
- Note popup: textarea, debounced autosave, `＋` / `📝` indicator
- Search box, difficulty filter, "hide done" — client-side, mirrored into the URL
- Empty states, mobile card layout, error boundary
- Deploy to Vercel

**Done when:** you've used it as your daily driver for a week without opening
`legacy/index.html`.

---

## Order

```
M0 → M1 → M2 → M3 → M4 → M5 → M6
```

Straight line. M5 could come after M6, but do it first — seeing your 47 in the new app is what
makes it feel real.

## Tests worth writing

Three, and no more:

- `tools/extract-sheet.ts` — the eight assertions plus a snapshot of `data/sheet.json`.
  Protects the one irreplaceable mapping.
- ~~`src/server/import.ts`~~ — feature removed after the one-time import; `tools/verify-import.ts`
  still re-checks the mapping against `data/sheet.json`.
- One Playwright path: sign in → tick → refresh → still ticked.

Skip component tests, mocked-Prisma tests, and endpoint tests for an app with two endpoints.
