/**
 * Unit tests for 7×7 connected-cluster win detection.
 * Run: node scripts/verify-cluster-wins.mjs
 */

import {
  findWinningClusters,
  findAllClusters,
  GRID_ROWS,
  GRID_COLS,
} from '../mock-rgs/math/clusterDetection.js';

/** Isolated filler — unique per cell so only placed symbols form clusters. */
const emptyGrid = () =>
  Array.from({ length: GRID_ROWS }, (_, row) =>
    Array.from({ length: GRID_COLS }, (_, col) => `_${row}_${col}`),
  );

const fill = (grid, row, col, symbol) => {
  grid[row][col] = symbol;
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

// ─── 5 in a horizontal row → 1 win ───────────────────────────────────────────
{
  const grid = emptyGrid();
  for (let col = 0; col < 5; col++) fill(grid, 3, col, 'H1');

  const wins = findWinningClusters(grid);
  assert(wins.length === 1, `horizontal-5: expected 1 win, got ${wins.length}`);
  assert(wins[0].symbol === 'H1', 'horizontal-5: wrong symbol');
  assert(wins[0].size === 5, `horizontal-5: expected count 5, got ${wins[0].size}`);
  assert(
    wins[0].positions.every(({ row }) => row === 3),
    'horizontal-5: all cells must share the same row',
  );
}

// ─── 4 connected → no win ────────────────────────────────────────────────────
{
  const grid = emptyGrid();
  for (let col = 0; col < 4; col++) fill(grid, 0, col, 'H2');

  const wins = findWinningClusters(grid);
  assert(wins.length === 0, `four-connected: expected 0 wins, got ${wins.length}`);
}

// ─── L-shape (5 orthogonally connected) → 1 win ──────────────────────────────
{
  const grid = emptyGrid();
  fill(grid, 2, 2, 'L3');
  fill(grid, 2, 3, 'L3');
  fill(grid, 2, 4, 'L3');
  fill(grid, 3, 2, 'L3');
  fill(grid, 4, 2, 'L3');

  const wins = findWinningClusters(grid);
  assert(wins.length === 1, `l-shape: expected 1 win, got ${wins.length}`);
  assert(wins[0].size === 5, `l-shape: expected 5 cells, got ${wins[0].size}`);
}

// ─── Diagonal line of 5 → no win (not orthogonally connected as one cluster) ─
{
  const grid = emptyGrid();
  for (let i = 0; i < 5; i++) fill(grid, i, i, 'H4');

  const wins = findWinningClusters(grid);
  assert(wins.length === 0, `diagonal-5: expected 0 wins, got ${wins.length}`);

  const clusters = findAllClusters(grid);
  const h4Clusters = clusters.filter((c) => c.symbol === 'H4');
  assert(
    h4Clusters.every((c) => c.size === 1),
    'diagonal-5: each diagonal cell must be its own size-1 cluster',
  );
}

// ─── Two separate H1 clusters of 5 → 2 wins ──────────────────────────────────
{
  const grid = emptyGrid();
  for (let col = 0; col < 5; col++) fill(grid, 1, col, 'H1');
  for (let col = 0; col < 5; col++) fill(grid, 5, col, 'H1');

  const wins = findWinningClusters(grid);
  assert(wins.length === 2, `two-clusters: expected 2 wins, got ${wins.length}`);
  assert(wins.every((w) => w.symbol === 'H1' && w.size === 5), 'two-clusters: both must be H1×5');
}

// ─── Scatter never wins as a cluster ─────────────────────────────────────────
{
  const grid = emptyGrid();
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) fill(grid, row, col, 'S');
  }

  const wins = findWinningClusters(grid);
  assert(wins.length === 0, `scatter-block: expected 0 wins, got ${wins.length}`);
}

// ─── Positions use { row, col } ──────────────────────────────────────────────
{
  const grid = emptyGrid();
  for (let col = 0; col < 5; col++) fill(grid, 4, col, 'L3');

  const wins = findWinningClusters(grid);
  assert(wins[0].positions[0].row === 4 && wins[0].positions[0].col === 0, 'positions must be {row,col}');
}

console.log('[verify-cluster-wins] all cluster detection tests passed');
