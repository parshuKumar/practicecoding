'use client';

import type { BookshelfEntry } from '@/lib/types';
import { Book, External } from '../icons';

/** The handful of sources the per-article links are drawn from, listed once. */
export function Bookshelf({ entries }: { entries: BookshelfEntry[] }) {
  return (
    <section className="glass overflow-hidden rounded-2xl">
      <header className="flex items-center gap-3 border-b border-[--color-line] px-4 py-3.5 sm:px-5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[--color-line] bg-black/20 text-[--color-accent-2]">
          <Book size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[--color-hi]">BOOKSHELF</h2>
          <p className="text-[11px] text-[--color-dim]">
            Where the extra links come from, and when to reach for each.
          </p>
        </div>
      </header>

      <ul className="grid gap-2 p-2 sm:grid-cols-2 sm:p-3 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.url}>
            <a
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col gap-1 rounded-xl border border-[--color-line-soft] bg-black/20 px-3.5 py-3 transition hover:border-[--color-accent] hover:bg-white/[0.02]"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="text-[13px] font-medium text-[--color-hi]">{entry.title}</span>
                <External
                  size={11}
                  className="mt-1 shrink-0 text-[--color-dim] opacity-0 transition group-hover:opacity-100"
                />
              </span>
              <span className="text-[11px] text-[--color-dim]">{entry.by}</span>
              <span className="mt-1 text-[12px] leading-relaxed text-[--color-body]">
                {entry.when}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
