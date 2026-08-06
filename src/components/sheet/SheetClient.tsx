'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, PhaseView, ProblemView, SheetView, Stats } from '@/lib/types';
import { patchProblem } from '@/lib/api';
import { HeroProgress } from './HeroProgress';
import { CommandBar, type FilterState, type View } from './CommandBar';
import { PhaseCard } from './PhaseCard';
import { NoteDialog } from './NoteDialog';
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { Toaster, type ToastMessage } from './Toast';
import { Star } from '../icons';

export type UserState = { done: boolean; starred: boolean; note: string | null };

const EMPTY: UserState = { done: false, starred: false, note: null };
const COLLAPSED_KEY = 'dsa-collapsed-patterns';

export function SheetClient({ sheet }: { sheet: SheetView }) {
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

  const [view, setView] = useState<View>('all');
  const [filters, setFilters] = useState<FilterState>({
    q: '',
    difficulty: 'ALL',
    hideDone: false,
  });
  const [noteFor, setNoteFor] = useState<ProblemView | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const allPatternIds = useMemo(
    () => sheet.phases.flatMap((ph) => ph.patterns.map((p) => p.id)),
    [sheet.phases],
  );

  const [openPatterns, setOpenPatterns] = useState<Set<number>>(() => new Set(allPatternIds));

  // Restore collapsed patterns after mount — reading localStorage during render
  // would mismatch the server-rendered HTML.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSED_KEY);
      if (!raw) return;
      const collapsed: number[] = JSON.parse(raw);
      setOpenPatterns(new Set(allPatternIds.filter((id) => !collapsed.includes(id))));
    } catch {
      /* unreadable storage isn't worth handling */
    }
  }, [allPatternIds]);

  const persistCollapsed = useCallback(
    (open: Set<number>) => {
      try {
        localStorage.setItem(
          COLLAPSED_KEY,
          JSON.stringify(allPatternIds.filter((id) => !open.has(id))),
        );
      } catch {
        /* ignore */
      }
    },
    [allPatternIds],
  );

  const toast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), text, tone }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // A ref of the latest state, so update() can read the pre-patch value without
  // doing it inside a state updater (React would run that twice in StrictMode and
  // capture the already-patched value as the rollback target).
  const stateRef = useRef(state);
  stateRef.current = state;

  const get = useCallback((id: number) => state.get(id) ?? EMPTY, [state]);

  /** Optimistic: apply now, roll back and say so if the write fails. */
  const update = useCallback(
    async (id: number, patch: Partial<UserState>) => {
      const previous = stateRef.current.get(id) ?? EMPTY;
      setState((prev) => new Map(prev).set(id, { ...previous, ...patch }));

      try {
        await patchProblem(id, patch);
      } catch {
        setState((prev) => new Map(prev).set(id, previous));
        toast('Could not save — check your connection.', 'error');
      }
    },
    [toast],
  );

  const toggleDone = useCallback((id: number, done: boolean) => update(id, { done }), [update]);
  const toggleStar = useCallback(
    (id: number, starred: boolean) => update(id, { starred }),
    [update],
  );

  const togglePattern = useCallback(
    (id: number) => {
      setOpenPatterns((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistCollapsed(next);
        return next;
      });
    },
    [persistCollapsed],
  );

  const allOpen = openPatterns.size === allPatternIds.length;

  const toggleAll = useCallback(() => {
    const next = allOpen ? new Set<number>() : new Set(allPatternIds);
    setOpenPatterns(next);
    persistCollapsed(next);
  }, [allOpen, allPatternIds, persistCollapsed]);

  const stats = useMemo<Stats>(() => computeStats(sheet.phases, get), [sheet.phases, get]);

  const phases = useMemo(
    () => filterPhases(sheet.phases, get, filters, view === 'starred'),
    [sheet.phases, get, filters, view],
  );

  const visible = useMemo(
    () => phases.flatMap((ph) => ph.patterns.flatMap((p) => p.problems)),
    [phases],
  );

  const jumpTo = useCallback(
    (id: number) => {
      setActiveId(id);
      // Make sure its pattern is open before scrolling to it.
      const pattern = sheet.phases
        .flatMap((ph) => ph.patterns)
        .find((p) => p.problems.some((pr) => pr.id === id));
      if (pattern && !openPatterns.has(pattern.id)) {
        setOpenPatterns((prev) => {
          const next = new Set(prev).add(pattern.id);
          persistCollapsed(next);
          return next;
        });
      }
      requestAnimationFrame(() => {
        document
          .getElementById(`problem-${id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [sheet.phases, openPatterns, persistCollapsed],
  );

  const randomUnsolved = useCallback(() => {
    const pool = sheet.phases
      .flatMap((ph) => ph.patterns.flatMap((p) => p.problems))
      .filter((p) => !get(p.id).done);
    if (pool.length === 0) {
      toast('Everything is done. All 353.');
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    jumpTo(pick.id);
    toast(pick.title);
  }, [sheet.phases, get, jumpTo, toast]);

  // ── Keyboard shortcuts ────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;

      if (typing) {
        if (e.key === 'Escape') {
          (el as HTMLInputElement).blur();
          if (filters.q) setFilters((f) => ({ ...f, q: '' }));
        }
        return;
      }
      if (noteFor || showShortcuts) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const index = activeId === null ? -1 : visible.findIndex((p) => p.id === activeId);
      const move = (delta: number) => {
        if (visible.length === 0) return;
        const next = index === -1 ? 0 : Math.min(Math.max(index + delta, 0), visible.length - 1);
        jumpTo(visible[next].id);
      };

      switch (e.key) {
        case '/':
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          move(1);
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          move(-1);
          break;
        case 'x':
          if (activeId !== null) toggleDone(activeId, !get(activeId).done);
          break;
        case 's':
          if (activeId !== null) toggleStar(activeId, !get(activeId).starred);
          break;
        case 'n':
          if (activeId !== null) {
            const problem = visible.find((p) => p.id === activeId);
            if (problem) setNoteFor(problem);
          }
          break;
        case 'r':
          randomUnsolved();
          break;
        case 'e':
          toggleAll();
          break;
        case '0':
          setFilters((f) => ({ ...f, difficulty: 'ALL' }));
          break;
        case '1':
          setFilters((f) => ({ ...f, difficulty: 'EASY' }));
          break;
        case '2':
          setFilters((f) => ({ ...f, difficulty: 'MEDIUM' }));
          break;
        case '3':
          setFilters((f) => ({ ...f, difficulty: 'HARD' }));
          break;
        case '?':
          setShowShortcuts(true);
          break;
        case 'Escape':
          setActiveId(null);
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    activeId,
    visible,
    filters.q,
    noteFor,
    showShortcuts,
    get,
    toggleDone,
    toggleStar,
    jumpTo,
    randomUnsolved,
    toggleAll,
  ]);

  return (
    <div className="space-y-4">
      <HeroProgress stats={stats} />

      <CommandBar
        ref={searchRef}
        view={view}
        onViewChange={setView}
        starredCount={stats.starred}
        filters={filters}
        onFiltersChange={setFilters}
        allOpen={allOpen}
        onToggleAll={toggleAll}
        onRandom={randomUnsolved}
        onShowShortcuts={() => setShowShortcuts(true)}
        matchCount={visible.length}
      />

      {visible.length === 0 ? (
        <EmptyState starred={view === 'starred'} />
      ) : (
        <div className="space-y-4">
          {phases.map((phase) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              get={get}
              openPatterns={openPatterns}
              onTogglePattern={togglePattern}
              activeId={activeId}
              onToggleDone={toggleDone}
              onToggleStar={toggleStar}
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

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function EmptyState({ starred }: { starred: boolean }) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
      {starred ? (
        <>
          <Star size={26} className="text-[--color-dim]" />
          <p className="text-sm text-[--color-body]">Nothing starred yet.</p>
          <p className="max-w-xs text-xs text-[--color-dim]">
            Star a problem on the sheet and it shows up here when you want another pass at it.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-[--color-body]">No problems match these filters.</p>
          <p className="text-xs text-[--color-dim]">Try clearing the search or difficulty.</p>
        </>
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
      const haystack =
        `${problem.title} ${problem.hint ?? ''} ${problem.lcNumber ?? ''}`.toLowerCase();
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
