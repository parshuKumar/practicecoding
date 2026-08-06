# 03 — API and UI

## API

Three endpoints. Everything requires a session except health.

### `PATCH /api/v1/problems/:id`

The only endpoint you'll use day to day. Handles the tick, the star, and the note — any subset,
in one call. Upserts, so it works whether or not a row exists yet.

```jsonc
{ "done": true }
{ "starred": true }
{ "note": "Hash map of complement → index. O(n)/O(n). Forgot the duplicate case." }
{ "done": true, "starred": true }          // valid — all fields optional
```

```jsonc
// response
{ "data": { "problemId": 0, "done": true, "starred": false, "note": null,
            "updatedAt": "2026-08-03T18:20:11.000Z" } }
```

```ts
// src/lib/types.ts — the one schema, shared by client and server
export const patchProblemSchema = z.object({
  done:    z.boolean().optional(),
  starred: z.boolean().optional(),
  note:    z.string().max(20_000).nullable().optional(),
}).refine(o => Object.keys(o).length > 0, 'empty patch');
```

### `POST /api/v1/import/legacy`

One-time localStorage import. Idempotent. See [04-migration.md](04-migration.md).

### `GET /api/v1/health`

Public. `{ status, db }`. Useful when a deploy looks wrong.

**Reads have no endpoint** — Server Components call `getSheet(userId)` and `getStats(userId)`
directly. Adding a `GET /api/v1/sheet` nobody calls would be dead code.

## Screens

### `/` — landing

Title, one line, one button: **Continue with Google**. Signed-in visitors redirect to `/sheet`.

### `/sheet` — the whole app

```
┌──────────────────────────────────────────────────────────────────────┐
│  DSA Sheet                                          ⬤ avatar ▾       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ╭───╮   231 / 353                                                 │
│    │65%│   ● Easy 93/152    ● Medium 108/186    ● Hard 30/136        │
│    ╰───╯                                                             │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│  [ All ] [ ⭐ Starred ]        🔍 search…      Difficulty ▾   ☑ Hide done │
├──────────────────────────────────────────────────────────────────────┤
│  ▾ PHASE 1 — FOUNDATION                    ▰▰▰▰▰▱▱▱▱▱     40 / 96    │
│                                                                      │
│    ▾ 01 — Arrays and Hashing               ▰▰▰▰▰▰▰▱▱▱      7 / 11    │
│      ☑  Two Sum (LC 1)              Warmup · complement lookup   📝 ⭐│
│      ☐  Contains Duplicate (LC 217) Warmup · hash set existence  ＋ ☆│
│      ☑  Valid Anagram (LC 242)      Core · frequency counting    ＋ ★│
│                                                                      │
│    ▸ 02 — Two Pointers                     ▰▰▰▱▱▱▱▱▱▱      3 / 10    │
└──────────────────────────────────────────────────────────────────────┘
```

**Header** — ring with `done / 353` and the percentage, plus the Easy/Medium/Hard split. Updates
live as you tick, from the same TanStack Query cache.

**Tabs** — `All` and `⭐ Starred`. Starred is the same list filtered to `starred: true`; that
*is* the revision feature.

**Filters** — search by title, difficulty dropdown, "hide done" checkbox. All client-side over
the 353 rows already in memory. Put them in the URL (`?q=tree&difficulty=HARD`) so a reload
keeps your place.

**Phase sections** — collapsible, with a bar and `40 / 96`. Collapsed state persists in
localStorage (a UI preference, not data — this one genuinely belongs there).

**Pattern sections** — collapsible, bar, count.

**Row** — checkbox, problem title linking to LeetCode (new tab), role + hint, difficulty badge,
note icon, star icon.

- **Checkbox** → `PATCH { done }`, optimistic, strikethrough + dimmed when done
- **Star** → `PATCH { starred }`, optimistic, filled amber when set
- **Note icon** → `＋` when empty, `📝` when a note exists. Opens the popup.

### Note popup

A dialog: problem title as the heading, a plain `<textarea>`, and a Save button. Autosave on a
800 ms debounce plus on close, with a small "Saved" indicator. Plain text, not markdown — a
markdown editor is a project of its own and you can add it later without touching the schema.

Escape closes. Deleting all the text and saving clears the note.

### `/starred`

Same components, `starred: true` only, grouped by pattern with the phase headers hidden when
empty. Empty state: "Star a problem to revise it later."

### `/import`

Three steps: upload or paste the JSON → dry run showing what would be imported with a preview
of matched titles → confirm. Detailed in [04-migration.md](04-migration.md).

Linked from the user menu, and a new account with zero progress lands here first.

## Look and feel

Keep the palette from `legacy/index.html` — it's good and it's familiar. Move it to CSS
variables in Tailwind v4:

```css
@theme {
  --color-bg:      #0d1117;
  --color-card:    #161b22;
  --color-border:  #30363d;
  --color-text:    #c9d1d9;
  --color-muted:   #8b949e;
  --color-accent:  #58a6ff;
  --color-easy:    #2ea043;
  --color-medium:  #d29922;
  --color-hard:    #f85149;
  --color-star:    #d29922;
}
```

Badges keep their existing colours: Warmup purple, Core blue, Stretch red, Contest orange.

## Mobile

The table doesn't survive a phone. Below `md`, each row becomes a two-line card: title and
difficulty on the first line, checkbox and star on the right, hint on the second line. The
progress header stacks. That's the whole responsive story.

## Nice to have later

Keyboard shortcuts (`/` search, `j`/`k` move, `x` tick, `s` star) and a "random unsolved
problem" button. Both are pure frontend, neither is v1.
