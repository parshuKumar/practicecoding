'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArticleView, PartView, ReadingSheetView, SdStats } from '@/lib/types';
import { TRACKS, type TrackConfig } from '@/lib/tracks';
import { patchArticle } from '@/lib/api';
import { NoteDialog } from '../sheet/NoteDialog';
import { ShortcutsOverlay, type Shortcut } from '../sheet/ShortcutsOverlay';
import { Toaster, type ToastMessage } from '../sheet/Toast';
import { Flame, Moon, Star } from '../icons';
import { SdHero } from './SdHero';
import { SdCommandBar, EMPTY_FILTERS, type SdFilterState, type SdView } from './SdCommandBar';
import { PartCard } from './PartCard';
import { Bookshelf } from './Bookshelf';
import { LastDayKit } from './LastDayKit';

export type ArticleState = { done: boolean; starred: boolean; readCount: number; note: string | null };

const EMPTY: ArticleState = { done: false, starred: false, readCount: 0, note: null };

function shortcutsFor(track: TrackConfig): Shortcut[] {
  const [singular] = track.noun;
  return [
    ['/', 'Focus search'],
    ['j  ↓', `Next ${singular}`],
    ['k  ↑', `Previous ${singular}`],
    ['x', 'Toggle read'],
    ['+  =', 'Read it one more time'],
    ['-', 'Take one read back'],
    ['s', 'Toggle star'],
    ['n', 'Open note'],
    ['m', 'Must-read view on / off'],
    ['l', 'Last-day view on / off'],
    ['r', `Jump to a random unread ${singular}`],
    ['e', 'Expand / collapse all groups'],
    [`1 … ${track.kinds.length}  0`, 'Filter by kind / all'],
    ['?', 'This help'],
    ['Esc', 'Close, or clear search'],
  ];
}

/** What one PATCH will change, given the current row and the intent. */
type Patch = { done?: boolean; starred?: boolean; note?: string | null; readDelta?: 1 | -1 };

