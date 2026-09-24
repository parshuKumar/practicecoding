'use client';

import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ArticleView, SdImportance, SdKind } from '@/lib/types';
import { SD_IMPORTANCE_LABEL, SD_KIND_LABEL } from '@/lib/types';
import { Check, External, Flame, Link, Minus, Note, Plus, Star } from '../icons';
import type { ArticleState } from './SdClient';

export const KIND_COLOR: Record<SdKind, string> = {
  FOUNDATION: 'var(--color-warmup)',
  LLD: 'var(--color-core)',
  HLD: 'var(--color-accent-2)',
  HLD_CASE: 'var(--color-stretch)',
  LLD_CASE: 'var(--color-contest)',
  ADVANCED: 'var(--color-medium)',
};

export const IMPORTANCE_COLOR: Record<SdImportance, string> = {
  MUST: 'var(--color-hard)',
  CORE: 'var(--color-body)',
  EXTRA: 'var(--color-dim)',
};

/**
 * Memoised like ProblemRow: a tick rebuilds the state Map but untouched rows keep the
 * same ArticleState reference, so only the changed row re-renders.
 */
export const ArticleRow = memo(function ArticleRow({
  article,
  state,
  active,
  onToggleDone,
  onToggleStar,
  onBumpRead,
  onOpenNote,
}: {
  article: ArticleView;
  state: ArticleState;
  active: boolean;
  onToggleDone: (id: number, done: boolean) => void;
  onToggleStar: (id: number, starred: boolean) => void;
  onBumpRead: (id: number, delta: 1 | -1) => void;
  onOpenNote: (article: ArticleView) => void;
}) {
  const hasNote = Boolean(state.note?.trim());
  const must = article.importance === 'MUST';

  return (
    <li
      id={`article-${article.id}`}
      className={`group relative flex items-center gap-2.5 px-3 py-[7px] transition-colors sm:gap-3 sm:px-4 ${
        active ? 'bg-[--color-accent]/[0.07]' : 'hover:bg-white/[0.025]'
      }`}
    >
      {active && (
        <span className="absolute inset-y-0 left-0 w-[2px] bg-linear-to-b from-[--color-accent] to-[--color-accent-2]" />
      )}

      <Checkbox
        checked={state.done}
        label={`Mark ${article.title} as read`}
        onChange={(v) => onToggleDone(article.id, v)}
      />

      <span className="tnum w-6 shrink-0 text-right text-[11px] text-[--color-dim]">
        {article.code}
      </span>

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        title={article.summary ?? undefined}
        className={`min-w-0 flex-1 truncate text-[13.5px] transition ${
          state.done
            ? 'text-[--color-dim] line-through decoration-[--color-dim]/50'
            : 'text-[--color-body] hover:text-[--color-hi]'
        }`}
      >
        {must && (
          <Flame
            filled
            size={12}
            className="mr-1.5 inline-block align-[-1.5px] text-[--color-hard]"
          />
        )}
        {article.title}
        <External
          size={11}
          className="ml-1.5 inline-block align-[-1px] text-[--color-dim] opacity-0 transition group-hover:opacity-100"
        />
      </a>

      <span
        className="hidden shrink-0 truncate text-[11px] text-[--color-dim] lg:block lg:max-w-[220px] xl:max-w-[300px]"
        title={article.summary ?? undefined}
      >
        {article.summary}
      </span>

      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:block"
        style={{
          color: IMPORTANCE_COLOR[article.importance],
          backgroundColor: `color-mix(in oklab, ${IMPORTANCE_COLOR[article.importance]} 13%, transparent)`,
        }}
        title={
          must
            ? 'Must read: asked in almost every interview'
            : article.importance === 'CORE'
              ? 'Core: expected knowledge'
              : 'Extra: good to know'
        }
      >
        {SD_IMPORTANCE_LABEL[article.importance]}
      </span>

      <span
        className="hidden shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:block"
        style={{
          color: KIND_COLOR[article.kind],
          backgroundColor: `color-mix(in oklab, ${KIND_COLOR[article.kind]} 13%, transparent)`,
        }}
      >
        {SD_KIND_LABEL[article.kind]}
      </span>

      {article.links.length > 0 && <LinksMenu article={article} />}

      <ReadCounter
        count={state.readCount}
        title={article.title}
        onBump={(delta) => onBumpRead(article.id, delta)}
      />

      <div className="flex shrink-0 items-center">
        <button
          onClick={() => onOpenNote(article)}
          title={hasNote ? 'Edit note (n)' : 'Add note (n)'}
          aria-label={hasNote ? `Edit note for ${article.title}` : `Add note for ${article.title}`}
          className={`rounded-md p-1.5 transition hover:bg-white/[0.06] ${
            hasNote
              ? 'text-[--color-accent-2]'
              : 'text-[--color-dim] opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <Note size={15} filled={hasNote} />
        </button>

        <button
          onClick={() => onToggleStar(article.id, !state.starred)}
          title={state.starred ? 'Unstar (s)' : 'Star to revisit (s)'}
          aria-label={state.starred ? `Unstar ${article.title}` : `Star ${article.title}`}
          aria-pressed={state.starred}
          className={`rounded-md p-1.5 transition hover:bg-white/[0.06] ${
            state.starred
              ? 'text-[--color-star]'
              : 'text-[--color-dim] opacity-0 hover:text-[--color-star] group-hover:opacity-100 focus-visible:opacity-100'
          }`}
        >
          <Star size={15} filled={state.starred} className={state.starred ? 'animate-pop' : ''} />
        </button>
      </div>
    </li>
  );
});

/**
 * The read counter. Click "+" for another pass; shift-click (or the "-" key on the
 * focused row) takes one back. Read zero times renders dim so unread rows stay quiet.
 */
function ReadCounter({
  count,
  title,
  onBump,
}: {
  count: number;
  title: string;
  onBump: (delta: 1 | -1) => void;
}) {
  const [pop, setPop] = useState(0);
  const read = count > 0;

  return (
    <span
      className="flex shrink-0 items-center overflow-hidden rounded-md border text-[11px] transition"
      style={{
        borderColor: read ? 'color-mix(in oklab, var(--color-accent) 45%, transparent)' : 'var(--color-line)',
        backgroundColor: read ? 'color-mix(in oklab, var(--color-accent) 10%, transparent)' : 'transparent',
      }}
      title={`Read ${count} ${count === 1 ? 'time' : 'times'}`}
    >
      <button
        onClick={() => {
          if (count === 0) return;
          onBump(-1);
        }}
        aria-label={`Remove one read of ${title}`}
        disabled={count === 0}
        className="hidden h-6 w-5 place-items-center text-[--color-dim] transition hover:bg-white/[0.06] hover:text-[--color-hi] disabled:pointer-events-none disabled:opacity-30 group-hover:grid"
      >
        <Minus size={11} />
      </button>
      <span
        key={pop}
        className={`tnum min-w-[22px] px-1 text-center font-semibold ${
          read ? 'text-[--color-hi] animate-pop' : 'text-[--color-dim]'
        }`}
      >
        {count}
      </span>
      <button
        onClick={(e) => {
          if (e.shiftKey) {
            if (count > 0) onBump(-1);
            return;
          }
          setPop((n) => n + 1);
          onBump(1);
        }}
        aria-label={`Add one read of ${title}`}
        title="Read it again (+). Shift-click to undo."
        className="grid h-6 w-6 place-items-center border-l text-[--color-dim] transition hover:bg-[--color-accent]/20 hover:text-[--color-hi]"
        style={{ borderColor: 'inherit' }}
      >
        <Plus size={12} />
      </button>
    </span>
  );
}

/**
 * Curated outside reading for this topic, in a small popover.
 *
 * Rendered through a portal with fixed positioning: the group and part cards clip their
 * overflow for the rounded corners, so an in-flow menu under the last row of a group was
 * cut off. It flips above the button when there is no room below.
 */
function LinksMenu({ article }: { article: ArticleView }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  const MENU_WIDTH = 288; // w-72
  const ROW_HEIGHT = 36;
  const GAP = 4;

  useLayoutEffect(() => {
    if (!open || !button.current) return;

    const place = () => {
      const rect = button.current!.getBoundingClientRect();
      const estimated = article.links.length * ROW_HEIGHT + 32;
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = Math.max(8, window.innerWidth - rect.right);
      // Keep the menu on screen on narrow viewports.
      const clampedRight = Math.min(right, window.innerWidth - MENU_WIDTH - 8);

      if (spaceBelow < estimated + GAP && rect.top > spaceBelow) {
        setPos({ bottom: window.innerHeight - rect.top + GAP, right: Math.max(8, clampedRight) });
      } else {
        setPos({ top: rect.bottom + GAP, right: Math.max(8, clampedRight) });
      }
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, article.links.length]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!button.current?.contains(target) && !menu.current?.contains(target)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={button}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`${article.links.length} extra ${article.links.length === 1 ? 'link' : 'links'}`}
        aria-label={`Extra reading for ${article.title}`}
        className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition hover:bg-white/[0.06] ${
          open ? 'text-[--color-accent-2]' : 'text-[--color-dim] hover:text-[--color-hi]'
        }`}
      >
        <Link size={13} />
        <span className="tnum">{article.links.length}</span>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            className="glass animate-rise fixed z-50 w-72 overflow-hidden rounded-xl p-1"
            style={pos}
          >
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] uppercase tracking-wider text-[--color-dim]">
              Extra reading
            </p>
            {article.links.map((link) => (
              <a
                key={link.url}
                role="menuitem"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[12.5px] text-[--color-body] transition hover:bg-white/[0.05] hover:text-[--color-hi]"
              >
                <span className="truncate">{link.label}</span>
                <External size={11} className="shrink-0 text-[--color-dim]" />
              </a>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function Checkbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[5px] border transition ${
        checked
          ? 'border-[--color-easy] bg-[--color-easy] text-[--color-base]'
          : 'border-[--color-line] bg-transparent hover:border-[--color-easy]'
      }`}
    >
      {checked && <Check size={11} />}
    </button>
  );
}
