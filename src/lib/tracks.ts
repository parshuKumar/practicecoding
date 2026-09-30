/**
 * A reading sheet is a "track": a set of parts → groups → articles stored in the shared
 * Sd* tables and told apart by the `track` column. Everything that differs between tracks
 * in the UI (route, labels, the kinds and their colours) lives here, so adding a sheet is
 * a JSON file plus one entry in this list.
 */

export type TrackKey = 'system-design' | 'javascript';

export type KindDef = { key: string; label: string; color: string };

export type TrackConfig = {
  key: TrackKey;
  /** URL path of the tab. */
  path: string;
  /** Header tab label. */
  tab: string;
  /** Sheet title used in copy and error states. */
  title: string;
  /** What one row is called, singular and plural. */
  noun: [string, string];
  /** Kinds in display order; the filter chips and hero meters follow this. */
  kinds: KindDef[];
  /** Label for the note dialog's link back to the article. */
  noteLink: (code: string) => string;
  /** Placeholder text for a new note. */
  notePlaceholder: string;
  /** Where the articles come from, for the README-ish copy in empty states. */
  source: string;
};

export const TRACKS: Record<TrackKey, TrackConfig> = {
  'system-design': {
    key: 'system-design',
    path: '/system-design',
    tab: 'System Design',
    title: 'System Design',
    noun: ['article', 'articles'],
    kinds: [
      { key: 'FOUNDATION', label: 'Foundation', color: 'var(--color-warmup)' },
      { key: 'LLD', label: 'LLD', color: 'var(--color-core)' },
      { key: 'HLD', label: 'HLD', color: 'var(--color-accent-2)' },
      { key: 'HLD_CASE', label: 'HLD Case', color: 'var(--color-stretch)' },
      { key: 'LLD_CASE', label: 'LLD Case', color: 'var(--color-contest)' },
      { key: 'ADVANCED', label: 'Advanced', color: 'var(--color-medium)' },
    ],
    noteLink: (code) => `Article ${code} on GitHub`,
    notePlaceholder: 'Key idea, the trade-off to remember, what to say in an interview…',
    source: 'your System Design notes on GitHub',
  },
  javascript: {
    key: 'javascript',
    path: '/javascript',
    tab: 'JavaScript',
    title: 'JavaScript',
    noun: ['topic', 'topics'],
    kinds: [
      { key: 'CORE', label: 'Core', color: 'var(--color-warmup)' },
      { key: 'FUNCTIONS', label: 'Functions', color: 'var(--color-core)' },
      { key: 'DATA', label: 'Data', color: 'var(--color-accent-2)' },
      { key: 'OOP', label: 'OOP', color: 'var(--color-stretch)' },
      { key: 'ASYNC', label: 'Async', color: 'var(--color-contest)' },
      { key: 'BROWSER', label: 'Browser', color: 'var(--color-medium)' },
      { key: 'INTERVIEW', label: 'Interview', color: 'var(--color-hard)' },
    ],
    noteLink: (code) => `Topic ${code}: open the doc`,
    notePlaceholder: 'The one-line definition, the gotcha, the snippet you would write on a whiteboard…',
    source: 'your JS docs, the Namaste JavaScript notes and javascript.info',
  },
};

export const TRACK_ORDER: TrackKey[] = ['system-design', 'javascript'];

export function isTrackKey(value: string): value is TrackKey {
  return value in TRACKS;
}

export function kindColor(track: TrackConfig, kind: string): string {
  return track.kinds.find((k) => k.key === kind)?.color ?? 'var(--color-dim)';
}

export function kindLabel(track: TrackConfig, kind: string): string {
  return track.kinds.find((k) => k.key === kind)?.label ?? kind;
}
