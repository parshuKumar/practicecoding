import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { NotFoundError } from './handler';
import type { PatchArticle } from '@/lib/types';

/**
 * Tick, star, note and the read counter — any subset, in one upsert.
 *
 * The counter is applied as a delta inside a transaction so two quick clicks from two
 * tabs both land, and it is clamped at zero so a stray "-" can never go negative.
 */
export async function updateArticle(userId: string, articleId: number, patch: PatchArticle) {
  if (!Number.isInteger(articleId)) throw new NotFoundError(`article ${articleId}`);

  // An unknown article is rejected by the foreign key on upsert; no separate lookup.
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.sdUserArticle.findUnique({
      where: { userId_articleId: { userId, articleId } },
      select: { readCount: true },
    });

    const delta = patch.readDelta ?? 0;
    const readCount = Math.max(0, (current?.readCount ?? 0) + delta);

    const data = {
      ...(patch.done !== undefined && { done: patch.done }),
      ...(patch.starred !== undefined && { starred: patch.starred }),
      ...(patch.note !== undefined && { note: patch.note?.trim() ? patch.note : null }),
      ...(delta !== 0 && { readCount }),
      ...(delta > 0 && { lastReadAt: new Date() }),
    };

    return tx.sdUserArticle.upsert({
      where: { userId_articleId: { userId, articleId } },
      create: { userId, articleId, ...data },
      update: data,
    });
  }).catch((err: unknown) => {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      throw new NotFoundError(`article ${articleId}`);
    }
    throw err;
  });

  return {
    articleId: row.articleId,
    done: row.done,
    starred: row.starred,
    readCount: row.readCount,
    note: row.note,
    lastReadAt: row.lastReadAt,
    updatedAt: row.updatedAt,
  };
}
