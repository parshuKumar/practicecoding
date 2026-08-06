'use client';

import { useCallback, useMemo, useState } from 'react';
import type { Difficulty, PhaseView, ProblemView, SheetView, Stats } from '@/lib/types';
import { patchProblem } from '@/lib/api';
import { ProgressHeader } from './ProgressHeader';
import { Filters, type FilterState } from './Filters';
import { PhaseSection } from './PhaseSection';
import { NoteDialog } from './NoteDialog';

export type UserState = { done: boolean; starred: boolean; note: string | null };

const EMPTY: UserState = { done: false, starred: false, note: null };

export function SheetClient({
  sheet,
  starredOnly = false,
  showImportHint = false,
}: {
  sheet: SheetView;
  starredOnly?: boolean;
  showImportHint?: boolean;
}) {
  // Content never changes; only this map does. Keeps ticking a single-key update
  // rather than a walk of 353 rows.
  const [state, setState] = useState<Map<number, UserState>>(() => {
    const map = new Map<number, UserState>();
    for (const phase of sheet.phases) {
      for (const pattern of phase.patterns) {
        for (const p of pattern.problems) {
          if (p.done || p.starred || p.note) {
            map.set(p.id, { done: p.done, starred: p.starred, note: p.note });
          }
        }
      }
    }
    return map;
  });

  const [filters, setFilters] = useState<FilterState>({
    q: '',
    difficulty: 'ALL',
    hideDone: false,
  });
  const [noteFor, setNoteFor] = useState<ProblemView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback((id: number) => state.get(id) ?? EMPTY, [state]);

  /** Optimistic: apply immediately, roll back and surface the error if the write fails. */
  const update = useCallback(
    async (id: number, patch: Partial<UserState>) => {
      const previous = state.get(id) ?? EMPTY;
      const next = { ...previous, ...patch };

      setState((prev) => new Map(prev).set(id, next));
      setError(null);

      try {
        await patchProblem(id, patch);
      } catch (err) {
        setState((prev) => {
          const rolled = new Map(prev);
          rolled.set(id, previous);
          return rolled;
        });
        setError(err instanceof Error ? err.message : 'Could not save — check your connection.');
      }
    },
    [state],
  );

  const stats = useMemo<Stats>(() => computeStats(sheet.phases, get), [sheet.phases, get]);

  const phases = useMemo(
    () => filterPhases(sheet.phases, get, filters, starredOnly),
    [sheet.phases, get, filters, starredOnly],
  );

  const visibleCount = phases.reduce(
    (sum, phase) => sum + phase.patterns.reduce((s, p) => s + p.problems.length, 0),
    0,
  );

  return (
    <div className="space-y-5">
      <ProgressHeader stats={stats} />

      {showImportHint && stats.done === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[--color-accent] bg-[--color-accent]/10 px-4 py-3 text-sm">
          <span>Ticked problems on the old sheet? Bring them across.</span>
          <a
            href="/import"
            className="rounded-md border border-[--color-accent] px-3 py-1.5 font-medium text-white transition hover:bg-[--color-accent]/20"
          >
            Import old progress
          </a>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-md border border-[--color-hard] bg-[--color-hard]/10 px-4 py-2 text-sm"
        >
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-[--color-muted] hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <Filters value={filters} onChange={setFilters} />

      {visibleCount === 0 ? (
        <p className="rounded-lg border border-[--color-border] bg-[--color-card] px-4 py-10 text-center text-sm text-[--color-muted]">
          {starredOnly
            ? 'Nothing starred yet. Star a problem on the sheet to revisit it later.'
            : 'No problems match these filters.'}
        </p>
      ) : (
        <div className="space-y-6">
          {phases.map((phase) => (
            <PhaseSection
              key={phase.id}
              phase={phase}
              get={get}
              onToggleDone={(id, done) => update(id, { done })}
              onToggleStar={(id, starred) => update(id, { starred })}
              onOpenNote={setNoteFor}
            />
          ))}
        </div>
      )}

      {noteFor && (
        <NoteDialog
          problem={noteFor}
          note={get(noteFor.id).note}
          onClose={() => setNoteFor(null)}
          onSave={(note) => update(noteFor.id, { note })}
        />
      )}
    </div>
  );
}

function computeStats(phases: PhaseView[], get: (id: number) => UserState): Stats {
  const stats: Stats = {
    total: 0,
    done: 0,
    starred: 0,
    byDifficulty: {
      EASY: { total: 0, done: 0 },
      MEDIUM: { total: 0, done: 0 },
      HARD: { total: 0, done: 0 },
    },
  };

  for (const phase of phases) {
    for (const pattern of phase.patterns) {
      for (const problem of pattern.problems) {
        const mine = get(problem.id);
        const difficulty = problem.difficulty as Difficulty;
        stats.total += 1;
        stats.byDifficulty[difficulty].total += 1;
        if (mine.done) {
          stats.done += 1;
          stats.byDifficulty[difficulty].done += 1;
        }
        if (mine.starred) stats.starred += 1;
      }
    }
  }

  return stats;
}

function filterPhases(
  phases: PhaseView[],
  get: (id: number) => UserState,
  filters: FilterState,
  starredOnly: boolean,
): PhaseView[] {
  const q = filters.q.trim().toLowerCase();

  const matches = (problem: ProblemView) => {
    const mine = get(problem.id);
    if (starredOnly && !mine.starred) return false;
    if (filters.hideDone && mine.done) return false;
    if (filters.difficulty !== 'ALL' && problem.difficulty !== filters.difficulty) return false;
    if (q) {
      const haystack = `${problem.title} ${problem.hint ?? ''} ${problem.lcNumber ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  return phases
    .map((phase) => ({
      ...phase,
      patterns: phase.patterns
        .map((pattern) => ({ ...pattern, problems: pattern.problems.filter(matches) }))
        .filter((pattern) => pattern.problems.length > 0),
    }))
    .filter((phase) => phase.patterns.length > 0);
}
