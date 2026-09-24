'use client';

import { forwardRef } from 'react';
import type { SdKind } from '@/lib/types';
import { SD_KIND_LABEL, SD_KIND_ORDER } from '@/lib/types';
import { Dice, Expand, Flame, Keyboard, Search, Star, X } from '../icons';
import { KIND_COLOR } from './ArticleRow';

export type SdView = 'all' | 'starred' | 'must';

export type SdFilterState = {
  q: string;
  kind: SdKind | 'ALL';
  hideDone: boolean;
};

export const EMPTY_FILTERS: SdFilterState = { q: '', kind: 'ALL', hideDone: false };

export const SdCommandBar = forwardRef<
  HTMLInputElement,
  {
    view: SdView;
    onViewChange: (v: SdView) => void;
    starredCount: number;
    mustLeft: number;
    filters: SdFilterState;
    onFiltersChange: (f: SdFilterState) => void;
    allOpen: boolean;
    onToggleAll: () => void;
    onRandom: () => void;
    onShowShortcuts: () => void;
    matchCount: number;
  }
>(function SdCommandBar(
  {
    view,
    onViewChange,
    starredCount,
    mustLeft,
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
  const filtering = filters.q !== '' || filters.kind !== 'ALL' || filters.hideDone;

  return (
    <div className="sticky top-[57px] z-20 -mx-4 border-b border-[--color-line] bg-[--color-base]/85 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[--color-line] bg-[--color-surface] p-0.5">
          <SegButton active={view === 'all'} onClick={() => onViewChange('all')}>
            All
          </SegButton>
          <SegButton active={view === 'must'} onClick={() => onViewChange('must')}>
            <Flame filled={view === 'must'} size={13} className="text-[--color-hard]" />
            Must
            {mustLeft > 0 && (
              <span className="tnum ml-0.5 rounded bg-[--color-hard]/15 px-1.5 text-[11px] text-[--color-hard]">
                {mustLeft}
              </span>
            )}
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
            placeholder="Search articles…"
            aria-label="Search articles"
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

        <div className="flex flex-wrap gap-1">
          <Chip
            active={filters.kind === 'ALL'}
            onClick={() => onFiltersChange({ ...filters, kind: 'ALL' })}
          >
            All
          </Chip>
          {SD_KIND_ORDER.map((k) => (
            <Chip
              key={k}
              active={filters.kind === k}
              color={KIND_COLOR[k]}
              onClick={() => onFiltersChange({ ...filters, kind: k })}
            >
              {SD_KIND_LABEL[k]}
            </Chip>
          ))}
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
          Hide read
        </label>

        <div className="ml-auto flex items-center gap-1">
          <IconButton onClick={onRandom} label="Jump to a random unread article (r)">
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
            {matchCount} {matchCount === 1 ? 'article' : 'articles'} match
          </span>
          <button
            onClick={() => onFiltersChange(EMPTY_FILTERS)}
            className="text-[--color-accent] transition hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
});

function Chip({
  active,
  color,
  onClick,
  children,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
      style={{
        borderColor: active ? (color ?? 'var(--color-accent)') : 'var(--color-line)',
        color: active ? (color ?? 'var(--color-hi)') : 'var(--color-dim)',
        backgroundColor: active
          ? `color-mix(in oklab, ${color ?? 'var(--color-accent)'} 14%, transparent)`
          : 'var(--color-surface)',
      }}
    >
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}

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
