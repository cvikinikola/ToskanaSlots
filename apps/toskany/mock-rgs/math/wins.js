/**
 * Win calculation for the 7×7 connected-cluster slot.
 *
 * Uses BFS cluster detection (`clusterDetection.js`) then applies paytable
 * payouts. Scatter (S) never forms cluster wins.
 */

import { BOARD_CONFIG, forEachVisibleCell } from './board.js';
import {
  findWinningClusters,
  paddedBoardToGrid,
  gridPositionToBoard,
  MIN_CLUSTER_SIZE,
} from './clusterDetection.js';
import { getPayoutMultiplier } from './paytable.js';

/**
 * Single-pass scan: collect scatters only (grid has no M / other symbols).
 */
const scan = (board) => {
  const scatters = [];
  forEachVisibleCell(board, (reel, row, sym) => {
    if (sym.name === 'S') scatters.push({ reel, row });
  });
  return { scatters };
};

/**
 * Find all winning connected clusters on a padded reel board.
 *
 * @returns {Array<{
 *   symbol: string,
 *   count: number,
 *   positions: { row: number, col: number }[],
 *   boardPositions: { reel: number, row: number }[],
 *   payoutMultiplier: number,
 *   amount: number,
 * }>}
 */
export const findConnectedClusterWins = (board, betAmount) => {
  const grid = paddedBoardToGrid(board, BOARD_CONFIG);
  const winningClusters = findWinningClusters(grid, MIN_CLUSTER_SIZE);

  return winningClusters
    .map((cluster) => {
      const payoutMultiplier = getPayoutMultiplier(cluster.symbol, cluster.size);
      if (payoutMultiplier <= 0) return null;

      const boardPositions = cluster.positions.map(gridPositionToBoard);

      return {
        symbol: cluster.symbol,
        count: cluster.size,
        positions: cluster.positions,
        boardPositions,
        payoutMultiplier,
        amount: betAmount * payoutMultiplier,
      };
    })
    .filter(Boolean);
};

/**
 * Pure 7×7 grid API — returns winning clusters as `{ row, col }[]`.
 *
 * @param {Array<Array<string | { name?: string }>>} grid 7×7, grid[row][col]
 * @returns {Array<{ symbol: string, count: number, positions: { row: number, col: number }[] }>}
 */
export const findWinningClustersOnGrid = (grid) =>
  findWinningClusters(grid, MIN_CLUSTER_SIZE).map((cluster) => ({
    symbol: cluster.symbol,
    count: cluster.size,
    positions: cluster.positions,
  }));

/** @deprecated alias kept for tumble.js */
export const findPayAnywhereWins = findConnectedClusterWins;

/** Count of scatters on the visible grid. */
export const countScatters = (board) => scan(board).scatters.length;

/** Positions of every scatter on the visible grid. */
export const getScatterPositions = (board) => scan(board).scatters;
