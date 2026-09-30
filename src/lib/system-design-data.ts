/** Shape of data/system-design.json and data/javascript.json — the committed sources of truth. */

import type { SdImportance } from './types';

export type SdLink = { label: string; url: string };

export type SystemDesignData = {
  /** Absent in the original System Design file; the seed defaults it. */
  track?: 'system-design' | 'javascript';
  parts: { id: number; track?: string; title: string; subtitle: string | null }[];
  groups: { id: number; track?: string; partId: number; code: string; title: string }[];
  articles: {
    id: number;
    track?: string;
    groupId: number;
    code: string;
    title: string;
    slug: string;
    url: string;
    kind: string;
    importance: SdImportance;
    lastDay?: boolean;
    summary: string | null;
    links: SdLink[];
  }[];
  bookshelf: { title: string; by: string; url: string; when: string }[];
  lastDayKit?: SdLink[];
};
