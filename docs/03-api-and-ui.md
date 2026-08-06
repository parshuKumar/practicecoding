# 03 — API and UI

## API

Two endpoints. Everything requires a session except health.

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

### `GET /api/v1/health`

Public. `{ status, db }`. Useful when a deploy looks wrong.

**Reads have no endpoint** — Server Components call `getSheet(userId)` and `getStats(userId)`
directly. Adding a `GET /api/v1/sheet` nobody calls would be dead code.

## Screens

### `/` — landing

Logo, one line, one button: **Continue with Google**. Signed-in visitors redirect to `/sheet`.

### `/sheet` — the whole app

```
┌───────────────────────────────────────────────────────────────────────┐
│ ▣ DSA Sheet                                        you@gmail.com  [↩] │
├───────────────────────────────────────────────────────────────────────┤
│  ╭─────╮   47 / 353  solved                                   ╭─────╮ │
│  │ 13% │   Easy   ▰▰▰▰▰▰▱▱  26/38                             │  ★  │ │
│  │     │   Medium ▰▱▱▱▱▱▱▱  20/196                            │  12 │ │
│  ╰─────╯   Hard   ▱▱▱▱▱▱▱▱   1/119                            ╰─────╯ │
├───────────────────────────────────────────────────────────────────────┤
│ [All][★ Starred 12]  🔍 Search…      / │ All Easy Med Hard │ Hide done│
│                                                          🎲  ⤢  ⌨    │
├───────────────────────────────────────────────────────────────────────┤
│ ① FOUNDATION  Weeks 1-3                        ▰▰▰▰▱▱▱▱▱▱    40 / 96  │
│   ▾ 01  Arrays and Hashing            3-4 days   ▰▰▰▰▰▰▱▱     8 / 11  │
│     ☑ Two Sum 1              complement lookup  Warmup  E    ✎  ★     │
│     ☐ Contains Duplicate 217 hash set existence Warmup  E    ✎  ☆     │
│   ▸ 02  Two Pointers                             ▰▰▰▰▱▱▱▱     5 / 11  │
└───────────────────────────────────────────────────────────────────────┘
```

**Hero** — gradient ring with the percentage, an animated count that rolls to its new value, a
meter per difficulty, and the starred count. Recomputed client-side, so it moves the instant you
tick.

**Command bar** — sticky under the header. View switch, search, difficulty chips, hide-done, and
three icon actions: random unsolved, expand/collapse all, shortcuts.

**Starred is a tab, not a route.** It filters data already in the browser, so switching is
instant. `/starred` remains as a redirect for old bookmarks.

Making it a separate `force-dynamic` route was the original mistake: every click paid a session
lookup, a 353-row query and an RSC round trip to re-render data the page already had.

**Phase cards** — gradient number badge, title, timeline, progress bar. **Pattern cards** —
collapsible, code chip that turns green at 100%, bar, count. Collapsed state persists in
localStorage (a UI preference, not data — that one genuinely belongs there).

**Rows are single-line.** Checkbox · title + LC number · hint · role · difficulty letter ·
note · star. Hint and role hide on narrow screens rather than wrapping. Note and star fade in on
hover, stay visible when set.

- **Checkbox** → `PATCH { done }`, optimistic; animated check, strikethrough when done
- **Star** → `PATCH { starred }`, optimistic; pops on set
- **Note** → opens the dialog; icon turns cyan when a note exists

Rows are `memo`ised and untouched rows keep the same state object reference, so a tick
re-renders one row rather than 353.

### Note dialog

Title, link to LeetCode, monospace textarea, autosave on a 700 ms debounce plus a flush on
close. A dot shows unsaved / saved. `Esc` or `⌘↵` closes. Plain text, not markdown — a markdown
editor is its own project and needs no schema change to add later.

### Keyboard

| Key | Does |
| --- | --- |
| `/` | focus search |
| `j` `k` / `↓` `↑` | move between visible problems |
| `x` `s` `n` | toggle done · toggle star · open note |
| `r` | jump to a random unsolved problem |
| `e` | expand / collapse all patterns |
| `0` `1` `2` `3` | difficulty filter |
| `?` | shortcuts overlay |
| `Esc` | close, or clear search |

Navigation scrolls the row into view and opens its pattern if collapsed.

## Look and feel

Near-black blue-tinted surfaces with a fixed ambient gradient behind the page, glass cards with
an inner highlight, and a violet→cyan accent.

```css
@theme {
  --color-base: #08090d;   --color-surface: #0e1016;  --color-raised: #14171f;
  --color-line: #1e222c;   --color-hi: #f2f4f8;       --color-body: #b7bdcb;
  --color-dim: #6f7788;    --color-accent: #7c6cff;   --color-accent-2: #35d6f5;
  --color-easy: #34d399;   --color-medium: #fbbf24;   --color-hard: #fb7185;
}
```

Motion: check draw-on, star pop, count roll, bar and ring easing, toast spring, skeleton
shimmer. All of it disabled under `prefers-reduced-motion`.

## Feedback

Failed writes roll back and raise a toast. Toasts also confirm the random-problem jump. There is
no inline error bar — it shifted layout every time it appeared.

## Mobile

Rows keep their single line; hint and role badge drop out below `md`, the hero stacks, and the
note dialog becomes a bottom sheet.
