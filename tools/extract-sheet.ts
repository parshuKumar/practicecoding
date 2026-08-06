/**
 * One-off parser: legacy/index.html -> data/sheet.json
 *
 * Walks the document in the SAME order the original tracker's
 * `document.querySelectorAll('input[type="checkbox"]')` did, so problem N here is
 * exactly what `localStorage["dsa-task-master-N"]` referred to.
 *
 * That mapping is the only bridge back to years of ticks, so this file asserts
 * hard and exits non-zero rather than emitting something plausible-but-wrong.
 *
 *   npm run extract
 */
import { load } from 'cheerio';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'legacy/index.html');
const OUT = resolve(root, 'data/sheet.json');

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Role = 'WARMUP' | 'CORE' | 'STRETCH' | 'CONTEST';

export type SheetProblem = {
  id: number;
  patternId: number;
  title: string;
  lcNumber: number | null;
  url: string;
  difficulty: Difficulty;
  role: Role;
  hint: string | null;
};

export type SheetPattern = {
  id: number;
  phaseId: number;
  code: string;
  title: string;
  difficulty: string | null;
  timeEstimate: string | null;
};

export type SheetPhase = {
  id: number;
  title: string;
  timeline: string | null;
};

export type Sheet = {
  phases: SheetPhase[];
  patterns: SheetPattern[];
  problems: SheetProblem[];
};

const DIFFICULTY: Record<string, Difficulty> = {
  'diff-easy': 'EASY',
  'diff-medium': 'MEDIUM',
  'diff-hard': 'HARD',
};

const ROLE: Record<string, Role> = {
  'type-warmup': 'WARMUP',
  'type-core': 'CORE',
  'type-stretch': 'STRETCH',
  'type-contest': 'CONTEST',
};

function badgeClass(cls: string | undefined, prefix: string): string {
  const found = (cls ?? '').split(/\s+/).find((c) => c.startsWith(prefix));
  if (!found) throw new Error(`no "${prefix}*" class in "${cls}"`);
  return found;
}

/** "PHASE 1 — FOUNDATION (Weeks 1-3)" -> { title, timeline } */
function parsePhase(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim();
  const m = text.match(/^PHASE\s+(\d+)\s*[—-]\s*(.+?)\s*(?:\(([^)]*)\))?$/i);
  if (!m) throw new Error(`unparseable phase title: "${text}"`);
  return { order: Number(m[1]), title: m[2].trim(), timeline: m[3]?.trim() ?? null };
}

/** "Pattern 01 — Arrays and Hashing" -> { code, title } */
function parsePattern(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim();
  const m = text.match(/^Pattern\s+(\d+)\s*[—-]\s*(.+)$/i);
  if (!m) throw new Error(`unparseable pattern title: "${text}"`);
  return { code: m[1], title: m[2].trim() };
}

/** "Difficulty: FOUNDATION | Time: 3-4 days" -> { difficulty, timeEstimate } */
function parseMeta(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim();
  const difficulty = text.match(/Difficulty:\s*([^|]+)/i)?.[1]?.trim() ?? null;
  const timeEstimate = text.match(/Time:\s*(.+)$/i)?.[1]?.trim() ?? null;
  return { difficulty, timeEstimate };
}

/** "Two Sum (LC 1)" -> { title: "Two Sum", lcNumber: 1 } */
function parseTitle(raw: string) {
  const text = raw.replace(/\s+/g, ' ').trim();
  const m = text.match(/^(.*?)\s*\(LC\s*(\d+)\)\s*$/i);
  if (m) return { title: m[1].trim(), lcNumber: Number(m[2]) };
  return { title: text, lcNumber: null };
}

