export function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : (done / total) * 100;
  const complete = done === total && total > 0;

  return (
    <span className="flex shrink-0 items-center gap-2.5">
      <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[--color-border] sm:block">
        <span
          className="block h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: complete ? 'var(--color-easy)' : 'var(--color-accent)',
          }}
        />
      </span>
      <span className="w-14 text-right text-xs tabular-nums text-[--color-muted]">
        {done} / {total}
      </span>
    </span>
  );
}
