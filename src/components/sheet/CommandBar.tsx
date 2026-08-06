'use client';

import { forwardRef } from 'react';
import type { Difficulty } from '@/lib/types';
import { Dice, Expand, Keyboard, Search, Star, X } from '../icons';

export type View = 'all' | 'starred';

export type FilterState = {
  q: string;
  difficulty: Difficulty | 'ALL';
  hideDone: boolean;
};

const CHIPS: { value: Difficulty | 'ALL'; label: string; color?: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'EASY', label: 'Easy', color: 'var(--color-easy)' },
  { value: 'MEDIUM', label: 'Medium', color: 'var(--color-medium)' },
  { value: 'HARD', label: 'Hard', color: 'var(--color-hard)' },
];

export const CommandBar = forwardRef<
  HTMLInputElement,
  {
    view: View;
    onViewChange: (v: View) => void;
    starredCount: number;
    filters: FilterState;
    onFiltersChange: (f: FilterState) => void;
    allOpen: boolean;
    onToggleAll: () => void;
    onRandom: () => void;
    onShowShortcuts: () => void;
    matchCount: number;
  }
>(function CommandBar(
  {
    view,
    onViewChange,
    starredCount,
    filters,
    onFiltersChange,
    allOpen,
    onToggleAll,
    onRandom,
    onShowShortcuts,
    matchCount,
  },
  ref,
) {
  const filtering = filters.q !== '' || filters.difficulty !== 'ALL' || filters.hideDone;

  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-[--color-line] bg-[--color-base]/85 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        {/* View switch — pure client state, no navigation */}
        <div className="flex rounded-lg border border-[--color-line] bg-[--color-surface] p-0.5">
          <SegButton active={view === 'all'} onClick={() => onViewChange('all')}>
            All
          </SegButton>
          <SegButton active={view === 'starred'} onClick={() => onViewChange('starred')}>
            <Star filled={view === 'starred'} size={13} className="text-[--color-star]" />
            Starred
            {starredCount > 0 && (
              <span className="tnum ml-0.5 rounded bg-[--color-star]/15 px-1.5 text-[11px] text-[--color-star]">
                {starredCount}
              </span>
            )}
          </SegButton>
        </div>

        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[--color-dim]"
          />
          <input
            ref={ref}
            type="text"
            value={filters.q}
            onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
            placeholder="Search problems…"
            aria-label="Search problems"
            className="w-full rounded-lg border border-[--color-line] bg-[--color-surface] py-2 pl-9 pr-16 text-sm text-[--color-hi] transition placeholder:text-[--color-dim] focus:border-[--color-accent]"
          />
          {filters.q ? (
            <button
              onClick={() => onFiltersChange({ ...filters, q: '' })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[--color-dim] transition hover:text-[--color-hi]"
            >
              <X size={14} />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-[--color-line] bg-[--color-raised] px-1.5 py-0.5 text-[10px] text-[--color-dim]">
              /
            </kbd>
          )}
        </div>

        {/* Difficulty chips */}
        <div className="flex gap-1">
          {CHIPS.map((chip) => {
            const active = filters.difficulty === chip.value;
            return (
              <button
                key={chip.value}
                onClick={() => onFiltersChange({ ...filters, difficulty: chip.value })}
                aria-pressed={active}
                className="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
                style={{
                  borderColor: active ? (chip.color ?? 'var(--color-accent)') : 'var(--color-line)',
                  color: active ? (chip.color ?? 'var(--color-hi)') : 'var(--color-dim)',
                  backgroundColor: active
                    ? `color-mix(in oklab, ${chip.color ?? 'var(--color-accent)'} 14%, transparent)`
                    : 'var(--color-surface)',
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <label
          className="flex cursor-pointer select-none items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition"
          style={{
            borderColor: filters.hideDone ? 'var(--color-easy)' : 'var(--color-line)',
            color: filters.hideDone ? 'var(--color-easy)' : 'var(--color-dim)',
            backgroundColor: filters.hideDone
              ? 'color-mix(in oklab, var(--color-easy) 12%, transparent)'
              : 'var(--color-surface)',
          }}
        >
          <input
            type="checkbox"
            checked={filters.hideDone}
            onChange={(e) => onFiltersChange({ ...filters, hideDone: e.target.checked })}
            className="sr-only"
          />
          Hide done
        </label>

        <div className="ml-auto flex items-center gap-1">
          <IconButton onClick={onRandom} label="Jump to a random unsolved problem (r)">
            <Dice size={15} />
          </IconButton>
          <IconButton onClick={onToggleAll} label={allOpen ? 'Collapse all (e)' : 'Expand all (e)'}>
            <Expand size={15} open={allOpen} />
          </IconButton>
          <IconButton onClick={onShowShortcuts} label="Keyboard shortcuts (?)">
            <Keyboard size={15} />
          </IconButton>
        </div>
      </div>

      {filtering && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[--color-dim]">
          <span className="tnum">
            {matchCount} {matchCount === 1 ? 'problem' : 'problems'} match
          </span>
          <button
            onClick={() => onFiltersChange({ q: '', difficulty: 'ALL', hideDone: false })}
            className="text-[--color-accent] transition hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
});

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'bg-[--color-raised] text-[--color-hi] shadow-sm'
          : 'text-[--color-dim] hover:text-[--color-body]'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded-lg border border-[--color-line] bg-[--color-surface] p-2 text-[--color-dim] transition hover:border-[--color-accent] hover:text-[--color-hi]"
    >
      {children}
    </button>
  );
}
