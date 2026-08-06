'use client';

import { useEffect } from 'react';
import { X } from '../icons';

export type ToastMessage = { id: number; text: string; tone: 'error' | 'info' };

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.tone === 'error' ? 6000 : 2600);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const accent = toast.tone === 'error' ? 'var(--color-hard)' : 'var(--color-accent)';

  return (
    <div
      role="status"
      className="animate-toast pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm shadow-2xl backdrop-blur-xl"
      style={{
        borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${accent} 12%, var(--color-surface))`,
        color: 'var(--color-hi)',
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      {toast.text}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="ml-1 rounded p-0.5 text-[--color-dim] transition hover:text-[--color-hi]"
      >
        <X size={13} />
      </button>
    </div>
  );
}
