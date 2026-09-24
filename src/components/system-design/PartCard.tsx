'use client';

import type { ArticleView, PartView } from '@/lib/types';
import { GroupCard } from './GroupCard';
import type { ArticleState } from './SdClient';

export function PartCard({
  part,
  get,
  openGroups,
  onToggleGroup,
  activeId,
  onToggleDone,
  onToggleStar,
  onBumpRead,
  onOpenNote,
}: {
  part: PartView;
  get: (id: number) => ArticleState;
  openGroups: Set<number>;
  onToggleGroup: (id: number) => void;
  activeId: number | null;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onBumpRead: (id: number, delta: 1 | -1) => void;
  onOpenNote: (article: ArticleView) => void;
}) {
  const articles = part.groups.flatMap((g) => g.articles);
  const done = articles.filter((a) => get(a.id).done).length;
  const percent = articles.length === 0 ? 0 : (done / articles.length) * 100;

  return (
    <section className="glass relative overflow-hidden rounded-2xl">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-5 right-4 select-none text-[112px] font-extrabold leading-none tracking-tighter text-white/[0.025]"
      >
        {String(part.id).padStart(2, '0')}
      </span>
      <header className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[--color-line] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-linear-to-br from-[--color-accent] to-[--color-accent-2] text-xs font-bold text-white shadow-[0_6px_16px_-6px_color-mix(in_oklab,var(--color-accent)_70%,transparent)]">
            {part.id}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-wide text-[--color-hi]">
              {part.title}
            </h2>
            {part.subtitle && <p className="text-[11px] text-[--color-dim]">{part.subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[--color-line] sm:w-40">
            <div
              className="h-full rounded-full bg-linear-to-r from-[--color-accent] to-[--color-accent-2] transition-[width] duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="tnum text-xs text-[--color-dim]">
            <span className="text-[--color-hi]">{done}</span> / {articles.length}
          </span>
        </div>
      </header>

      <div className="relative space-y-2 p-2 sm:p-3">
        {part.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            get={get}
            open={openGroups.has(group.id)}
            onToggle={() => onToggleGroup(group.id)}
            activeId={activeId}
            onToggleDone={onToggleDone}
            onToggleStar={onToggleStar}
            onBumpRead={onBumpRead}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </section>
  );
}
