'use client';

import { memo } from 'react';
import type { Difficulty, ProblemView, Role } from '@/lib/types';
import { ROLE_LABEL } from '@/lib/types';
import { Check, External, Note, Star } from '../icons';
import { LinksMenu } from '../LinksMenu';
import type { UserState } from './SheetClient';

const DIFF_COLOR: Record<Difficulty, string> = {
  EASY: 'var(--color-easy)',
  MEDIUM: 'var(--color-medium)',
  HARD: 'var(--color-hard)',
};

const DIFF_SHORT: Record<Difficulty, string> = { EASY: 'E', MEDIUM: 'M', HARD: 'H' };

const ROLE_COLOR: Record<Role, string> = {
  WARMUP: 'var(--color-warmup)',
  CORE: 'var(--color-core)',
  STRETCH: 'var(--color-stretch)',
  CONTEST: 'var(--color-contest)',
};

/**
 * Memoised: a tick rebuilds the state Map, but untouched rows keep the same
 * UserState reference, so only the row that actually changed re-renders.
 */
export const ProblemRow = memo(function ProblemRow({
  problem,
  state,
  active,
  onToggleDone,
  onToggleStar,
  onToggleApproach,
  onOpenNote,
}: {
  problem: ProblemView;
  state: UserState;
  active: boolean;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onToggleApproach: (id: number, key: string) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const hasNote = Boolean(state.note?.trim());
  const diffColor = DIFF_COLOR[problem.difficulty];

  return (
    <li
      id={`problem-${problem.id}`}
      className={`group relative flex items-center gap-2.5 px-3 py-[7px] transition-colors sm:gap-3 sm:px-4 ${
        active ? 'bg-[--color-accent]/[0.07]' : 'hover:bg-white/[0.025]'
      }`}
    >
      {/* Difficulty hairline: lets a mixed list be scanned by colour. */}
      <span
        className="absolute inset-y-[7px] left-0 w-[2px] rounded-r"
        style={{
          background: active ? 'linear-gradient(var(--color-accent), var(--color-accent-2))' : diffColor,
          opacity: active ? 1 : 0.55,
        }}
      />

      <Checkbox
        checked={state.done}
        label={`Mark ${problem.title} as done`}
        onChange={(v) => onToggleDone(problem.id, v)}
      />

      <span className="mono hidden w-9 shrink-0 text-right text-[11px] text-[--color-dim] sm:block">
        {problem.lcNumber}
      </span>

      <a
        href={problem.url}
        target="_blank"
        rel="noopener noreferrer"
        title={problem.hint ?? undefined}
        className={`min-w-0 flex-1 truncate text-[13.5px] transition ${
          state.done
            ? 'text-[--color-dim] line-through decoration-[--color-dim]/50'
            : 'text-[--color-body] hover:text-[--color-hi]'
        }`}
      >
        {problem.title}
        <External
          size={11}
          className="ml-1.5 inline-block align-[-1px] text-[--color-dim] opacity-0 transition group-hover:opacity-100"
        />
      </a>

      <span
        className="hidden shrink-0 truncate text-[11px] md:block md:max-w-[170px] lg:max-w-[240px]"
        style={{ color: 'var(--color-dim)' }}
        title={problem.hint ?? undefined}
      >
        {problem.hint}
      </span>

      {problem.approachOptions.length > 0 && (
        <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Approaches done">
          {problem.approachOptions.map((option) => {
            const on = state.approaches.includes(option.key);
            return (
              <button
                key={option.key}
                onClick={() => onToggleApproach(problem.id, option.key)}
                aria-pressed={on}
                title={`${option.title}${on ? ' — done' : ''}`}
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition"
                style={{
                  color: on ? 'var(--color-base)' : 'var(--color-dim)',
                  backgroundColor: on ? 'var(--color-accent-2)' : 'var(--color-line-soft)',
                  boxShadow: on ? '0 0 8px color-mix(in oklab, var(--color-accent-2) 50%, transparent)' : 'none',
                }}
              >
                {option.label}
              </button>
            );
          })}
        </span>
      )}

      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:block"
        style={{
          color: ROLE_COLOR[problem.role],
          backgroundColor: `color-mix(in oklab, ${ROLE_COLOR[problem.role]} 13%, transparent)`,
        }}
      >
        {ROLE_LABEL[problem.role]}
      </span>

      <span
        className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded text-[10px] font-bold"
        style={{
          color: diffColor,
          backgroundColor: `color-mix(in oklab, ${diffColor} 15%, transparent)`,
        }}
        title={problem.difficulty}
      >
        {DIFF_SHORT[problem.difficulty]}
      </span>

      <LinksMenu
        links={problem.links}
        heading="Solutions and approaches"
        ariaLabel={`Solutions for ${problem.title}`}
      />

      <div className="flex shrink-0 items-center">
        <button
          onClick={() => onOpenNote(problem)}
          title={hasNote ? 'Edit note (n)' : 'Add note (n)'}
          aria-label={hasNote ? `Edit note for ${problem.title}` : `Add note for ${problem.title}`}
          className={`rounded-md p-1.5 transition hover:bg-white/[0.06] ${
            hasNote
              ? 'text-[--color-accent-2]'
              : 'text-[--color-dim] opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <Note size={15} filled={hasNote} />
        </button>

        <button
          onClick={() => onToggleStar(problem.id, !state.starred)}
          title={state.starred ? 'Unstar (s)' : 'Star to revise again (s)'}
          aria-label={state.starred ? `Unstar ${problem.title}` : `Star ${problem.title}`}
          aria-pressed={state.starred}
          className={`rounded-md p-1.5 transition hover:bg-white/[0.06] ${
            state.starred
              ? 'text-[--color-star]'
              : 'text-[--color-dim] opacity-0 hover:text-[--color-star] group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <Star size={15} filled={state.starred} className={state.starred ? 'animate-pop' : ''} />
        </button>
      </div>
    </li>
  );
});

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border transition ${
        checked
          ? 'border-[--color-easy] bg-[--color-easy] text-[--color-base]'
          : 'border-[--color-line] bg-transparent hover:border-[--color-easy]'
      }`}
    >
      {checked && <Check size={11} />}
    </button>
  );
}
