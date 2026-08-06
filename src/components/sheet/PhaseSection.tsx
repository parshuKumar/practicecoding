'use client';

import { useState } from 'react';
import type { PhaseView, ProblemView } from '@/lib/types';
import type { UserState } from './SheetClient';
import { PatternSection } from './PatternSection';
import { ProgressBar } from './ProgressBar';

export function PhaseSection({
  phase,
  get,
  onToggleDone,
  onToggleStar,
  onOpenNote,
}: {
  phase: PhaseView;
  get: (id: number) => UserState;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const [open, setOpen] = useState(true);

  const problems = phase.patterns.flatMap((p) => p.problems);
  const done = problems.filter((p) => get(p.id).done).length;

  return (
    <section className="overflow-hidden rounded-lg border border-[--color-border] bg-[--color-card]">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.02]"
      >
        <span className="text-[--color-muted]">{open ? '▾' : '▸'}</span>
        <h2 className="flex-1 text-sm font-semibold tracking-wide text-white">
          PHASE {phase.id} — {phase.title}
          {phase.timeline && (
            <span className="ml-2 font-normal text-[--color-muted]">({phase.timeline})</span>
          )}
        </h2>
        <ProgressBar done={done} total={problems.length} />
      </button>

      {open && (
        <div className="space-y-px border-t border-[--color-border]">
          {phase.patterns.map((pattern) => (
            <PatternSection
              key={pattern.id}
              pattern={pattern}
              get={get}
              onToggleDone={onToggleDone}
              onToggleStar={onToggleStar}
              onOpenNote={onOpenNote}
            />
          ))}
        </div>
      )}
    </section>
  );
}
