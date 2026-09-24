'use client';

import type { ArticleView, GroupView } from '@/lib/types';
import { Chevron, Flame } from '../icons';
import { ArticleRow } from './ArticleRow';
import type { ArticleState } from './SdClient';

export function GroupCard({
  group,
  get,
  open,
  onToggle,
  activeId,
  onToggleDone,
  onToggleStar,
  onBumpRead,
  onOpenNote,
}: {
  group: GroupView;
  get: (id: number) => ArticleState;
  open: boolean;
  onToggle: () => void;
  activeId: number | null;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onBumpRead: (id: number, delta: 1 | -1) => void;
  onOpenNote: (article: ArticleView) => void;
}) {
  const total = group.articles.length;
  const done = group.articles.filter((a) => get(a.id).done).length;
  const mustLeft = group.articles.filter(
    (a) => a.importance === 'MUST' && !get(a.id).done,
  ).length;
  const percent = total === 0 ? 0 : (done / total) * 100;
  const complete = done === total && total > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-[--color-line-soft] bg-black/20">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/[0.025] sm:px-4"
      >
        <Chevron open={open} size={14} className="shrink-0 text-[--color-dim]" />

        <span
          className="tnum shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold"
          style={{
            color: complete ? 'var(--color-easy)' : 'var(--color-dim)',
            backgroundColor: complete
              ? 'color-mix(in oklab, var(--color-easy) 14%, transparent)'
              : 'var(--color-line-soft)',
          }}
        >
          {group.code}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[--color-hi]">
          {group.title}
        </span>

        {mustLeft > 0 && (
          <span
            className="hidden shrink-0 items-center gap-1 text-[11px] text-[--color-hard] sm:flex"
            title={`${mustLeft} must-read ${mustLeft === 1 ? 'article' : 'articles'} left`}
          >
            <Flame filled size={11} />
            <span className="tnum">{mustLeft}</span>
          </span>
        )}

        <span className="flex shrink-0 items-center gap-2.5">
          <span className="hidden h-1 w-16 overflow-hidden rounded-full bg-[--color-line] sm:block">
            <span
              className="block h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${percent}%`,
                background: complete
                  ? 'var(--color-easy)'
                  : 'linear-gradient(90deg, var(--color-accent), var(--color-accent-2))',
              }}
            />
          </span>
          <span className="tnum w-12 text-right text-[11px] text-[--color-dim]">
            <span className={complete ? 'text-[--color-easy]' : 'text-[--color-body]'}>{done}</span>
            /{total}
          </span>
        </span>
      </button>

      {open && (
        <ul className="animate-rise divide-y divide-[--color-line-soft] border-t border-[--color-line-soft]">
          {group.articles.map((article) => (
            <ArticleRow
              key={article.id}
              article={article}
              state={get(article.id)}
              active={activeId === article.id}
              onToggleDone={onToggleDone}
              onToggleStar={onToggleStar}
              onBumpRead={onBumpRead}
              onOpenNote={onOpenNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
