'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="glass mx-auto mt-10 max-w-md rounded-2xl px-6 py-10 text-center">
      <h2 className="text-sm font-semibold text-[--color-hi]">Could not load the sheet</h2>
      <p className="mt-2 text-xs text-[--color-dim]">
        The database may be waking up. Give it a second and try again.
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg border border-[--color-accent] bg-[--color-accent]/10 px-4 py-2 text-sm text-[--color-hi] transition hover:bg-[--color-accent]/20"
      >
        Retry
      </button>
    </div>
  );
}
