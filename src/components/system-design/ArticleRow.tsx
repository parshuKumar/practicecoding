'use client';

import { memo, useState } from 'react';
import type { ArticleView, SdImportance, SdKind } from '@/lib/types';
import { SD_IMPORTANCE_LABEL, SD_KIND_LABEL } from '@/lib/types';
import { Check, External, Flame, Minus, Note, Plus, Star } from '../icons';
import { LinksMenu } from '../LinksMenu';
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
  const kindColor = KIND_COLOR[article.kind];

  return (
    <li
      id={`article-${article.id}`}
      className={`group relative flex items-center gap-2.5 px-3 py-[7px] transition-colors sm:gap-3 sm:px-4 ${
        active ? 'bg-[--color-accent]/[0.07]' : 'hover:bg-white/[0.025]'
      }`}
    >
      {/* Kind hairline: lets a mixed list be scanned by colour. */}
      <span
        className="absolute inset-y-[7px] left-0 w-[2px] rounded-r"
        style={{
          background: active ? 'linear-gradient(var(--color-accent), var(--color-accent-2))' : kindColor,
          opacity: active ? 1 : 0.55,
        }}
      />

      <Checkbox
        checked={state.done}
        label={`Mark ${article.title} as read`}
        onChange={(v) => onToggleDone(article.id, v)}
      />

      <span className="mono w-6 shrink-0 text-right text-[11px] text-[--color-dim]">
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
          color: kindColor,
          backgroundColor: `color-mix(in oklab, ${kindColor} 13%, transparent)`,
        }}
      >
        {SD_KIND_LABEL[article.kind]}
      </span>

      <LinksMenu
        links={article.links}
        heading="Extra reading"
        ariaLabel={`Extra reading for ${article.title}`}
      />

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
 * The read counter as a stepper: minus, three dots that fill as you re-read, the count,
 * plus. Always visible, so it works on touch too. Minus is disabled at zero.
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
  const border = read ? 'color-mix(in oklab, var(--color-accent) 45%, transparent)' : 'var(--color-line)';

  return (
    <span
      className="flex h-6 shrink-0 items-center overflow-hidden rounded-md border text-[11px] transition"
      style={{
        borderColor: border,
        backgroundColor: read ? 'color-mix(in oklab, var(--color-accent) 10%, transparent)' : 'transparent',
      }}
      title={`Read ${count} ${count === 1 ? 'time' : 'times'}`}
    >
      <button
        onClick={() => onBump(-1)}
        aria-label={`Remove one read of ${title}`}
        disabled={count === 0}
        className="grid h-6 w-5 place-items-center text-[--color-dim] transition hover:bg-white/[0.06] hover:text-[--color-hi] disabled:pointer-events-none disabled:opacity-30"
      >
        <Minus size={11} />
      </button>
      <span className="flex items-center gap-[3px] pl-1 pr-1.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="h-[5px] w-[5px] rounded-full transition-colors"
            style={{ backgroundColor: count >= n ? 'var(--color-accent)' : 'var(--color-line)' }}
          />
        ))}
      </span>
      <span
        key={pop}
        className={`mono min-w-[14px] text-center font-semibold ${
          read ? 'animate-pop text-[--color-hi]' : 'text-[--color-dim]'
        }`}
      >
        {count}
      </span>
      <button
        onClick={() => {
          setPop((n) => n + 1);
          onBump(1);
        }}
        aria-label={`Add one read of ${title}`}
        title="Read it again (+)"
        className="grid h-6 w-6 place-items-center border-l text-[--color-dim] transition hover:bg-[--color-accent]/20 hover:text-[--color-hi]"
        style={{ borderColor: border }}
      >
        <Plus size={12} />
      </button>
    </span>
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
