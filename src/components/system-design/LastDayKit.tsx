'use client';

import type { ArticleLink } from '@/lib/types';
import { External, Moon } from '../icons';

/**
 * The night-before kit: a handful of cheat sheets and drills to open alongside the
 * last-day list. Shown above the list in the Last day view.
 */
export function LastDayKit({
  links,
  left,
  total,
}: {
  links: ArticleLink[];
  left: number;
  total: number;
}) {
  return (
    <section className="glass animate-rise relative overflow-hidden rounded-2xl border-[--color-accent-2]/30 p-4 sm:p-5">
      <div className="pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-[--color-accent-2] opacity-[0.08] blur-3xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[--color-accent-2]/15 text-[--color-accent-2]">
            <Moon size={17} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-[--color-hi]">Last-day revision</h2>
            <p className="text-[11px] text-[--color-dim]">
              {left === 0
                ? `All ${total} on the list are read. Open the kit and drill.`
                : `${left} of ${total} still unread. Read those first, then drill with the kit.`}
            </p>
          </div>
        </div>

        {links.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 sm:ml-auto">
            {links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-[--color-line] bg-[--color-surface] px-2.5 py-1.5 text-xs text-[--color-body] transition hover:border-[--color-accent-2] hover:text-[--color-hi]"
                >
                  {link.label}
                  <External size={10} className="text-[--color-dim]" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
