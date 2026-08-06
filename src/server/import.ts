import { prisma } from './db';
import type { ImportReport } from '@/lib/types';

const KEY = /^dsa-task-master-(\d+)$/;

/**
 * Imports the original tracker's localStorage dump.
 *
 * The old sheet keyed progress by DOM position — "dsa-task-master-7" meant "the 8th
 * checkbox in the document". Problem.id was seeded to be exactly that index, so this
 * is a straight lookup with nothing to map.
 *
 * Idempotent: the composite key [userId, problemId] plus an update that only ever sets
 * done: true. Running it twice changes nothing, and it never clears a star or a note.
 */
export async function importLegacy(
  userId: string,
  entries: Record<string, string>,
  dryRun: boolean,
): Promise<ImportReport> {
  const skipped: ImportReport['skipped'] = [];
  const ids: number[] = [];

  for (const [key, value] of Object.entries(entries)) {
    const match = KEY.exec(key);
    if (!match) {
      skipped.push({ key, reason: 'unrecognised_key' });
      continue;
    }
    if (value !== 'true') {
      skipped.push({ key, reason: 'not_ticked' });
      continue;
    }
    ids.push(Number(match[1]));
  }

  const known = await prisma.problem.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true },
    orderBy: { id: 'asc' },
  });
  const knownIds = new Set(known.map((p) => p.id));

  for (const id of ids) {
    if (!knownIds.has(id)) {
      skipped.push({ key: `dsa-task-master-${id}`, reason: 'no_such_problem' });
    }
  }

  const matchedIds = known.map((p) => p.id);

  const already = await prisma.userProblem.count({
    where: { userId, problemId: { in: matchedIds }, done: true },
  });

  const report: ImportReport = {
    matched: matchedIds.length,
    imported: dryRun ? 0 : matchedIds.length - already,
    alreadyDone: already,
    skipped,
    preview: known.map((p) => ({ id: p.id, title: p.title })),
    dryRun,
  };

  if (dryRun) return report;

  const CHUNK = 25;
  for (let i = 0; i < matchedIds.length; i += CHUNK) {
    await prisma.$transaction(
      matchedIds.slice(i, i + CHUNK).map((problemId) =>
        prisma.userProblem.upsert({
          where: { userId_problemId: { userId, problemId } },
          create: { userId, problemId, done: true },
          update: { done: true },
        }),
      ),
    );
  }

  return report;
}
