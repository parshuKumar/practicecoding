'use client';

import { useEffect } from 'react';
import { X } from '../icons';

const SHORTCUTS: [string, string][] = [
  ['/', 'Focus search'],
  ['j  ↓', 'Next problem'],
  ['k  ↑', 'Previous problem'],
  ['x', 'Toggle done'],
  ['s', 'Toggle star'],
  ['n', 'Open note'],
  ['r', 'Jump to a random unsolved problem'],
  ['e', 'Expand / collapse all patterns'],
  ['1 2 3 0', 'Filter easy / medium / hard / all'],
  ['?', 'This help'],
  ['Esc', 'Close, or clear search'],
];

export function ShortcutsOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="glass animate-rise w-full max-w-md rounded-2xl p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[--color-hi]">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-[--color-dim] transition hover:bg-white/5 hover:text-[--color-hi]"
          >
            <X size={16} />
          </button>
        </div>

        <dl className="space-y-1.5">
          {SHORTCUTS.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-4 text-sm">
              <dd className="text-[--color-body]">{label}</dd>
              <dt className="flex shrink-0 gap-1">
                {keys.split(/\s+/).map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[22px] rounded-md border border-[--color-line] bg-[--color-raised] px-1.5 py-0.5 text-center text-[11px] text-[--color-dim]"
                  >
                    {k}
                  </kbd>
                ))}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
