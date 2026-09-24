import { z } from 'zod';

export const patchProblemSchema = z
  .object({
    done: z.boolean().optional(),
    starred: z.boolean().optional(),
    note: z.string().max(20_000).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'patch must change at least one field' });

export type PatchProblem = z.infer<typeof patchProblemSchema>;

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Role = 'WARMUP' | 'CORE' | 'STRETCH' | 'CONTEST';

export type ProblemView = {
  id: number;
  title: string;
  lcNumber: number | null;
  url: string;
  difficulty: Difficulty;
  role: Role;
  hint: string | null;
  done: boolean;
  starred: boolean;
  note: string | null;
};

export type PatternView = {
  id: number;
  code: string;
  title: string;
  difficulty: string | null;
  timeEstimate: string | null;
  problems: ProblemView[];
};

export type PhaseView = {
  id: number;
  title: string;
  timeline: string | null;
  patterns: PatternView[];
};

export type Stats = {
  total: number;
  done: number;
  starred: number;
  byDifficulty: Record<Difficulty, { total: number; done: number }>;
};

export type SheetView = {
  phases: PhaseView[];
  stats: Stats;
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const ROLE_LABEL: Record<Role, string> = {
  WARMUP: 'Warmup',
  CORE: 'Core',
  STRETCH: 'Stretch',
  CONTEST: 'Contest',
};

// ───────────────────────── System Design ─────────────────────────

export const patchArticleSchema = z
  .object({
    done: z.boolean().optional(),
    starred: z.boolean().optional(),
    note: z.string().max(20_000).nullable().optional(),
    /** +1 for "read it again", -1 to undo a misclick. Never takes the count below zero. */
    readDelta: z.union([z.literal(1), z.literal(-1)]).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: 'patch must change at least one field' });

export type PatchArticle = z.infer<typeof patchArticleSchema>;

export type SdKind = 'FOUNDATION' | 'LLD' | 'HLD' | 'HLD_CASE' | 'LLD_CASE' | 'ADVANCED';
export type SdImportance = 'MUST' | 'CORE' | 'EXTRA';

export type ArticleLink = { label: string; url: string };

export type ArticleView = {
  id: number;
  code: string;
  title: string;
  url: string;
  kind: SdKind;
  importance: SdImportance;
  summary: string | null;
  links: ArticleLink[];
  done: boolean;
  starred: boolean;
  readCount: number;
  note: string | null;
};

export type GroupView = {
  id: number;
  code: string;
  title: string;
  articles: ArticleView[];
};

export type PartView = {
  id: number;
  title: string;
  subtitle: string | null;
  groups: GroupView[];
};

export type SdStats = {
  total: number;
  done: number;
  starred: number;
  reads: number;
  must: { total: number; done: number };
  byKind: Record<SdKind, { total: number; done: number }>;
};

export type BookshelfEntry = { title: string; by: string; url: string; when: string };

export type SystemDesignView = {
  parts: PartView[];
  stats: SdStats;
  bookshelf: BookshelfEntry[];
};

export const SD_KIND_ORDER: SdKind[] = ['FOUNDATION', 'LLD', 'HLD', 'HLD_CASE', 'LLD_CASE', 'ADVANCED'];

export const SD_KIND_LABEL: Record<SdKind, string> = {
  FOUNDATION: 'Foundation',
  LLD: 'LLD',
  HLD: 'HLD',
  HLD_CASE: 'HLD Case',
  LLD_CASE: 'LLD Case',
  ADVANCED: 'Advanced',
};

export const SD_IMPORTANCE_LABEL: Record<SdImportance, string> = {
  MUST: 'Must',
  CORE: 'Core',
  EXTRA: 'Extra',
};