/** One component renders every reading sheet; `view.track` picks the config. */
export function SdClient({ view: initial }: { view: ReadingSheetView }) {
  const track = TRACKS[initial.track];
  const collapsedKey = `${track.key}-collapsed-groups`;

  const [state, setState] = useState<Map<number, ArticleState>>(() => {
    const map = new Map<number, ArticleState>();
    for (const part of initial.parts) {
      for (const group of part.groups) {
        for (const a of group.articles) {
          if (a.done || a.starred || a.note || a.readCount > 0) {
            map.set(a.id, { done: a.done, starred: a.starred, readCount: a.readCount, note: a.note });
          }
        }
      }
    }
    return map;
  });

  const [view, setView] = useState<SdView>('all');
  const [filters, setFilters] = useState<SdFilterState>(EMPTY_FILTERS);
  const [noteFor, setNoteFor] = useState<ArticleView | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const allGroupIds = useMemo(
    () => initial.parts.flatMap((p) => p.groups.map((g) => g.id)),
    [initial.parts],
  );

  const [openGroups, setOpenGroups] = useState<Set<number>>(() => new Set(allGroupIds));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(collapsedKey);
      if (!raw) return;
      const collapsed: number[] = JSON.parse(raw);
      setOpenGroups(new Set(allGroupIds.filter((id) => !collapsed.includes(id))));
    } catch {
      /* unreadable storage isn't worth handling */
    }
  }, [allGroupIds, collapsedKey]);

  const persistCollapsed = useCallback(
    (open: Set<number>) => {
      try {
        localStorage.setItem(
          collapsedKey,
          JSON.stringify(allGroupIds.filter((id) => !open.has(id))),
        );
      } catch {
        /* ignore */
      }
    },
    [allGroupIds, collapsedKey],
  );

  const toast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    setToasts((prev) => [...prev, { id: Date.now() + Math.random(), text, tone }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const get = useCallback((id: number) => state.get(id) ?? EMPTY, [state]);

  /** Optimistic: apply now, roll back and say so if the write fails. */
  const update = useCallback(
    async (id: number, patch: Patch) => {
      const previous = stateRef.current.get(id) ?? EMPTY;
      const next: ArticleState = {
        done: patch.done ?? previous.done,
        starred: patch.starred ?? previous.starred,
        note: patch.note !== undefined ? patch.note : previous.note,
        readCount: Math.max(0, previous.readCount + (patch.readDelta ?? 0)),
      };
      setState((prev) => new Map(prev).set(id, next));

      try {
        await patchArticle(id, patch);
      } catch {
        setState((prev) => new Map(prev).set(id, previous));
        toast('Could not save — check your connection.', 'error');
      }
    },
    [toast],
  );

  // Ticking an unread item counts as its first read; reading an unticked one ticks it.
  const toggleDone = useCallback(
    (id: number, done: boolean) => {
      const current = stateRef.current.get(id) ?? EMPTY;
      if (done && current.readCount === 0) return update(id, { done, readDelta: 1 });
      return update(id, { done });
    },
    [update],
  );

  const bumpRead = useCallback(
    (id: number, delta: 1 | -1) => {
      const current = stateRef.current.get(id) ?? EMPTY;
      if (delta < 0 && current.readCount === 0) return;
      if (delta > 0 && !current.done) return update(id, { done: true, readDelta: 1 });
      return update(id, { readDelta: delta });
    },
    [update],
  );

  const toggleStar = useCallback(
    (id: number, starred: boolean) => update(id, { starred }),
    [update],
  );

  const toggleGroup = useCallback(
    (id: number) => {
      setOpenGroups((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        persistCollapsed(next);
        return next;
      });
    },
    [persistCollapsed],
  );

  const allOpen = openGroups.size === allGroupIds.length;

  const toggleAll = useCallback(() => {
    const next = allOpen ? new Set<number>() : new Set(allGroupIds);
    setOpenGroups(next);
    persistCollapsed(next);
  }, [allOpen, allGroupIds, persistCollapsed]);

  const stats = useMemo<SdStats>(
    () => computeStats(track, initial.parts, get),
    [track, initial.parts, get],
  );

  const parts = useMemo(
    () => filterParts(initial.parts, get, filters, view),
    [initial.parts, get, filters, view],
  );

  const visible = useMemo(
    () => parts.flatMap((p) => p.groups.flatMap((g) => g.articles)),
    [parts],
  );

  const jumpTo = useCallback(
    (id: number) => {
      setActiveId(id);
      const group = initial.parts
        .flatMap((p) => p.groups)
        .find((g) => g.articles.some((a) => a.id === id));
      if (group && !openGroups.has(group.id)) {
        setOpenGroups((prev) => {
          const next = new Set(prev).add(group.id);
          persistCollapsed(next);
          return next;
        });
      }
      requestAnimationFrame(() => {
        document
          .getElementById(`article-${id}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    },
    [initial.parts, openGroups, persistCollapsed],
  );

  // Random unread item: last-day list first, then must-reads, then anything.
  const randomUnread = useCallback(() => {
    const unread = initial.parts
      .flatMap((p) => p.groups.flatMap((g) => g.articles))
      .filter((a) => !get(a.id).done);
    if (unread.length === 0) {
      toast(`Everything is read. All ${initial.parts.flatMap((p) => p.groups.flatMap((g) => g.articles)).length}.`);
      return;
    }
    const lastDay = unread.filter((a) => a.lastDay);
    const must = unread.filter((a) => a.importance === 'MUST');
    const pool = lastDay.length > 0 ? lastDay : must.length > 0 ? must : unread;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    jumpTo(pick.id);
    toast(pick.title);
  }, [initial.parts, get, jumpTo, toast]);

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

      const index = activeId === null ? -1 : visible.findIndex((a) => a.id === activeId);
      const move = (delta: number) => {
        if (visible.length === 0) return;
        const next = index === -1 ? 0 : Math.min(Math.max(index + delta, 0), visible.length - 1);
        jumpTo(visible[next].id);
      };

      if (/^[1-9]$/.test(e.key)) {
        const kind = track.kinds[Number(e.key) - 1];
        if (kind) setFilters((f) => ({ ...f, kind: kind.key }));
        return;
      }

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
        case '+':
        case '=':
          if (activeId !== null) bumpRead(activeId, 1);
          break;
        case '-':
        case '_':
          if (activeId !== null) bumpRead(activeId, -1);
          break;
        case 's':
          if (activeId !== null) toggleStar(activeId, !get(activeId).starred);
          break;
        case 'n':
          if (activeId !== null) {
            const article = visible.find((a) => a.id === activeId);
            if (article) setNoteFor(article);
          }
          break;
        case 'm':
          setView((v) => (v === 'must' ? 'all' : 'must'));
          break;
        case 'l':
          if (stats.lastDay.total > 0) setView((v) => (v === 'lastday' ? 'all' : 'lastday'));
          break;
        case 'r':
          randomUnread();
          break;
        case 'e':
          toggleAll();
          break;
        case '0':
          setFilters((f) => ({ ...f, kind: 'ALL' }));
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
    track,
    activeId,
    visible,
    filters.q,
    noteFor,
    showShortcuts,
    stats.lastDay.total,
    get,
    toggleDone,
    bumpRead,
    toggleStar,
    jumpTo,
    randomUnread,
    toggleAll,
  ]);

  const mustLeft = stats.must.total - stats.must.done;
  const lastDayLeft = stats.lastDay.total - stats.lastDay.done;

  return (
    <div className="space-y-4">
      <SdHero track={track} stats={stats} />

      <SdCommandBar
        ref={searchRef}
        track={track}
        view={view}
        onViewChange={setView}
        starredCount={stats.starred}
        mustLeft={mustLeft}
        lastDayLeft={lastDayLeft}
        hasLastDay={stats.lastDay.total > 0}
        filters={filters}
        onFiltersChange={setFilters}
        allOpen={allOpen}
        onToggleAll={toggleAll}
        onRandom={randomUnread}
        onShowShortcuts={() => setShowShortcuts(true)}
        matchCount={visible.length}
      />

      {view === 'lastday' && (
        <LastDayKit links={initial.lastDayKit} left={lastDayLeft} total={stats.lastDay.total} />
      )}

      {visible.length === 0 ? (
        <EmptyState view={view} noun={track.noun} />
      ) : (
        <div className="space-y-4">
          {parts.map((part) => (
            <PartCard
              key={part.id}
              track={track}
              part={part}
              get={get}
              openGroups={openGroups}
              onToggleGroup={toggleGroup}
              activeId={activeId}
              onToggleDone={toggleDone}
              onToggleStar={toggleStar}
              onBumpRead={bumpRead}
              onOpenNote={setNoteFor}
            />
          ))}
        </div>
      )}

      <Bookshelf entries={initial.bookshelf} />

      {noteFor && (
        <NoteDialog
          subject={{
            title: noteFor.title,
            url: noteFor.url,
            linkLabel: track.noteLink(noteFor.code),
            placeholder: track.notePlaceholder,
          }}
          note={get(noteFor.id).note}
          onClose={() => setNoteFor(null)}
          onSave={(note) => update(noteFor.id, { note })}
        />
      )}

      {showShortcuts && (
        <ShortcutsOverlay shortcuts={shortcutsFor(track)} onClose={() => setShowShortcuts(false)} />
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function EmptyState({ view, noun }: { view: SdView; noun: [string, string] }) {
  const [singular, plural] = noun;
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
      {view === 'starred' ? (
        <>
          <Star size={26} className="text-[--color-dim]" />
          <p className="text-sm text-[--color-body]">Nothing starred yet.</p>
          <p className="max-w-xs text-xs text-[--color-dim]">
            Star a {singular} and it shows up here when you want another pass at it.
          </p>
        </>
      ) : view === 'must' ? (
        <>
          <Flame size={26} className="text-[--color-dim]" />
          <p className="text-sm text-[--color-body]">No must-read {plural} match.</p>
          <p className="text-xs text-[--color-dim]">
            Either they are all read, or a filter is hiding them.
          </p>
        </>
      ) : view === 'lastday' ? (
        <>
          <Moon size={26} className="text-[--color-dim]" />
          <p className="text-sm text-[--color-body]">No last-day {plural} match.</p>
          <p className="text-xs text-[--color-dim]">Clear the search or kind filter to see the list.</p>
        </>
      ) : (
        <>
          <p className="text-sm text-[--color-body]">No {plural} match these filters.</p>
          <p className="text-xs text-[--color-dim]">Try clearing the search or kind.</p>
        </>
      )}
    </div>
  );
}

function computeStats(
  track: TrackConfig,
  parts: PartView[],
  get: (id: number) => ArticleState,
): SdStats {
  const stats: SdStats = {
    total: 0,
    done: 0,
    starred: 0,
    reads: 0,
    must: { total: 0, done: 0 },
    lastDay: { total: 0, done: 0 },
    byKind: Object.fromEntries(track.kinds.map((k) => [k.key, { total: 0, done: 0 }])),
  };

  for (const part of parts) {
    for (const group of part.groups) {
      for (const article of group.articles) {
        const mine = get(article.id);
        const bucket = (stats.byKind[article.kind] ??= { total: 0, done: 0 });
        stats.total += 1;
        bucket.total += 1;
        stats.reads += mine.readCount;
        if (article.importance === 'MUST') stats.must.total += 1;
        if (article.lastDay) stats.lastDay.total += 1;
        if (mine.done) {
          stats.done += 1;
          bucket.done += 1;
          if (article.importance === 'MUST') stats.must.done += 1;
          if (article.lastDay) stats.lastDay.done += 1;
        }
        if (mine.starred) stats.starred += 1;
      }
    }
  }

  return stats;
}

function filterParts(
  parts: PartView[],
  get: (id: number) => ArticleState,
  filters: SdFilterState,
  view: SdView,
): PartView[] {
  const q = filters.q.trim().toLowerCase();

  const matches = (article: ArticleView) => {
    const mine = get(article.id);
    if (view === 'starred' && !mine.starred) return false;
    if (view === 'must' && article.importance !== 'MUST') return false;
    if (view === 'lastday' && !article.lastDay) return false;
    if (filters.hideDone && mine.done) return false;
    if (filters.kind !== 'ALL' && article.kind !== filters.kind) return false;
    if (q) {
      const haystack = `${article.code} ${article.title} ${article.summary ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  };

  return parts
    .map((part) => ({
      ...part,
      groups: part.groups
        .map((group) => ({ ...group, articles: group.articles.filter(matches) }))
        .filter((group) => group.articles.length > 0),
    }))
    .filter((part) => part.groups.length > 0);
}
