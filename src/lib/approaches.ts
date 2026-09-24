/**
 * Alternative ways to solve a problem that are worth tracking separately.
 * Keyed by Pattern.id. Problems in any other pattern have no approach ticks.
 */
export type Approach = { key: string; label: string; title: string };

const DP: Approach[] = [
  { key: 'memo', label: 'Memo', title: 'Recursion + memoisation (top-down)' },
  { key: 'tab', label: 'Tab', title: 'Tabulation (bottom-up)' },
  { key: 'space', label: 'Space', title: 'Space-optimised tabulation' },
];

const GRAPH: Approach[] = [
  { key: 'bfs', label: 'BFS', title: 'Breadth-first search' },
  { key: 'dfs', label: 'DFS', title: 'Depth-first search' },
];

const TOPO: Approach[] = [
  { key: 'bfs', label: 'Kahn', title: "Kahn's algorithm (BFS, in-degrees)" },
  { key: 'dfs', label: 'DFS', title: 'DFS with post-order / colouring' },
];

export const APPROACHES_BY_PATTERN: Record<number, Approach[]> = {
  12: GRAPH, // Graphs — BFS and DFS
  30: TOPO, // Topological Sort
  16: DP,
  17: DP,
  18: DP,
  19: DP,
  20: DP,
  21: DP,
  22: DP,
  23: DP,
  24: DP,
  25: DP,
};

export function approachesFor(patternId: number): Approach[] {
  return APPROACHES_BY_PATTERN[patternId] ?? [];
}
