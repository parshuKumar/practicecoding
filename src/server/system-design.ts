import { prisma } from './db';
import type {
  ArticleLink,
  ArticleView,
  PartView,
  SdImportance,
  SdKind,
  SdStats,
  SystemDesignView,
} from '@/lib/types';
import { SD_KIND_ORDER } from '@/lib/types';
import curriculum from '../../data/system-design.json';

/**
 * Same shape of trick as sheet.ts: curriculum content only changes when the seed runs,
 * so it is memoised per process and only the user's own rows are fetched per view.
 */
const CONTENT_TTL_MS = 10 * 60 * 1000;

type ArticleContent = Omit<ArticleView, 'done' | 'starred' | 'readCount' | 'note'>;

type Content = {
  parts: {
    id: number;
    title: string;
    subtitle: string | null;
    groups: { id: number; code: string; title: string; articles: ArticleContent[] }[];
  }[];
  total: number;
  must: number;
  byKind: Record<SdKind, number>;
};

let cache: { value: Content; at: number } | null = null;

function emptyByKind<T>(make: () => T): Record<SdKind, T> {
  return Object.fromEntries(SD_KIND_ORDER.map((k) => [k, make()])) as Record<SdKind, T>;
}

async function loadContent(): Promise<Content> {
  const parts = await prisma.sdPart.findMany({
    orderBy: { id: 'asc' },
    include: {
      groups: {
        orderBy: { id: 'asc' },
        include: { articles: { orderBy: { id: 'asc' } } },
      },
    },
  });

  const byKind = emptyByKind(() => 0);
  let total = 0;
  let must = 0;

  const mapped = parts.map((part) => ({
    id: part.id,
    title: part.title,
    subtitle: part.subtitle,
    groups: part.groups.map((group) => ({
      id: group.id,
      code: group.code,
      title: group.title,
      articles: group.articles.map((article) => {
        const kind = article.kind as SdKind;
        const importance = article.importance as SdImportance;
        total += 1;
        byKind[kind] += 1;
        if (importance === 'MUST') must += 1;
        return {
          id: article.id,
          code: article.code,
          title: article.title,
          url: article.url,
          kind,
          importance,
          summary: article.summary,
          links: (Array.isArray(article.links) ? article.links : []) as ArticleLink[],
        };
      }),
    })),
  }));

  return { parts: mapped, total, must, byKind };
}

async function getContent(): Promise<Content> {
  if (cache && Date.now() - cache.at < CONTENT_TTL_MS) return cache.value;
  const value = await loadContent();
  cache = { value, at: Date.now() };
  return value;
}

export async function getSystemDesign(userId: string): Promise<SystemDesignView> {
  const [content, rows] = await Promise.all([
    getContent(),
    prisma.sdUserArticle.findMany({
      where: { userId },
      select: { articleId: true, done: true, starred: true, readCount: true, note: true },
    }),
  ]);

  const mine = new Map(rows.map((r) => [r.articleId, r]));

  const stats: SdStats = {
    total: content.total,
    done: 0,
    starred: 0,
    reads: 0,
    must: { total: content.must, done: 0 },
    byKind: emptyByKind(() => ({ total: 0, done: 0 })),
  };
  for (const kind of SD_KIND_ORDER) stats.byKind[kind].total = content.byKind[kind];

  const parts: PartView[] = content.parts.map((part) => ({
    id: part.id,
    title: part.title,
    subtitle: part.subtitle,
    groups: part.groups.map((group) => ({
      id: group.id,
      code: group.code,
      title: group.title,
      articles: group.articles.map((article) => {
        const row = mine.get(article.id);
        if (row?.done) {
          stats.done += 1;
          stats.byKind[article.kind].done += 1;
          if (article.importance === 'MUST') stats.must.done += 1;
        }
        if (row?.starred) stats.starred += 1;
        stats.reads += row?.readCount ?? 0;

        return {
          ...article,
          done: row?.done ?? false,
          starred: row?.starred ?? false,
          readCount: row?.readCount ?? 0,
          note: row?.note ?? null,
        };
      }),
    })),
  }));

  return { parts, stats, bookshelf: curriculum.bookshelf };
}
