'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProblemView } from '@/lib/types';

export function NoteDialog({
  problem,
  note,
  onClose,
  onSave,
}: {
  problem: ProblemView;
  note: string | null;
  onClose: () => void;
  onSave: (note: string | null) => void;
}) {
  const [draft, setDraft] = useState(note ?? '');
  const [saved, setSaved] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const initial = useRef(note ?? '');

  useEffect(() => {
    textarea.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Debounced autosave. The explicit save on close covers the last keystrokes.
  useEffect(() => {
    if (draft === initial.current) return;
    const timer = setTimeout(() => {
      onSave(draft.trim() ? draft : null);
      initial.current = draft;
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, onSave]);

  function close() {
    if (draft !== initial.current) onSave(draft.trim() ? draft : null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Note for ${problem.title}`}
        className="w-full max-w-lg rounded-lg border border-[--color-border] bg-[--color-card] shadow-xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[--color-border] px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">{problem.title}</h2>
            <p className="text-xs text-[--color-muted]">
              {problem.lcNumber !== null ? `LC ${problem.lcNumber} · ` : ''}Your note
            </p>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded p-1 text-[--color-muted] transition hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </header>

        <textarea
          ref={textarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={12}
          placeholder="Approach, edge cases, what tripped you up…"
          className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-white placeholder:text-[--color-muted] focus:outline-none"
        />

        <footer className="flex items-center justify-between border-t border-[--color-border] px-4 py-2.5">
          <span className="text-xs text-[--color-muted]">
            {saved ? 'Saved' : draft !== initial.current ? 'Unsaved…' : 'Autosaves as you type'}
          </span>
          <button
            onClick={close}
            className="rounded-md border border-[--color-border] px-3 py-1.5 text-sm text-white transition hover:border-[--color-accent]"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
