# 04 — Migration

Two migrations: your ticks out of `localStorage`, and the sheet content out of `index.html`.

## Step 0 — Rescue your ticks ✅ done

Already captured and committed to [`legacy/legacy-progress.json`](../legacy/legacy-progress.json).

**47 problems solved.** Verified against `index.html`: every index falls inside `0..352`, and
every one maps to a real row.

| | |
| --- | --- |
| Ticked | 47 |
| Easy / Medium / Hard | 26 / 20 / 1 |
| Patterns touched | 18 of 35 |
| First | `[0]` Two Sum → `[7]` Subarray Sum Equals K |
| Last | `[344]` Power of Two — Pattern 35, Math and Number Theory |

**47 is the number the import must report at the end.** Anything less means something broke.

If you later find another browser or laptop with ticks in it, run the snippet there, save it as
a second file, and import it too — the import merges and never double-counts.

<details>
<summary>The snippet, for reference</summary>

```js
copy(JSON.stringify(Object.fromEntries(
  Object.entries(localStorage).filter(([k]) => k.startsWith('dsa-task-master-'))
), null, 2))
```
</details>

## Why the index mapping is fragile

The old tracker keys progress by DOM position:

```js
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
checkboxes.forEach((cb, idx) => {
    const id = `dsa-task-master-${idx}`;
    cb.checked = localStorage.getItem(id) === 'true';
    ...
});
```

`dsa-task-master-7` means "the 8th checkbox in the document" and nothing more. Insert one row
near the top and every tick below it silently points at the wrong problem.

So: **freeze the file, then parse it.**

```bash
mkdir -p legacy && git mv index.html legacy/index.html
git commit -m "chore: freeze original sheet before rebuild"
```

`legacy/index.html` stays in the repo forever. It is the only record of what index `N` meant,
and it costs 141 KB.

## Step 1 — Parse the sheet into `data/sheet.json`

`tools/extract-sheet.ts`, run once. It walks the document in the same order
`querySelectorAll` does, so row *n* gets id *n*.

Per row it pulls:

| Field | From | Example |
| --- | --- | --- |
| `id` | position among `input[type=checkbox]` | `0` |
| `url` | `<a href>` | `https://leetcode.com/problems/two-sum/` |
| `title` | link text | `Two Sum (LC 1)` → `Two Sum` |
| `lcNumber` | `/\(LC (\d+)\)/` | `1` |
| `role` | `badge type-*` class | `type-warmup` → `WARMUP` |
| `hint` | cell text after the badge | `complement lookup` |
| `difficulty` | `badge diff-*` class | `diff-easy` → `EASY` |
| `patternCode` / `patternTitle` | enclosing `.pattern-title`, split on `—` | `01` / `Arrays and Hashing` |
| `patternDifficulty` / `timeEstimate` | `.pattern-meta`, split on `\|` | `FOUNDATION` / `3-4 days` |
| `phaseTitle` / `phaseTimeline` | enclosing `.phase-title` | `FOUNDATION` / `Weeks 1-3` |

### It must assert, then exit non-zero

These numbers are measured from the real file. If any assertion fails, the parse is wrong and
must not be seeded:

```ts
assert(problems.length === 353,           'expected 353 problems');
assert(phases.length === 4,               'expected 4 phases');
assert(patterns.length === 35,            'expected 35 patterns');
assert(uniqueUrls.size === 318,           'expected 318 unique LeetCode URLs');
assert(problems.every(p => p.url),        'every row must have a LeetCode URL');
assert(ids.join() === range(0, 353).join(), 'ids must be a dense 0..352 range');
assert(problems[0].title === 'Two Sum',   'row 0 must be Two Sum');
assert(problems[344].title === 'Power of Two', 'row 344 must be Power of Two');
```

The last two are cheap and they pin the mapping to values already confirmed against your real
progress data.

`data/sheet.json` is **committed**. After that it's the source of truth — editing the sheet
means editing the JSON, never re-running the parser.

## Step 2 — Seed Postgres

`prisma/seed.ts`, run with `pnpm db:seed`. Idempotent.

1. `Phase` — upsert on `id` (1–4)
2. `Pattern` — upsert on `id` (1–35)
3. `Problem` — upsert on `id` (0–352)

Rules:

- **Never delete a row.** It would cascade away progress.
- **Never renumber `Problem.id`.** Problems added later start at `1000`.

Run against a Neon branch first, check the counts, then production:

```sql
SELECT count(*) FROM "Problem";   -- 353
SELECT count(*) FROM "Pattern";   -- 35
SELECT count(*) FROM "Phase";     -- 4
```

Running the seed twice must leave those unchanged.

## Step 3 — Import your ticks

Sign in, go to `/import`, upload `legacy-progress.json`.

### `POST /api/v1/import/legacy`

```jsonc
{ "entries": { "dsa-task-master-0": "true", "dsa-task-master-11": "true" }, "dryRun": true }
```

Takes the rescued JSON verbatim — no hand-editing. Keys are parsed with
`^dsa-task-master-(\d+)$`; anything else, or an id outside `0..352`, is reported in `skipped`
rather than failing the whole request.

For each entry with value `"true"`:

```ts
prisma.userProblem.upsert({
  where:  { userId_problemId: { userId, problemId } },
  create: { userId, problemId, done: true },
  update: { done: true },        // never un-ticks, never touches starred or note
});
```

Entries with `"false"` are ignored — no row already means not done.

```jsonc
// expected result for your file
{ "data": { "matched": 47, "imported": 47, "alreadyDone": 0, "skipped": [] } }
```

`dryRun: true` returns the same report plus the matched problem titles, and writes nothing. The
page shows the dry run first and makes you confirm.

Idempotent by construction: the composite primary key `[userId, problemId]` plus an `update`
that only ever sets `done: true`. Run it ten times, same result.

### Check before confirming

The dry run lists titles. Verify these three:

- `[0]` → **Two Sum**
- `[11]` → **Valid Palindrome**
- `[344]` → **Power of Two**

If those are right, the whole mapping is right. If any is wrong, stop — re-run the parser
against `legacy/index.html` and check the assertions.

### If the numbers are off

| Symptom | Cause | Fix |
| --- | --- | --- |
| `matched` < 47 | a key was rejected | `skipped[]` names every one and why |
| Titles look wrong | parse order drifted from DOM order | re-run the parser, check the id assertions |
| Import reports 0 | wrong file, or already imported | check `alreadyDone` |

Nothing here deletes. If it goes wrong, delete that user's `UserProblem` rows and run again.

## Keep forever

- `legacy/index.html` — what each id means
- `legacy/legacy-progress.json` — your original 47 ticks
- `data/sheet.json` — the content source of truth

The `/import` page stays in the app. It costs nothing and it's the only way back in if you find
more ticks somewhere.
