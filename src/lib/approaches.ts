/**
 * Alternative ways to solve a problem that are worth tracking separately.
 *
 * The pattern-level default is deliberately conservative (memo + tabulation only); the
 * per-problem map below is the source of truth and lists every DP, graph and tree problem
 * on the sheet with exactly the approaches that genuinely exist for it. A chip you can tick
 * should never describe an approach the problem does not have.
 */
export type Approach = { key: string; label: string; title: string };

const MEMO: Approach = { key: 'memo', label: 'Memo', title: 'Recursion + memoisation (top-down)' };
const TAB: Approach = { key: 'tab', label: 'Tab', title: 'Tabulation (bottom-up)' };
const SPACE: Approach = { key: 'space', label: 'Space', title: 'Space-optimised: rolling row or O(1) variables' };
const NLOGN: Approach = { key: 'nlogn', label: 'n log n', title: 'O(n log n) patience / binary-search version' };
const GREEDY: Approach = { key: 'greedy', label: 'Greedy', title: 'Greedy or O(1)-space alternative to the DP' };

const BFS: Approach = { key: 'bfs', label: 'BFS', title: 'Breadth-first search' };
const DFS: Approach = { key: 'dfs', label: 'DFS', title: 'Depth-first search' };
const KAHN: Approach = { key: 'bfs', label: 'Kahn', title: "Kahn's algorithm (BFS, in-degrees)" };
const TDFS: Approach = { key: 'dfs', label: 'DFS', title: 'DFS with post-order / colouring' };

const MTS: Approach[] = [MEMO, TAB, SPACE];
const MT: Approach[] = [MEMO, TAB];
const M: Approach[] = [MEMO];
const MTN: Approach[] = [MEMO, TAB, NLOGN];
const MTG: Approach[] = [MEMO, TAB, GREEDY];
const GRAPH: Approach[] = [BFS, DFS];
const BFS_ONLY: Approach[] = [BFS];
const DFS_ONLY: Approach[] = [DFS];
const TOPO: Approach[] = [KAHN, TDFS];
const KAHN_ONLY: Approach[] = [KAHN];
const NONE: Approach[] = [];

/**
 * Per-problem truth, keyed by LeetCode number. A problem that appears under two patterns
 * (Coin Change is in Fundamentals and Knapsack) gets the same chips in both.
 */
