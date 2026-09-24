import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { NotFoundError } from './handler';
import type { PatchProblem } from '@/lib/types';
import { approachesFor } from '@/lib/approaches';

/**
 * The tick, the star, the note and the approach set — any subset, in one upsert.
 * An empty string note is stored as null so "has a note" stays a simple null check.
 * Approaches are filtered to the ones this problem's pattern actually offers.
 */
export async function updateProblem(userId: string, problemId: number, patch: PatchProblem) {
  if (!Number.isInteger(problemId)) throw new NotFoundError(`problem ${problemId}`);

  // Only the approach set needs the pattern; everything else relies on the foreign key
  // to reject an unknown problem, which saves a round trip on every tick.
  let approaches: string[] | undefined;
  if (patch.approaches !== undefined) {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { patternId: true },
    });
    if (!problem) throw new NotFoundError(`problem ${problemId}`);
    const allowed = new Set(approachesFor(problem.patternId).map((a) => a.key));
    approaches = [...new Set(patch.approaches.filter((k) => allowed.has(k)))];
  }

  const data = {
    ...(patch.done !== undefined && { done: patch.done }),
    ...(patch.starred !== undefined && { starred: patch.starred }),
    ...(patch.note !== undefined && { note: patch.note?.trim() ? patch.note : null }),
    ...(approaches !== undefined && { approaches }),
  };

  const row = await prisma.userProblem
    .upsert({
      where: { userId_problemId: { userId, problemId } },
      create: { userId, problemId, ...data },
      update: data,
    })
    .catch((err: unknown) => {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
        throw new NotFoundError(`problem ${problemId}`);
      }
      throw err;
    });

  return {
    problemId: row.problemId,
    done: row.done,
    starred: row.starred,
    note: row.note,
    approaches: row.approaches,
    updatedAt: row.updatedAt,
  };
}
