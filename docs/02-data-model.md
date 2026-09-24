# 02 — Data Model

Eleven tables: three from Auth.js, three for DSA content, one for DSA progress, three for
System Design content, one for System Design progress.

Content tables are seeded and identical forever. `UserProblem` and `SdUserArticle` are the
only tables the app writes to during normal use.

The System Design tables (`SdPart` → `SdGroup` → `SdArticle`, plus `SdUserArticle`) mirror
the DSA ones one-to-one, with two additions on the progress row: `readCount`, bumped by a
±1 delta inside a transaction and clamped at zero, and `lastReadAt`. `SdArticle.id` is the
curriculum number (1–140) and is never renumbered. `SdArticle.links` is a JSON array of
`{ label, url }`. Full definitions are in `prisma/schema.prisma`; the seed source is
`data/system-design.json`.

The original DSA-only schema follows.

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Neon pooled
  directUrl = env("DIRECT_URL")     // Neon direct, migrations only
}

// ───────────── Auth.js — shape fixed by @auth/prisma-adapter ─────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())

  accounts Account[]
  sessions Session[]
  problems UserProblem[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// ───────────────────────── Sheet content (seeded) ─────────────────────────

model Phase {
  id       Int    @id            // 1..4
  title    String                // "FOUNDATION"
  timeline String?               // "Weeks 1-3"

  patterns Pattern[]
}

model Pattern {
  id           Int    @id        // 1..35
  phaseId      Int
  code         String            // "01"
  title        String            // "Arrays and Hashing"
  difficulty   String?           // "FOUNDATION"
  timeEstimate String?           // "3-4 days"

  phase    Phase     @relation(fields: [phaseId], references: [id])
  problems Problem[]
}

/// One row of the sheet. 353 rows, ordered by `id`, which is the frozen DOM index
/// from the original index.html — the only bridge back to your localStorage ticks.
/// 35 problems appear twice under different patterns; they stay separate rows,
/// exactly as in the original sheet.
model Problem {
  id         Int        @id      // 0..352 — never renumber
  patternId  Int
  title      String              // "Two Sum"
  lcNumber   Int?                // 1
  url        String
  difficulty Difficulty          // EASY | MEDIUM | HARD
  role       Role                // WARMUP | CORE | STRETCH | CONTEST
  hint       String?             // "complement lookup"

  pattern Pattern       @relation(fields: [patternId], references: [id])
  users   UserProblem[]
}

// ─────────────────────────── Your data ───────────────────────────

model UserProblem {
  userId    String
  problemId Int
  done      Boolean  @default(false)
  starred   Boolean  @default(false)   // "revise this again"
  note      String?  @db.Text
  updatedAt DateTime @updatedAt

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  problem Problem @relation(fields: [problemId], references: [id])

  @@id([userId, problemId])
  @@index([userId, done])
  @@index([userId, starred])
}

enum Difficulty { EASY MEDIUM HARD }
enum Role       { WARMUP CORE STRETCH CONTEST }
```

## Why a few things are the way they are

**`Problem.id` is the legacy DOM index, not a cuid.** The old tracker keyed everything by
position: `dsa-task-master-7` meant "the 8th checkbox in the document". Making the primary key
*be* that index means the import is a straight lookup with nothing to map, and the ordering of
the sheet falls out of `ORDER BY id` for free.

Consequence: **never renumber.** If you add a problem later, give it id `1000+`, don't insert
it at 42.

**No rows for untouched problems.** No `UserProblem` row means not done, not starred, no note.
A fresh account has zero rows. The sheet query left-joins and defaults.

**Composite primary key `[userId, problemId]`.** Gives the upsert its target and makes double
-writes impossible. No separate id column needed.

**Duplicated problems stay as separate rows.** 35 of the 353 are repeats. Keeping them separate
means the sheet renders exactly like the original and the import is 1:1 with no ambiguity. The
UI can show a small "also in Pattern 06" tag if you want it later — one query, no schema change.

## The two queries the app runs

```ts
// The whole sheet with your progress — one round trip, ~353 rows.
const phases = await prisma.phase.findMany({
  orderBy: { id: 'asc' },
  include: {
    patterns: {
      orderBy: { id: 'asc' },
      include: {
        problems: {
          orderBy: { id: 'asc' },
          include: { users: { where: { userId } } },   // 0 or 1 row
        },
      },
    },
  },
});
```

```ts
// The counters for the header.
const [total, done, starred] = await Promise.all([
  prisma.problem.count(),
  prisma.userProblem.count({ where: { userId, done: true } }),
  prisma.userProblem.count({ where: { userId, starred: true } }),
]);

// Per-difficulty split — one grouped query.
const byDifficulty = await prisma.problem.groupBy({
  by: ['difficulty'],
  _count: true,
});
const doneByDifficulty = await prisma.userProblem.groupBy({
  by: ['problemId'],   // join through in the service, or use a raw query
  where: { userId, done: true },
});
```

For the difficulty split, one small raw query is clearer than fighting `groupBy` across a
relation:

```sql
SELECT p.difficulty,
       count(*)                                    AS total,
       count(*) FILTER (WHERE up.done)             AS done
FROM "Problem" p
LEFT JOIN "UserProblem" up ON up."problemId" = p.id AND up."userId" = $1
GROUP BY p.difficulty;
```

353 rows is small. There is no need for caching, pagination, or denormalised counters — and
adding them would be the kind of over-engineering this rewrite is avoiding.
