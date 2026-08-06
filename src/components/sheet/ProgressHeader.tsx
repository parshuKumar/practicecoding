'use client';

import type { Difficulty, Stats } from '@/lib/types';

const ORDER: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const COLOR: Record<Difficulty, string> = {
  EASY: 'var(--color-easy)',
  MEDIUM: 'var(--color-medium)',
  HARD: 'var(--color-hard)',
};

const LABEL: Record<Difficulty, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };

export function ProgressHeader({ stats }: { stats: Stats }) {
  const percent = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  return (
    <section className="flex flex-col items-center gap-6 rounded-lg border border-[--color-border] bg-[--color-card] px-5 py-5 sm:flex-row sm:items-center">
      <Ring percent={percent} />

      <div className="flex-1">
        <div className="text-center sm:text-left">
          <span className="text-2xl font-semibold text-white">{stats.done}</span>
          <span className="text-lg text-[--color-muted]"> / {stats.total}</span>
          <span className="ml-2 text-sm text-[--color-muted]">solved</span>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 sm:justify-start">
          {ORDER.map((d) => (
            <span key={d} className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: COLOR[d] }}
                aria-hidden="true"
              />
              <span className="text-[--color-muted]">{LABEL[d]}</span>
              <span className="text-white">{stats.byDifficulty[d].done}</span>
              <span className="text-[--color-muted]">/ {stats.byDifficulty[d].total}</span>
            </span>
          ))}
        </div>
      </div>

      {stats.starred > 0 && (
        <div className="text-center sm:text-right">
          <div className="text-lg font-semibold text-[--color-star]">★ {stats.starred}</div>
          <div className="text-xs text-[--color-muted]">to revise</div>
        </div>
      )}
    </section>
  );
}

function Ring({ percent }: { percent: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="7"
        />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 400ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
        {percent}%
      </span>
    </div>
  );
}
