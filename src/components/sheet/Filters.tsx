'use client';

import type { Difficulty } from '@/lib/types';

export type FilterState = {
  q: string;
  difficulty: Difficulty | 'ALL';
  hideDone: boolean;
};

export function Filters({
  value,
  onChange,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={value.q}
        onChange={(e) => onChange({ ...value, q: e.target.value })}
        placeholder="Search problems…"
        aria-label="Search problems"
        className="min-w-0 flex-1 rounded-md border border-[--color-border] bg-[--color-card] px-3 py-2 text-sm text-white placeholder:text-[--color-muted]"
      />

      <select
        value={value.difficulty}
        onChange={(e) => onChange({ ...value, difficulty: e.target.value as FilterState['difficulty'] })}
        aria-label="Filter by difficulty"
        className="rounded-md border border-[--color-border] bg-[--color-card] px-3 py-2 text-sm text-white"
      >
        <option value="ALL">All difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      <label className="flex cursor-pointer select-none items-center gap-2 rounded-md border border-[--color-border] bg-[--color-card] px-3 py-2 text-sm text-[--color-muted]">
        <input
          type="checkbox"
          checked={value.hideDone}
          onChange={(e) => onChange({ ...value, hideDone: e.target.checked })}
          className="h-4 w-4 accent-[--color-accent]"
        />
        Hide done
      </label>
    </div>
  );
}
