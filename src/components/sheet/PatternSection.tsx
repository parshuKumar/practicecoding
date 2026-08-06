'use client';

import { useEffect, useState } from 'react';
import type { PatternView, ProblemView } from '@/lib/types';
import type { UserState } from './SheetClient';
import { ProblemRow } from './ProblemRow';
import { ProgressBar } from './ProgressBar';

const STORAGE_KEY = 'dsa-collapsed-patterns';

/** Collapsed state is a UI preference, not data — localStorage is the right home for it. */
function useCollapsed(id: number) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCollapsed(JSON.parse(raw).includes(id));
    } catch {
      /* corrupt or unavailable storage is not worth handling */
    }
  }, [id]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list: number[] = raw ? JSON.parse(raw) : [];
        const updated = next ? [...new Set([...list, id])] : list.filter((x) => x !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return [collapsed, toggle] as const;
}

export function PatternSection({
  pattern,
  get,
  onToggleDone,
  onToggleStar,
  onOpenNote,
}: {
  pattern: PatternView;
  get: (id: number) => UserState;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onOpenNote: (problem: ProblemView) => void;
}) {
  const [collapsed, toggle] = useCollapsed(pattern.id);
  const done = pattern.problems.filter((p) => get(p.id).done).length;

  return (
    <div className="bg-black/10">
      <button
        onClick={toggle}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-3 px-4 py-2.5 pl-8 text-left transition hover:bg-white/[0.02]"
      >
        <span className="text-xs text-[--color-muted]">{collapsed ? '▸' : '▾'}</span>
        <h3 className="flex-1 text-sm text-white">
          <span className="text-[--color-muted]">{pattern.code}</span> — {pattern.title}
          {pattern.timeEstimate && (
            <span className="ml-2 hidden text-xs text-[--color-muted] md:inline">
              {pattern.timeEstimate}
            </span>
          )}
        </h3>
        <ProgressBar done={done} total={pattern.problems.length} />
      </button>

      {!collapsed && (
        <ul className="border-t border-[--color-border]/60">
          {pattern.problems.map((problem) => (
            <ProblemRow
              key={problem.id}
              problem={problem}
              state={get(problem.id)}
              onToggleDone={onToggleDone}
              onToggleStar={onToggleStar}
              onOpenNote={onOpenNote}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
