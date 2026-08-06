# DSA Sheet — Rebuild Plan

Turn the single-file `index.html` tracker into a small web app with a login, so your progress
follows you to any machine — without losing the ticks you already have.

**Stack:** one Next.js 15 app · Prisma · Neon Postgres · Auth.js (Google) · Vercel. Free tier
throughout.

## What it does

- Sign in with Google
- The full sheet: 4 phases → 35 patterns → 353 problems
- Tick a problem done → saved to the database, visible on any device
- ⭐ Star a problem = "revise this again". A tab (client-side, instant) filters to starred.
- A note per problem
- `231 / 353` at the top, plus Easy / Medium / Hard split and a bar per pattern

That is the whole app. Single user, no sharing, no scheduling, no analytics.

## Current sheet (measured from the file)

| | |
| --- | --- |
| Source | one `index.html`, 1056 lines, 141 KB |
| Phases | 4 |
| Patterns | 35 |
| Problems | **353** (35 are repeats of a problem listed under another pattern — kept as separate rows, same as today) |
| Storage | `localStorage["dsa-task-master-<idx>"] = "true"`, idx = DOM order `0..352` |

## Docs

| Doc | What's in it |
| --- | --- |
| [01-architecture.md](01-architecture.md) | Folder layout and the few rules that keep it tidy |
| [02-data-model.md](02-data-model.md) | The Prisma schema — 7 tables total |
| [03-api-and-ui.md](03-api-and-ui.md) | The endpoints and the screens |
| [04-migration.md](04-migration.md) | How the sheet was parsed and the 47 old ticks were brought across (done) |
| [05-roadmap.md](05-roadmap.md) | 6 milestones, ~16 hours |
| [06-deployment.md](06-deployment.md) | Neon, Vercel, Google OAuth setup, env vars |

## Decisions, briefly

| Choice | Why |
| --- | --- |
| One Next.js app, no separate backend | One deploy, one set of env vars, no cross-origin cookie problems |
| Auth.js with database sessions | `auth()` works anywhere, no token plumbing, sessions revocable |
| Prisma + Neon | Free Postgres, real migrations, `@auth/prisma-adapter` is one line |
| Star = boolean, not spaced repetition | You wanted a star. A star is a boolean. |
| 353 rows, duplicates kept | Matches the original sheet exactly, so the import is 1:1 |
| Progress rows created lazily | No row means not done. A fresh account has zero rows, not 353. |

## Status

Built and deployed. The 47 legacy ticks were imported and the import UI removed; the source
files stay in [`legacy/`](../legacy/) as the permanent record.