export const APPROACHES_BY_PROBLEM: Record<number, Approach[]> = {
  // ── DP Fundamentals / 1D DP ───────────────────────────────────────────────
  509: MTS, // Fibonacci: two variables
  70: MTS, // Climbing Stairs
  746: MTS, // Min Cost Climbing Stairs
  198: MTS, // House Robber: prev / prev2
  213: MTS, // House Robber II: two passes of the above
  62: MTS, // Unique Paths: one row
  322: MTS, // Coin Change: 2D items×amount collapses to 1D
  300: MTN, // LIS: O(n²) dp, then patience sorting O(n log n)
  139: MT, // Word Break: dp[i] depends on arbitrary j, full array needed
  53: MTS, // Maximum Subarray: Kadane keeps one running value
  91: MTS, // Decode Ways: depends on i-1 and i-2 only
  55: MTG, // Jump Game: dp, then farthest-reach greedy O(1)
  45: MTG, // Jump Game II: O(n²) dp, then BFS-levels greedy O(n)
  152: MTS, // Max Product Subarray: running max and min
  978: MTS, // Longest Turbulent Subarray: two running lengths
  740: MTS, // Delete and Earn: reduces to House Robber
  983: MT, // Minimum Cost For Tickets: depends on day-1, -7, -30 over a 366-day table; nothing to roll

  // ── 2D / Grid DP ──────────────────────────────────────────────────────────
  63: MTS, // Unique Paths II: one row
  64: MTS, // Minimum Path Sum: one row (or in-place)
  120: MTS, // Triangle: bottom-up 1D
  221: MTS, // Maximal Square: previous row + diagonal variable
  174: MTS, // Dungeon Game: one row from the bottom-right
  741: MTS, // Cherry Pickup: dp[t][r1][r2] rolls over t
  1143: MTS, // LCS: two rows
  97: MTS, // Interleaving String: one row
  931: MTS, // Min Falling Path Sum: one row
  85: MT, // Maximal Rectangle: heights row + monotonic stack; the row is already the state

  // ── LCS family ────────────────────────────────────────────────────────────
  72: MTS, // Edit Distance: two rows
  516: MTS, // Longest Palindromic Subsequence: two rows
  1092: MT, // Shortest Common Supersequence: full table needed to rebuild the string
  115: MTS, // Distinct Subsequences: 1D, iterate j backwards
  712: MTS, // Min ASCII Delete Sum: two rows
  44: MTS, // Wildcard Matching: two rows
  10: MTS, // Regular Expression Matching: two rows
  5: MT, // Longest Palindromic Substring: O(n²) table; expand-around-centre is a different method
  1312: MTS, // Min Insertions for Palindrome: n − LPS

  // ── LIS family ────────────────────────────────────────────────────────────
  1048: MT, // Longest String Chain: dp over sorted words with a map
  673: MT, // Number of LIS: O(n²) pair of arrays
  334: [TAB, GREEDY], // Increasing Triplet: O(n²) dp or the two-variable O(1) scan
  646: MTG, // Max Length Pair Chain: dp, or greedy by end
  354: MTN, // Russian Doll Envelopes: sort, then LIS O(n²) or O(n log n)
  1027: MT, // Longest Arithmetic Subsequence: dp[i][diff]
  1187: MT, // Make Array Strictly Increasing: memo with binary search
  1827: [GREEDY], // Min Operations to Make Array Increasing: one greedy pass
  2370: MT, // Longest Ideal Subsequence: dp over 26 letters
  1691: MT, // Stacking Cuboids: sort, then O(n²) LIS

  // ── Knapsack family ───────────────────────────────────────────────────────
  416: MTS, // Partition Equal Subset Sum: 2D → 1D boolean
  518: MTS, // Coin Change II: 2D → 1D
  494: MTS, // Target Sum: subset-sum 1D
  1049: MTS, // Last Stone Weight II: subset-sum 1D
  474: MTS, // Ones and Zeroes: 3D → 2D
  377: MT, // Combination Sum IV: order matters, single 1D table is the state
  279: MTS, // Perfect Squares: unbounded knapsack 2D → 1D
  879: MTS, // Profitable Schemes: 3D → 2D
  956: MTS, // Tallest Billboard: dp over delta rolls per rod

  // ── DP on Trees ───────────────────────────────────────────────────────────
  543: MT, // Diameter: post-order DFS, or iterative post-order
  337: MT, // House Robber III: (rob, skip) pairs
  124: MT, // Maximum Path Sum
  968: MT, // Binary Tree Cameras: three states per node
  2246: MT, // Longest Path With Different Adjacent Characters
  834: MT, // Sum of Distances in Tree: two DFS passes (rerooting)
  1339: MT, // Maximum Product of Splitted Binary Tree
  1130: MTG, // Min Cost Tree From Leaf Values: interval dp, or monotonic-stack greedy
  1766: MT, // Tree of Coprimes: DFS with per-value ancestor stacks
  2421: NONE, // Number of Good Paths: sorted union-find, not a DP

  // ── Interval DP ───────────────────────────────────────────────────────────
  132: MT, // Palindrome Partitioning II
  312: MT, // Burst Balloons
  1547: MT, // Min Cost to Cut a Stick
  877: MT, // Stone Game
  664: MT, // Strange Printer
  1039: MT, // Minimum Score Triangulation
  1000: MT, // Minimum Cost to Merge Stones
  488: M, // Zuma Game: memoised search; no sensible bottom-up
  1478: MT, // Allocate Mailboxes

  // ── Bitmask DP ────────────────────────────────────────────────────────────
  78: NONE, // Subsets via bitmask: enumeration, not a DP
  698: MT, // Partition to K Equal Sum Subsets: memo over mask, or iterate masks
  847: BFS_ONLY, // Shortest Path Visiting All Nodes: BFS over (node, mask)
  1879: MT, // Minimum XOR Sum of Two Arrays
  1349: MTS, // Maximum Students Taking Exam: dp[row][mask] rolls per row
  1434: MTS, // Number of Ways to Wear Different Hats: dp[hat][mask] rolls per hat
  943: MT, // Find the Shortest Superstring: TSP over masks
  1494: MT, // Parallel Courses II: memo over mask, or iterate masks
  1799: MT, // Maximize Score After N Operations
  464: M, // Can I Win: minimax with memo; no bottom-up
  526: MT, // Beautiful Arrangement: memo over mask, or iterate masks

  // ── Digit DP ──────────────────────────────────────────────────────────────
  357: NONE, // Count Numbers with Unique Digits: closed-form counting
  902: M, // Numbers At Most N Given Digit Set
  2719: M, // Count of Integers
  600: M, // Non-negative Integers without Consecutive Ones
  233: M, // Number of Digit One
  2376: M, // Count Special Integers
  1012: M, // Numbers With Repeated Digits
  1067: M, // Digit Count in Range
  2801: M, // Count Stepping Numbers in Range
  788: M, // Rotated Digits

  // ── Graphs: BFS and DFS ───────────────────────────────────────────────────
  200: GRAPH, // Number of Islands
  733: GRAPH, // Flood Fill
  133: GRAPH, // Clone Graph
  994: BFS_ONLY, // Rotting Oranges: multi-source shortest time
  417: GRAPH, // Pacific Atlantic Water Flow
  207: GRAPH, // Course Schedule: Kahn, or DFS cycle detection
  127: BFS_ONLY, // Word Ladder: shortest transformation
  130: GRAPH, // Surrounded Regions
  1091: BFS_ONLY, // Shortest Path in Binary Matrix
  286: BFS_ONLY, // Walls and Gates: multi-source
  261: GRAPH, // Graph Valid Tree
  934: GRAPH, // Shortest Bridge: DFS to mark one island, BFS to expand it

  // ── Topological Sort ──────────────────────────────────────────────────────
  210: TOPO, // Course Schedule II
  269: TOPO, // Alien Dictionary
  310: KAHN_ONLY, // Minimum Height Trees: peel leaves layer by layer
  1462: TOPO, // Course Schedule IV: Kahn with reachability sets, or DFS memo
  329: TOPO, // Longest Increasing Path: DFS memo, or Kahn on in-degrees
  1136: TOPO, // Parallel Courses: Kahn levels, or DFS longest path
  444: KAHN_ONLY, // Sequence Reconstruction: uniqueness of the Kahn order
  1203: TOPO, // Sort Items by Groups Respecting Dependencies
  2392: TOPO, // Build a Matrix With Conditions

  // ── Trees: DFS Complete ───────────────────────────────────────────────────
  104: GRAPH, // Maximum Depth
  226: GRAPH, // Invert Binary Tree
  98: GRAPH, // Validate BST: bounds recursion, or queue of (node, lo, hi)
  235: DFS_ONLY, // LCA of BST
  236: DFS_ONLY, // LCA of Binary Tree
  105: DFS_ONLY, // Build Tree from Pre/Inorder
  297: GRAPH, // Serialize/Deserialize
  230: DFS_ONLY, // Kth Smallest in BST
  1448: GRAPH, // Count Good Nodes

  // ── Trees: BFS and Level Order ────────────────────────────────────────────
  102: GRAPH, // Level Order
  111: GRAPH, // Minimum Depth
  199: GRAPH, // Right Side View
  103: GRAPH, // Zigzag Level Order
  116: GRAPH, // Populate Next Right Pointers
  637: GRAPH, // Average of Levels
  101: GRAPH, // Symmetric Tree
  1609: GRAPH, // Even Odd Tree
  662: GRAPH, // Maximum Width
  987: GRAPH, // Vertical Order Traversal
  815: BFS_ONLY, // Bus Routes: fewest buses is a shortest path
};

