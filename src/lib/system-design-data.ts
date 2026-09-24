/** Shape of data/system-design.json — the committed source of truth for the curriculum. */

import type { SdImportance, SdKind } from './types';

export type SdLink = { label: string; url: string };

export type SystemDesignData = {
  parts: { id: number; title: string; subtitle: string | null }[];
  groups: { id: number; partId: number; code: string; title: string }[];
  articles: {
    id: number;
    groupId: number;
    code: string;
    title: string;
    slug: string;
    url: string;
    kind: SdKind;
    importance: SdImportance;
    summary: string | null;
    links: SdLink[];
  }[];
  bookshelf: { title: string; by: string; url: string; when: string }[];
};
