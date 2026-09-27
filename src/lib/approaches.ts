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

const BFS_ONLY: Approach[] = [GRAPH[0]];
const DFS_ONLY: Approach[] = [GRAPH[1]];

/**
 * Per-problem overrides, keyed by LeetCode number. Used for the two tree patterns, where
 * the sensible traversal differs question by question: a diameter is DFS-only, Bus Routes
 * is BFS-only, level order can be done either way.
 */
export const APPROACHES_BY_PROBLEM: Record<number, Approach[]> = {
  // 08 Trees — DFS Complete
  104: GRAPH, // Maximum Depth: recursive height, or count BFS levels
  226: GRAPH, // Invert Binary Tree: recursive swap, or queue swap
  543: DFS_ONLY, // Diameter of Binary Tree
  98: GRAPH, // Validate BST: bounds recursion, or queue of (node, lo, hi)
  235: DFS_ONLY, // LCA of BST: directional descent
  236: DFS_ONLY, // LCA of Binary Tree: post-order
  124: DFS_ONLY, // Maximum Path Sum
  105: DFS_ONLY, // Build Tree from Pre/Inorder
  297: GRAPH, // Serialize/Deserialize: preorder, or level order
  230: DFS_ONLY, // Kth Smallest in BST: inorder
  1448: GRAPH, // Count Good Nodes: carry max down recursively, or queue of (node, max)
  // 09 Trees — BFS and Level Order
  102: GRAPH, // Level Order: queue, or DFS with depth index
  111: GRAPH, // Minimum Depth: BFS stops at first leaf, or DFS min over leaves
  199: GRAPH, // Right Side View: last of each level, or right-first DFS by depth
  103: GRAPH, // Zigzag: BFS with reverse, or depth-indexed DFS
  116: GRAPH, // Populate Next Right: level queue, or recursion via next pointers
  637: GRAPH, // Average of Levels: per-level sums either way
  101: GRAPH, // Symmetric Tree: mirror recursion, or queue of pairs
  1609: GRAPH, // Even Odd Tree: level queue, or DFS tracking last value per level
  662: GRAPH, // Maximum Width: BFS with indices, or DFS with first index per level
  987: GRAPH, // Vertical Order: collect (col, row, val) either way, then sort
  815: BFS_ONLY, // Bus Routes: fewest buses is a shortest path
};

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

export function approachesFor(patternId: number, lcNumber: number | null): Approach[] {
  if (lcNumber !== null && APPROACHES_BY_PROBLEM[lcNumber]) return APPROACHES_BY_PROBLEM[lcNumber];
  return APPROACHES_BY_PATTERN[patternId] ?? [];
}
