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
