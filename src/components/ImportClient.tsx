'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ImportReport } from '@/lib/types';

type Entries = Record<string, string>;

export function ImportClient({
  bundled,
  bundledTicks,
  alreadyDone,
}: {
  bundled: Entries;
  bundledTicks: number;
  alreadyDone: number;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entries | null>(null);
  const [label, setLabel] = useState('');
  const [report, setReport] = useState<ImportReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(source: Entries, dryRun: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/import/legacy', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entries: source, dryRun }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? `request failed (${res.status})`);

      setReport(body.data as ImportReport);
      if (!dryRun) {
        router.push('/sheet');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  function preview(source: Entries, name: string) {
    setEntries(source);
    setLabel(name);
    setReport(null);
    void run(source, true);
  }

  async function onFile(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('expected a JSON object');
      }
      preview(parsed as Entries, file.name);
    } catch (err) {
      setError(`Could not read that file — ${err instanceof Error ? err.message : 'invalid JSON'}.`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-white">Import old progress</h1>
        <p className="mt-1 text-sm text-[--color-muted]">
          The original sheet stored your ticks in the browser, keyed by row position. Those keys map
          straight onto this app&apos;s problem ids, so nothing has to be matched by hand.
        </p>
      </header>

      {alreadyDone > 0 && (
        <p className="rounded-md border border-[--color-border] bg-[--color-card] px-4 py-3 text-sm">
          You already have <strong className="text-white">{alreadyDone}</strong> problems marked
          done. Importing again is safe — it only ever adds.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-md border border-[--color-hard] bg-[--color-hard]/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <section className="space-y-3 rounded-lg border border-[--color-border] bg-[--color-card] p-4">
        <h2 className="text-sm font-semibold text-white">1 · Pick your data</h2>

        <button
          onClick={() => preview(bundled, 'legacy-progress.json (bundled)')}
          disabled={busy}
          className="w-full rounded-md border border-[--color-accent] bg-[--color-accent]/10 px-4 py-3 text-left text-sm transition hover:bg-[--color-accent]/20 disabled:opacity-50"
        >
          <span className="font-medium text-white">
            Import my {bundledTicks} saved problems
          </span>
          <span className="mt-0.5 block text-xs text-[--color-muted]">
            From legacy-progress.json, rescued before the rebuild
          </span>
        </button>

        <div className="flex items-center gap-3 text-xs text-[--color-muted]">
          <span className="h-px flex-1 bg-[--color-border]" />
          or use another file
          <span className="h-px flex-1 bg-[--color-border]" />
        </div>

        <label className="block cursor-pointer rounded-md border border-dashed border-[--color-border] px-4 py-3 text-center text-sm text-[--color-muted] transition hover:border-[--color-accent]">
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          Upload a JSON file from another browser
        </label>
      </section>

      {report && entries && (
        <section className="space-y-4 rounded-lg border border-[--color-border] bg-[--color-card] p-4">
          <h2 className="text-sm font-semibold text-white">
            2 · Check what will be imported
            <span className="ml-2 font-normal text-[--color-muted]">{label}</span>
          </h2>

          <dl className="grid grid-cols-3 gap-3 text-center">
            <Stat label="matched" value={report.matched} highlight />
            <Stat label="to import" value={report.dryRun ? report.matched - report.alreadyDone : report.imported} />
            <Stat label="already done" value={report.alreadyDone} />
          </dl>

          {report.skipped.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[--color-medium]">
                {report.skipped.length} entries skipped
              </summary>
              <ul className="mt-2 space-y-1 text-[--color-muted]">
                {report.skipped.slice(0, 20).map((s) => (
                  <li key={s.key}>
                    <code>{s.key}</code> — {s.reason.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div>
            <p className="mb-2 text-xs text-[--color-muted]">
              Spot-check these — if the titles look right, the whole mapping is right.
            </p>
            <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-[--color-border] bg-black/20 p-3 text-xs">
              {report.preview.map((p) => (
                <li key={p.id} className="flex gap-3">
                  <span className="w-10 shrink-0 text-right tabular-nums text-[--color-muted]">
                    {p.id}
                  </span>
                  <span className="text-white">{p.title}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => void run(entries, false)}
            disabled={busy || report.matched === 0}
            className="w-full rounded-md bg-[--color-easy] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Importing…' : `Import ${report.matched} problems`}
          </button>
        </section>
      )}

      {busy && !report && <p className="text-sm text-[--color-muted]">Checking…</p>}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-[--color-border] px-3 py-2">
      <dd className={`text-lg font-semibold ${highlight ? 'text-[--color-accent]' : 'text-white'}`}>
        {value}
      </dd>
      <dt className="text-xs text-[--color-muted]">{label}</dt>
    </div>
  );
}
