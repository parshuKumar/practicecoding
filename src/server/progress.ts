import { prisma } from './db';
import { NotFoundError } from './handler';
import type { PatchProblem } from '@/lib/types';

/**
 * The tick, the star and the note — any subset, in one upsert.
 * An empty string note is stored as null so "has a note" stays a simple null check.
 */
export async function updateProblem(userId: string, problemId: number, patch: PatchProblem) {
  if (!Number.isInteger(problemId)) throw new NotFoundError(`problem ${problemId}`);

  const exists = await prisma.problem.findUnique({ where: { id: problemId }, select: { id: true } });
  if (!exists) throw new NotFoundError(`problem ${problemId}`);

  const data = {
    ...(patch.done !== undefined && { done: patch.done }),
    ...(patch.starred !== undefined && { starred: patch.starred }),
    ...(patch.note !== undefined && { note: patch.note?.trim() ? patch.note : null }),
  };

  const row = await prisma.userProblem.upsert({
    where: { userId_problemId: { userId, problemId } },
    create: { userId, problemId, ...data },
    update: data,
  });

  return {
    problemId: row.problemId,
    done: row.done,
    starred: row.starred,
    note: row.note,
    updatedAt: row.updatedAt,
  };
}
