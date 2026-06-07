/**
 * 7×7 connected-cluster detection (pure grid math).
 *
 * Grid layout: `grid[row][col]` — row 0 is the top visible row, col 0 is the
 * leftmost column. Symbols are case-insensitive strings or `{ name: string }`.
 *
 * Win rule: ≥ MIN_CLUSTER_SIZE orthogonally adjacent cells (no diagonals)
 * of the same paying symbol. Scatter (`S`) never forms a cluster win.
 */

export const GRID_ROWS = 7;
export const GRID_COLS = 7;
export const MIN_CLUSTER_SIZE = 5;

/** @typedef {{ row: number, col: number }} GridPosition */
/** @typedef {{ symbol: string, size: number, positions: GridPosition[] }} Cluster */

import { isGridSymbol } from './symbols.js';

const ORTHOGONAL = [[0, 1], [0, -1], [1, 0], [-1, 0]];

const cellKey = (row, col) => `${row},${col}`;

/** @param {string | { name?: string }} cell */
export const normalizeSymbol = (cell) => {
  if (cell == null) return '';
  if (typeof cell === 'string') return cell.toUpperCase();
  return (cell.name ?? '').toUpperCase();
};

/**
 * @param {Array<Array<string | { name?: string }>>} grid
 * @param {number} row
 * @param {number} col
 */
export const getCellSymbol = (grid, row, col) => normalizeSymbol(grid[row]?.[col]);

/**
 * Flood-fill (BFS) every orthogonally connected group on the grid.
 *
 * @param {Array<Array<string | { name?: string }>>} grid
 * @param {number} [rows=GRID_ROWS]
 * @param {number} [cols=GRID_COLS]
 * @returns {Cluster[]}
 */
export const findAllClusters = (grid, rows = GRID_ROWS, cols = GRID_COLS) => {
  const visited = new Set();
  /** @type {Cluster[]} */
  const clusters = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const key = cellKey(row, col);
      if (visited.has(key)) continue;

      const symbol = getCellSymbol(grid, row, col);
      if (!symbol || symbol === 'S' || !isGridSymbol(symbol)) {
        visited.add(key);
        continue;
      }

      /** @type {GridPosition[]} */
      const positions = [];
      const queue = [{ row, col }];
      visited.add(key);

      while (queue.length) {
        const current = queue.shift();
        positions.push(current);

        for (const [dRow, dCol] of ORTHOGONAL) {
          const nextRow = current.row + dRow;
          const nextCol = current.col + dCol;
          const nextKey = cellKey(nextRow, nextCol);

          if (visited.has(nextKey)) continue;
          if (nextRow < 0 || nextCol < 0 || nextRow >= rows || nextCol >= cols) continue;
          if (getCellSymbol(grid, nextRow, nextCol) !== symbol) continue;

          visited.add(nextKey);
          queue.push({ row: nextRow, col: nextCol });
        }
      }

      clusters.push({ symbol, size: positions.length, positions });
    }
  }

  return clusters;
};

/**
 * Return only winning clusters (size ≥ minSize).
 *
 * @param {Array<Array<string | { name?: string }>>} grid
 * @param {number} [minSize=MIN_CLUSTER_SIZE]
 * @returns {Cluster[]}
 */
export const findWinningClusters = (grid, minSize = MIN_CLUSTER_SIZE) =>
  findAllClusters(grid).filter((cluster) => cluster.size >= minSize);

/**
 * Convert padded reel board `[col][paddedRow]` → visible `grid[row][col]`.
 *
 * @param {Array<Array<{ name: string }>>} board
 * @param {{ numReels: number, numRows: number, paddingTop: number }} config
 */
export const paddedBoardToGrid = (board, config) => {
  const grid = [];
  for (let row = 0; row < config.numRows; row++) {
    const gridRow = [];
    for (let col = 0; col < config.numReels; col++) {
      gridRow.push(board[col][row + config.paddingTop]);
    }
    grid.push(gridRow);
  }
  return grid;
};

/** Map `{ row, col }` → `{ reel, row }` for the cascade board format. */
export const gridPositionToBoard = ({ row, col }) => ({ reel: col, row });
