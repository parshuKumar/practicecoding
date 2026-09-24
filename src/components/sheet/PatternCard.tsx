'use client';

import type { PatternView, ProblemView } from '@/lib/types';
import { Chevron } from '../icons';
import { ProblemRow } from './ProblemRow';
import type { UserState } from './SheetClient';

export function PatternCard({
  pattern,
  get,
  open,
  onToggle,
  activeId,
  onToggleDone,
  onToggleStar,
  onToggleApproach,
  onOpenNote,
}: {
  pattern: PatternView;
  get: (id: number) => UserState;
  open: boolean;
  onToggle: () => void;
  activeId: number | null;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onToggleApproach: (id: number, key: string) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const total = pattern.problems.length;
  const done = pattern.problems.filter((p) => get(p.id).done).length;
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
          className="mono shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold"
          style={{
            color: complete ? 'var(--color-easy)' : 'var(--color-dim)',
            backgroundColor: complete
              ? 'color-mix(in oklab, var(--color-easy) 14%, transparent)'
              : 'var(--color-line-soft)',
          }}
        >
          {pattern.code}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm font-medium text-[--color-hi]">
          {pattern.title}
        </span>

        {pattern.timeEstimate && (
          <span className="hidden shrink-0 text-[11px] text-[--color-dim] lg:block">
            {pattern.timeEstimate}
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
          {pattern.problems.map((problem) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              state={get(problem.id)}
              active={activeId === problem.id}
              onToggleDone={onToggleDone}
              onToggleStar={onToggleStar}
              onToggleApproach={onToggleApproach}
              onOpenNote={onOpenNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
