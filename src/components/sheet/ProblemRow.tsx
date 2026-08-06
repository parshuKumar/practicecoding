'use client';

import type { Difficulty, ProblemView, Role } from '@/lib/types';
import { DIFFICULTY_LABEL, ROLE_LABEL } from '@/lib/types';
import type { UserState } from './SheetClient';

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  EASY: 'var(--color-easy)',
  MEDIUM: 'var(--color-medium)',
  HARD: 'var(--color-hard)',
};

const ROLE_COLOR: Record<Role, string> = {
  WARMUP: 'var(--color-warmup)',
  CORE: 'var(--color-core)',
  STRETCH: 'var(--color-stretch)',
  CONTEST: 'var(--color-contest)',
};

export function ProblemRow({
  problem,
  state,
  onToggleDone,
  onToggleStar,
  onOpenNote,
}: {
  problem: ProblemView;
  state: UserState;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const hasNote = Boolean(state.note?.trim());

  return (
    <li className="flex items-start gap-3 border-b border-[--color-border]/40 px-4 py-2.5 pl-8 last:border-b-0 hover:bg-white/[0.02]">
      <input
        type="checkbox"
        checked={state.done}
        onChange={(e) => onToggleDone(problem.id, e.target.checked)}
        aria-label={`Mark ${problem.title} as done`}
        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[--color-easy]"
      />

      <div className="min-w-0 flex-1">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-sm hover:underline ${
            state.done ? 'text-[--color-muted] line-through' : 'text-[--color-accent]'
          }`}
        >
          {problem.title}
          {problem.lcNumber !== null && (
            <span className="ml-1.5 text-xs text-[--color-muted]">LC {problem.lcNumber}</span>
          )}
        </a>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <Badge color={ROLE_COLOR[problem.role]}>{ROLE_LABEL[problem.role]}</Badge>
          {problem.hint && <span className="text-[--color-muted]">{problem.hint}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Badge color={DIFFICULTY_COLOR[problem.difficulty]}>
          {DIFFICULTY_LABEL[problem.difficulty]}
        </Badge>

        <button
          onClick={() => onOpenNote(problem)}
          title={hasNote ? 'Edit note' : 'Add note'}
          aria-label={hasNote ? `Edit note for ${problem.title}` : `Add note for ${problem.title}`}
          className={`rounded p-1.5 text-sm transition hover:bg-white/5 ${
            hasNote ? 'text-[--color-accent]' : 'text-[--color-muted]'
          }`}
        >
          {hasNote ? '📝' : '＋'}
        </button>

        <button
          onClick={() => onToggleStar(problem.id, !state.starred)}
          title={state.starred ? 'Remove from revision' : 'Mark to revise again'}
          aria-label={
            state.starred ? `Unstar ${problem.title}` : `Star ${problem.title} to revise again`
          }
          aria-pressed={state.starred}
          className={`rounded p-1.5 text-sm transition hover:bg-white/5 ${
            state.starred ? 'text-[--color-star]' : 'text-[--color-muted] hover:text-[--color-star]'
          }`}
        >
          {state.starred ? '★' : '☆'}
        </button>
      </div>
    </li>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
    >
      {children}
    </span>
  );
}
