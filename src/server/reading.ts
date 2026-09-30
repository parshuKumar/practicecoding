import { prisma } from './db';
import type { ArticleLink, ArticleView, PartView, SdImportance, SdStats, ReadingSheetView } from '@/lib/types';
import { TRACKS, type TrackKey } from '@/lib/tracks';
import systemDesign from '../../data/system-design.json';
import javascript from '../../data/javascript.json';
import sql from '../../data/sql.json';
import type { SystemDesignData } from '@/lib/system-design-data';

/**
 * One loader for every reading sheet. Content per track is memoised per process (it only
 * changes when the seed runs); only the user's own rows are fetched per view.
 */
const CONTENT_TTL_MS = 10 * 60 * 1000;

const FILES: Record<TrackKey, SystemDesignData> = {
  'system-design': systemDesign as SystemDesignData,
  javascript: javascript as SystemDesignData,
  sql: sql as SystemDesignData,
};

type ArticleContent = Omit<ArticleView, 'done' | 'starred' | 'readCount' | 'note'>;

/**
 * "NS10" when a row links to Namaste JavaScript episode 10, "B6" when it links to Data
 * with Baraa's PDF 06; derived from link labels, so no column needed.
 */
function badgeFor(url: string, links: ArticleLink[]): string | null {
  for (const l of links) {
    const ns = l.label.match(/^Namaste JS Ep (\d+)/);
    if (ns) return `NS${ns[1]}`;
    const b = l.label.match(/^Baraa PDF (\d+)/);
    if (b) return `B${b[1]}`;
  }
  const m = url.match(/namaste-javascript-notes\/blob\/master\/notes\/season-(\d)\/lecture-(\d+)\.md/);
  if (m) return `NS${m[1] === '1' ? Number(m[2]) : 19 + Number(m[2])}`;
  return null;
}

type Content = {
  parts: {
    id: number;
    title: string;
    subtitle: string | null;
    groups: { id: number; code: string; title: string; articles: ArticleContent[] }[];
  }[];
  total: number;
  must: number;
  lastDay: number;
  byKind: Record<string, number>;
};

const cache = new Map<TrackKey, { value: Content; at: number }>();

function emptyByKind<T>(track: TrackKey, make: () => T): Record<string, T> {
  return Object.fromEntries(TRACKS[track].kinds.map((k) => [k.key, make()]));
}

async function loadContent(track: TrackKey): Promise<Content> {
  const parts = await prisma.sdPart.findMany({
    where: { track },
    orderBy: { id: 'asc' },
    include: {
      groups: {
        where: { track },
        orderBy: { id: 'asc' },
        include: { articles: { where: { track }, orderBy: { id: 'asc' } } },
      },
    },
  });

  const byKind = emptyByKind(track, () => 0);
  let total = 0;
  let must = 0;
  let lastDay = 0;

  const mapped = parts.map((part) => ({
    id: part.id,
    title: part.title,
    subtitle: part.subtitle,
    groups: part.groups.map((group) => ({
      id: group.id,
      code: group.code,
      title: group.title,
      articles: group.articles.map((article) => {
        const importance = article.importance as SdImportance;
        const links = (Array.isArray(article.links) ? article.links : []) as ArticleLink[];
        total += 1;
        byKind[article.kind] = (byKind[article.kind] ?? 0) + 1;
        if (importance === 'MUST') must += 1;
        if (article.lastDay) lastDay += 1;
        return {
          id: article.id,
          code: article.code,
          title: article.title,
          url: article.url,
          kind: article.kind,
          importance,
          lastDay: article.lastDay,
          badge: badgeFor(article.url, links),
          summary: article.summary,
          links,
        };
      }),
    })),
  }));

  return { parts: mapped, total, must, lastDay, byKind };
}

async function getContent(track: TrackKey): Promise<Content> {
  const hit = cache.get(track);
  if (hit && Date.now() - hit.at < CONTENT_TTL_MS) return hit.value;
  const value = await loadContent(track);
  cache.set(track, { value, at: Date.now() });
  return value;
}

/**
 * Fire-and-forget: a page calls this for the tracks it is NOT showing, so switching tabs
 * never pays the content join. Failures are harmless; the real request loads it.
 */
export function warmTracks(except?: TrackKey): void {
  for (const track of Object.keys(TRACKS) as TrackKey[]) {
    if (track !== except) void getContent(track).catch(() => {});
  }
}

export async function getReadingSheet(track: TrackKey, userId: string): Promise<ReadingSheetView> {
  const [content, rows] = await Promise.all([
    getContent(track),
    prisma.sdUserArticle.findMany({
      where: { userId, article: { track } },
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
    lastDay: { total: content.lastDay, done: 0 },
    byKind: emptyByKind(track, () => ({ total: 0, done: 0 })),
  };
  for (const [kind, total] of Object.entries(content.byKind)) {
    stats.byKind[kind] = { total, done: 0 };
  }

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
          if (article.lastDay) stats.lastDay.done += 1;
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

  const file = FILES[track];
  return { track, parts, stats, bookshelf: file.bookshelf, lastDayKit: file.lastDayKit ?? [] };
}
