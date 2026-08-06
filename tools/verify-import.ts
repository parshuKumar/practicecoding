/**
 * Dry-runs the legacy import against data/sheet.json without touching a database.
 * Confirms every rescued localStorage key maps to a real problem before you ever
 * point this at Neon.
 *
 *   npx tsx tools/verify-import.ts
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Sheet } from './extract-sheet';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = /^dsa-task-master-(\d+)$/;

const sheet: Sheet = JSON.parse(readFileSync(resolve(root, 'data/sheet.json'), 'utf8'));
const entries: Record<string, string> = JSON.parse(
  readFileSync(resolve(root, 'legacy/legacy-progress.json'), 'utf8'),
);

const byId = new Map(sheet.problems.map((p) => [p.id, p]));
const patternById = new Map(sheet.patterns.map((p) => [p.id, p]));

const matched: typeof sheet.problems = [];
const skipped: { key: string; reason: string }[] = [];

for (const [key, value] of Object.entries(entries)) {
  const m = KEY.exec(key);
  if (!m) {
    skipped.push({ key, reason: 'unrecognised_key' });
    continue;
  }
  if (value !== 'true') {
    skipped.push({ key, reason: 'not_ticked' });
    continue;
  }
  const problem = byId.get(Number(m[1]));
  if (!problem) {
    skipped.push({ key, reason: 'no_such_problem' });
    continue;
  }
  matched.push(problem);
}

matched.sort((a, b) => a.id - b.id);

const byDifficulty = matched.reduce<Record<string, number>>((acc, p) => {
  acc[p.difficulty] = (acc[p.difficulty] ?? 0) + 1;
  return acc;
}, {});

console.log(`matched  ${matched.length}`);
console.log(`skipped  ${skipped.length}`);
console.log(`easy ${byDifficulty.EASY ?? 0} · medium ${byDifficulty.MEDIUM ?? 0} · hard ${byDifficulty.HARD ?? 0}\n`);

for (const p of matched) {
  const pattern = patternById.get(p.patternId)!;
  console.log(`  ${String(p.id).padStart(3)}  ${p.title.padEnd(38)} ${pattern.code} — ${pattern.title}`);
}

if (skipped.length) {
  console.log('\nskipped:');
  for (const s of skipped) console.log(`  ${s.key} — ${s.reason}`);
}

const expected = Object.values(entries).filter((v) => v === 'true').length;
if (matched.length !== expected) {
  console.error(`\n✖ expected ${expected} matches, got ${matched.length}`);
  process.exit(1);
}
console.log(`\n✔ all ${expected} ticked problems map to real rows`);
