'use client';

import type { PhaseView, ProblemView } from '@/lib/types';
import { PatternCard } from './PatternCard';
import type { UserState } from './SheetClient';

export function PhaseCard({
  phase,
  get,
  openPatterns,
  onTogglePattern,
  activeId,
  onToggleDone,
  onToggleStar,
  onToggleApproach,
  onOpenNote,
}: {
  phase: PhaseView;
  get: (id: number) => UserState;
  openPatterns: Set<number>;
  onTogglePattern: (id: number) => void;
  activeId: number | null;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onToggleApproach: (id: number, key: string) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const problems = phase.patterns.flatMap((p) => p.problems);
  const done = problems.filter((p) => get(p.id).done).length;
  const percent = problems.length === 0 ? 0 : (done / problems.length) * 100;

  return (
    <section className="glass relative overflow-hidden rounded-2xl">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-5 right-4 select-none text-[112px] font-extrabold leading-none tracking-tighter text-white/[0.025]"
      >
        {String(phase.id).padStart(2, '0')}
      </span>
      <header className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[--color-line] px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-linear-to-br from-[--color-accent] to-[--color-accent-2] text-xs font-bold text-white shadow-[0_6px_16px_-6px_color-mix(in_oklab,var(--color-accent)_70%,transparent)]">
            {phase.id}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold tracking-wide text-[--color-hi]">
              {phase.title}
            </h2>
            {phase.timeline && (
              <p className="text-[11px] text-[--color-dim]">{phase.timeline}</p>
            )}
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
            <span className="text-[--color-hi]">{done}</span> / {problems.length}
          </span>
        </div>
      </header>

      <div className="relative space-y-2 p-2 sm:p-3">
        {phase.patterns.map((pattern) => (
          <PatternCard
            key={pattern.id}
            pattern={pattern}
            get={get}
            open={openPatterns.has(pattern.id)}
            onToggle={() => onTogglePattern(pattern.id)}
            activeId={activeId}
            onToggleDone={onToggleDone}
            onToggleStar={onToggleStar}
            onToggleApproach={onToggleApproach}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </section>
  );
}
