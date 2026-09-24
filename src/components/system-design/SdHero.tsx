'use client';

import { useEffect, useRef, useState } from 'react';
import type { SdStats } from '@/lib/types';
import { SD_KIND_LABEL, SD_KIND_ORDER } from '@/lib/types';
import { Flame, Repeat, Star } from '../icons';
import { KIND_COLOR } from './ArticleRow';

function useCountUp(value: number, ms = 500) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef<number>(undefined);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    const delta = value - origin;
    if (delta === 0) return;

    const tick = (now: number) => {
      const t = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(origin + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };

    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      from.current = value;
    };
  }, [value, ms]);

  return display;
}

export function SdHero({ stats }: { stats: SdStats }) {
  const percent = stats.total === 0 ? 0 : (stats.done / stats.total) * 100;
  const shown = useCountUp(stats.done);
  const reads = useCountUp(stats.reads);

  return (
    <section className="glass animate-rise relative overflow-hidden rounded-2xl p-6 sm:p-7">
      <div className="dotgrid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-[--color-accent-2] opacity-[0.07] blur-3xl" />

      <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:gap-9">
        <Ring percent={percent} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-center gap-2 sm:justify-start">
            <span className="tnum text-4xl font-semibold tracking-tight text-[--color-hi]">
              {shown}
            </span>
            <span className="tnum text-xl text-[--color-dim]">/ {stats.total}</span>
            <span className="ml-1 text-sm text-[--color-dim]">articles read</span>
          </div>

          <div className="mt-5 grid gap-x-5 gap-y-3 sm:grid-cols-3">
            {SD_KIND_ORDER.map((k) => (
              <Meter
                key={k}
                label={SD_KIND_LABEL[k]}
                color={KIND_COLOR[k]}
                done={stats.byKind[k].done}
                total={stats.byKind[k].total}
              />
            ))}
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2 sm:grid-cols-1">
          <Tile
            icon={<Flame filled size={15} />}
            color="var(--color-hard)"
            value={`${stats.must.done}/${stats.must.total}`}
            label="must-read"
            title="Must-read articles finished"
          />
          <Tile
            icon={<Repeat size={15} />}
            color="var(--color-accent-2)"
            value={String(reads)}
            label="total reads"
            title="Every pass over every article, added up"
          />
          <Tile
            icon={<Star filled size={15} />}
            color="var(--color-star)"
            value={String(stats.starred)}
            label="starred"
            title="Starred to revisit"
          />
        </div>
      </div>
    </section>
  );
}

function Tile({
  icon,
  color,
  value,
  label,
  title,
}: {
  icon: React.ReactNode;
  color: string;
  value: string;
  label: string;
  title: string;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-xl border border-[--color-line] bg-black/25 px-4 py-2.5 sm:flex-row sm:gap-3 sm:px-4"
      title={title}
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full"
        style={{ color, backgroundColor: `color-mix(in oklab, ${color} 15%, transparent)` }}
      >
        {icon}
      </span>
      <div className="flex flex-col items-center sm:items-start">
        <span className="tnum text-base font-semibold leading-tight text-[--color-hi]">{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-[--color-dim]">{label}</span>
      </div>
    </div>
  );
}

function Meter({
  label,
  color,
  done,
  total,
}: {
  label: string;
  color: string;
  done: number;
  total: number;
}) {
  const percent = total === 0 ? 0 : (done / total) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <span className="tnum text-xs text-[--color-dim]">
          <span className="text-[--color-body]">{done}</span> / {total}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[--color-line]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg width="116" height="116" viewBox="0 0 116 116" className="-rotate-90">
        <defs>
          <linearGradient id="sd-ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-2)" />
            <stop offset="100%" stopColor="var(--color-accent)" />
          </linearGradient>
        </defs>
        <circle cx="58" cy="58" r={r} fill="none" stroke="var(--color-line)" strokeWidth="9" />
        <circle
          cx="58"
          cy="58"
          r={r}
          fill="none"
          stroke="url(#sd-ring-grad)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (percent / 100) * c}
          className="ring-glow"
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tnum gradient-text text-2xl font-bold">{Math.round(percent)}%</span>
        <span className="text-[10px] uppercase tracking-widest text-[--color-dim]">read</span>
      </div>
    </div>
  );
}