function extract(): Sheet {
  const $ = load(readFileSync(SOURCE, 'utf8'));

  const phases: SheetPhase[] = [];
  const patterns: SheetPattern[] = [];
  const problems: SheetProblem[] = [];

  $('.phase-section').each((_, phaseEl) => {
    const rawPhase = $(phaseEl).find('.phase-title').first().text();
    const { title, timeline } = parsePhase(rawPhase);
    const phaseId = phases.length + 1;
    phases.push({ id: phaseId, title, timeline });

    $(phaseEl)
      .find('.pattern-container')
      .each((__, patternEl) => {
        const { code, title: patternTitle } = parsePattern(
          $(patternEl).find('.pattern-title').first().text(),
        );
        const { difficulty, timeEstimate } = parseMeta(
          $(patternEl).find('.pattern-meta').first().text(),
        );
        const patternId = patterns.length + 1;
        patterns.push({ id: patternId, phaseId, code, title: patternTitle, difficulty, timeEstimate });

        $(patternEl)
          .find('tbody tr')
          .each((___, rowEl) => {
            const cells = $(rowEl).children('td');
            if (cells.length < 4) throw new Error(`row with ${cells.length} cells in pattern ${code}`);
            if (cells.eq(0).find('input[type="checkbox"]').length !== 1) {
              throw new Error(`row without a checkbox in pattern ${code}`);
            }

            const link = cells.eq(1).find('a').first();
            const url = link.attr('href');
            if (!url) throw new Error(`row without a URL in pattern ${code}`);

            const { title: problemTitle, lcNumber } = parseTitle(link.text());

            const typeCell = cells.eq(2);
            const roleKey = badgeClass(typeCell.find('span.badge').first().attr('class'), 'type-');
            const role = ROLE[roleKey];
            if (!role) throw new Error(`unknown role class "${roleKey}"`);

            const hint = typeCell.clone().children('span.badge').remove().end().text().replace(/\s+/g, ' ').trim();

            const diffKey = badgeClass(cells.eq(3).find('span.badge').first().attr('class'), 'diff-');
            const difficultyValue = DIFFICULTY[diffKey];
            if (!difficultyValue) throw new Error(`unknown difficulty class "${diffKey}"`);

            problems.push({
              id: problems.length, // == the legacy localStorage index
              patternId,
              title: problemTitle,
              lcNumber,
              url,
              difficulty: difficultyValue,
              role,
              hint: hint || null,
            });
          });
      });
  });

  return { phases, patterns, problems };
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(`\n  ✖ ${message}\n`);
    process.exit(1);
  }
}

function verify(sheet: Sheet) {
  const { phases, patterns, problems } = sheet;

  assert(phases.length === 4, `expected 4 phases, got ${phases.length}`);
  assert(patterns.length === 35, `expected 35 patterns, got ${patterns.length}`);
  assert(problems.length === 353, `expected 353 problems, got ${problems.length}`);

  const uniqueUrls = new Set(problems.map((p) => p.url));
  assert(uniqueUrls.size === 318, `expected 318 unique URLs, got ${uniqueUrls.size}`);

  assert(
    problems.every((p) => /^https?:\/\/.+/.test(p.url)),
    'every problem must have an absolute URL',
  );

  const ids = problems.map((p) => p.id);
  assert(
    ids.every((id, i) => id === i),
    'problem ids must be a dense 0..352 range in document order',
  );

  // Pinned against the real localStorage data in legacy/legacy-progress.json.
  // If either of these moves, every imported tick would land on the wrong problem.
  assert(problems[0].title === 'Two Sum', `id 0 must be "Two Sum", got "${problems[0].title}"`);
  assert(
    problems[11].title === 'Valid Palindrome',
    `id 11 must be "Valid Palindrome", got "${problems[11].title}"`,
  );
  assert(
    problems[344].title === 'Power of Two',
    `id 344 must be "Power of Two", got "${problems[344].title}"`,
  );

  assert(
    patterns.every((p) => problems.some((q) => q.patternId === p.id)),
    'every pattern must contain at least one problem',
  );
}

function main() {
  const sheet = extract();
  verify(sheet);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(sheet, null, 2)}\n`);

  const byDifficulty = sheet.problems.reduce<Record<string, number>>((acc, p) => {
    acc[p.difficulty] = (acc[p.difficulty] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`✔ ${OUT.replace(`${root}/`, '')}`);
  console.log(`  ${sheet.phases.length} phases · ${sheet.patterns.length} patterns · ${sheet.problems.length} problems`);
  console.log(`  easy ${byDifficulty.EASY} · medium ${byDifficulty.MEDIUM} · hard ${byDifficulty.HARD}`);
  console.log(`  ids 0..${sheet.problems.length - 1} verified against the legacy localStorage mapping`);
}

main();