/**
 * Pattern-specific exceptions, checked first. Diameter and Maximum Path Sum sit in both the
 * Trees pattern (where the question is "BFS or DFS?") and DP on Trees (where it is
 * "memo or tabulation?"), so each pattern gets its own chips for them.
 */
const OVERRIDES_BY_PATTERN: Record<number, Record<number, Approach[]>> = {
  8: { 543: DFS_ONLY, 124: DFS_ONLY },
};

/**
 * Which patterns track approaches at all, with the fallback for a problem not listed above.
 * A pattern absent here never shows chips, even if one of its problems is listed (the same
 * LeetCode number can appear under Stack or Math, where the question is different).
 */
export const APPROACHES_BY_PATTERN: Record<number, Approach[]> = {
  8: NONE, // Trees — DFS Complete (every problem listed individually)
  9: NONE, // Trees — BFS and Level Order (every problem listed individually)
  12: GRAPH,
  30: TOPO,
  16: MT,
  17: MT,
  18: MT,
  19: MT,
  20: MT,
  21: MT,
  22: MT,
  23: MT,
  24: MT,
  25: M,
};

export function approachesFor(patternId: number, lcNumber: number | null): Approach[] {
  const fallback = APPROACHES_BY_PATTERN[patternId];
  if (!fallback) return [];
  if (lcNumber !== null) {
    const specific = OVERRIDES_BY_PATTERN[patternId]?.[lcNumber];
    if (specific) return specific;
    if (APPROACHES_BY_PROBLEM[lcNumber]) return APPROACHES_BY_PROBLEM[lcNumber];
  }
  return fallback;
}
