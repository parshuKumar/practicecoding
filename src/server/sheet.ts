import { prisma } from './db';
import type { Difficulty, PhaseView, SheetView, Stats } from '@/lib/types';

const EMPTY_DIFFICULTY: Stats['byDifficulty'] = {
  EASY: { total: 0, done: 0 },
  MEDIUM: { total: 0, done: 0 },
  HARD: { total: 0, done: 0 },
};

/**
 * The whole sheet with this user's progress merged in — 353 rows, one round trip.
 * Small enough that pagination or caching would be pure overhead.
 */
export async function getSheet(userId: string): Promise<SheetView> {
  const phases = await prisma.phase.findMany({
    orderBy: { id: 'asc' },
    include: {
      patterns: {
        orderBy: { id: 'asc' },
        include: {
          problems: {
            orderBy: { id: 'asc' },
            include: { users: { where: { userId } } },
          },
        },
      },
    },
  });

  const stats: Stats = {
    total: 0,
    done: 0,
    starred: 0,
    byDifficulty: structuredClone(EMPTY_DIFFICULTY),
  };

  const view: PhaseView[] = phases.map((phase) => ({
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
        const mine = problem.users[0];
        const done = mine?.done ?? false;
        const difficulty = problem.difficulty as Difficulty;

        stats.total += 1;
        stats.byDifficulty[difficulty].total += 1;
        if (done) {
          stats.done += 1;
          stats.byDifficulty[difficulty].done += 1;
        }
        if (mine?.starred) stats.starred += 1;

        return {
          id: problem.id,
          title: problem.title,
          lcNumber: problem.lcNumber,
          url: problem.url,
          difficulty,
          role: problem.role,
          hint: problem.hint,
          done,
          starred: mine?.starred ?? false,
          note: mine?.note ?? null,
        };
      }),
    })),
  }));

  return { phases: view, stats };
}

export async function countProblems(): Promise<number> {
  return prisma.problem.count();
}

export async function countDone(userId: string): Promise<number> {
  return prisma.userProblem.count({ where: { userId, done: true } });
}
