'use client';

import { useEffect, useRef, useState } from 'react';
import { External, X } from '../icons';

/** What the note is about. Shared by the DSA and System Design sheets. */
export type NoteSubject = { title: string; url: string; linkLabel: string; placeholder?: string };

export function NoteDialog({
  subject,
  note,
  onClose,
  onSave,
}: {
  subject: NoteSubject;
  note: string | null;
  onClose: () => void;
  onSave: (note: string | null) => void;
}) {
  const [draft, setDraft] = useState(note ?? '');
  const [saved, setSaved] = useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const committed = useRef(note ?? '');
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    textarea.current?.focus();
    textarea.current?.setSelectionRange(draftRef.current.length, draftRef.current.length);
  }, []);

  // Debounced autosave; closing flushes whatever is still pending.
  useEffect(() => {
    if (draft === committed.current) return;
    const timer = setTimeout(() => {
      onSave(draft.trim() ? draft : null);
      committed.current = draft;
      setSaved(true);
      const clear = setTimeout(() => setSaved(false), 1600);
      return () => clearTimeout(clear);
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, onSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  function close() {
    const current = draftRef.current;
    if (current !== committed.current) onSave(current.trim() ? current : null);
    onClose();
  }

  const dirty = draft !== committed.current;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Note for ${subject.title}`}
        className="glass animate-rise flex w-full max-w-xl flex-col rounded-t-2xl sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[--color-line] px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[--color-hi]">{subject.title}</h2>
            <a
              href={subject.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[--color-dim] transition hover:text-[--color-accent-2]"
            >
              {subject.linkLabel}
              <External size={10} />
            </a>
          </div>
          <button
            onClick={close}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[--color-dim] transition hover:bg-white/5 hover:text-[--color-hi]"
          >
            <X size={16} />
          </button>
        </header>

        <textarea
          ref={textarea}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={14}
          placeholder={subject.placeholder ?? 'Approach, complexity, the edge case that got you…'}
          className="w-full flex-1 resize-none bg-transparent px-5 py-4 font-mono text-[13px] leading-relaxed text-[--color-hi] placeholder:text-[--color-dim] focus:outline-none"
        />

        <footer className="flex items-center justify-between border-t border-[--color-line] px-5 py-2.5">
          <span className="flex items-center gap-2 text-[11px] text-[--color-dim]">
            <span
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: dirty
                  ? 'var(--color-medium)'
                  : saved
                    ? 'var(--color-easy)'
                    : 'var(--color-line)',
              }}
            />
            {dirty ? 'Unsaved…' : saved ? 'Saved' : 'Autosaves as you type'}
          </span>
          <span className="flex items-center gap-3 text-[11px] text-[--color-dim]">
            <kbd className="rounded border border-[--color-line] bg-[--color-raised] px-1.5 py-0.5">
              Esc
            </kbd>
            to close
          </span>
        </footer>
      </div>
    </div>
  );
}
