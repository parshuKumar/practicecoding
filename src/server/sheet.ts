import { prisma } from './db';
import type { Difficulty, PhaseView, ProblemLink, ProblemView, SheetView, Stats } from '@/lib/types';
import { approachesFor } from '@/lib/approaches';
import neetcodeJs from '../../data/neetcode-js.json';
import gfgLinks from '../../data/gfg-links.json';

const NEETCODE: Record<string, string> = neetcodeJs;
const GFG: Record<string, string> = gfgLinks;

/**
 * Where to read solutions for a problem. GeeksforGeeks article URLs were resolved once
 * per problem and live in data/gfg-links.json; a problem without one simply has no GfG
 * link. NeetCode has a JS solution for about 150 of them, and algo.monster walks through
 * the idea for every number.
 */
function solutionLinks(lcNumber: number | null): ProblemLink[] {
  const links: ProblemLink[] = [];
  if (lcNumber !== null) {
    const gfg = GFG[String(lcNumber)];
    if (gfg) links.push({ label: 'GeeksforGeeks article', url: gfg });
    const file = NEETCODE[String(lcNumber)];
    if (file) {
      links.push({ label: 'NeetCode solution (JS)', url: `https://github.com/neetcode-gh/leetcode/blob/main/javascript/${file}` });
    }
    links.push({ label: 'algo.monster walkthrough', url: `https://algo.monster/liteproblems/${lcNumber}` });
  }
  return links;
}

/**
 * Sheet content — the 353 problems, their patterns and phases — only changes when
 * the seed runs. Fetching it on every request meant a 353-row nested join per page
 * view; memoising it here turns the hot path into one small indexed lookup of the
 * user's own rows.
 *
 * Per-process and TTL'd rather than a shared cache: a stale read costs nothing worse
 * than a briefly outdated title, and it needs no infrastructure.
 */
const CONTENT_TTL_MS = 10 * 60 * 1000;

type Content = {
  phases: {
    id: number;
    title: string;
    timeline: string | null;
    patterns: {
      id: number;
      code: string;
      title: string;
      difficulty: string | null;
      timeEstimate: string | null;
      problems: Omit<ProblemView, 'done' | 'starred' | 'note' | 'approaches'>[];
    }[];
  }[];
  total: number;
  byDifficulty: Record<Difficulty, number>;
};

let cache: { value: Content; at: number } | null = null;

async function loadContent(): Promise<Content> {
  const phases = await prisma.phase.findMany({
    orderBy: { id: 'asc' },
    include: {
      patterns: {
        orderBy: { id: 'asc' },
        include: { problems: { orderBy: { id: 'asc' } } },
      },
    },
  });

  const byDifficulty: Record<Difficulty, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  let total = 0;

  const mapped = phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    timeline: phase.timeline,
    patterns: phase.patterns.map((pattern) => ({
      id: pattern.id,
      code: pattern.code,
      title: pattern.title,
      difficulty: pattern.difficulty,
      timeEstimate: pattern.timeEstimate,
      problems: pattern.problems.map((problem) => {
        const difficulty = problem.difficulty as Difficulty;
        total += 1;
        byDifficulty[difficulty] += 1;
        return {
          id: problem.id,
          title: problem.title,
          lcNumber: problem.lcNumber,
          url: problem.url,
          difficulty,
          role: problem.role,
          hint: problem.hint,
          links: solutionLinks(problem.lcNumber),
          approachOptions: approachesFor(pattern.id),
        };
      }),
    })),
  }));

  return { phases: mapped, total, byDifficulty };
}

async function getContent(): Promise<Content> {
  if (cache && Date.now() - cache.at < CONTENT_TTL_MS) return cache.value;
  const value = await loadContent();
  cache = { value, at: Date.now() };
  return value;
}

/**
 * Fire-and-forget: the other sheet's page calls this so that switching tabs never pays
 * the content join. A failure here is harmless; the real request will simply load it.
 */
export function warmSheetContent(): void {
  void getContent().catch(() => {});
}

export async function getSheet(userId: string): Promise<SheetView> {
  // Content is usually memoised; only this second query actually hits Neon per view,
  // and it returns just the rows this user has touched.
  const [content, rows] = await Promise.all([
    getContent(),
    prisma.userProblem.findMany({
      where: { userId },
      select: { problemId: true, done: true, starred: true, note: true, approaches: true },
    }),
  ]);

  const mine = new Map(rows.map((r) => [r.problemId, r]));

  const stats: Stats = {
    total: content.total,
    done: 0,
    starred: 0,
    byDifficulty: {
      EASY: { total: content.byDifficulty.EASY, done: 0 },
      MEDIUM: { total: content.byDifficulty.MEDIUM, done: 0 },
      HARD: { total: content.byDifficulty.HARD, done: 0 },
    },
  };

  const phases: PhaseView[] = content.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    timeline: phase.timeline,
    patterns: phase.patterns.map((pattern) => ({
      id: pattern.id,
      code: pattern.code,
      title: pattern.title,
      difficulty: pattern.difficulty,
      timeEstimate: pattern.timeEstimate,
      problems: pattern.problems.map((problem) => {
        const row = mine.get(problem.id);
        if (row?.done) {
          stats.done += 1;
          stats.byDifficulty[problem.difficulty].done += 1;
        }
        if (row?.starred) stats.starred += 1;

        return {
          ...problem,
          done: row?.done ?? false,
          starred: row?.starred ?? false,
          note: row?.note ?? null,
          approaches: row?.approaches ?? [],
        };
      }),
    })),
  }));

  return { phases, stats };
}
