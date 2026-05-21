/**
 * Pay-anywhere win detection + multiplier / scatter collection.
 *
 * Rules:
 *   • Count occurrences of each PAYING_SYMBOL on the visible grid.
 *   • count ≥ MIN_CLUSTER_SIZE → win, payout via paytable.
 *   • S (scatter) and M (multiplier) never form pay-anywhere wins.
 */

import { forEachVisibleCell } from './board.js';
import { getPayoutMultiplier, MIN_CLUSTER_SIZE } from './paytable.js';

/**
 * Single-pass scan: bucket paying symbols by name, pull out multipliers
 * and scatters at the same time.
 */
const scan = (board) => {
  const positionsBySymbol = {};
  const multipliers = [];
  const scatters = [];
  forEachVisibleCell(board, (reel, row, sym) => {
    const pos = { reel, row };
    if (sym.name === 'S') { scatters.push(pos); return; }
    if (sym.name === 'M') {
      multipliers.push({ ...pos, multiplier: sym.multiplier ?? 1 });
      return;
    }
    (positionsBySymbol[sym.name] ??= []).push(pos);
  });
  return { positionsBySymbol, multipliers, scatters };
};

/**
 * @returns {Array<{
 *   symbol: string,
 *   count: number,
 *   positions: { reel: number, row: number }[],
 *   payoutMultiplier: number,
 *   amount: number,
 * }>} one entry per winning symbol.
 */
export const findPayAnywhereWins = (board, betAmount) => {
  const { positionsBySymbol } = scan(board);
  const wins = [];
  for (const [symbol, positions] of Object.entries(positionsBySymbol)) {
    if (positions.length < MIN_CLUSTER_SIZE) continue;
    const payoutMultiplier = getPayoutMultiplier(symbol, positions.length);
    if (payoutMultiplier <= 0) continue;
    wins.push({
      symbol,
      count: positions.length,
      positions,
      payoutMultiplier,
      amount: betAmount * payoutMultiplier,
    });
  }
  return wins;
};

/** Multiplier symbols on the visible grid (with their `multiplier` value). */
export const collectMultipliers = (board) => scan(board).multipliers;

/** Count of scatters on the visible grid. */
export const countScatters = (board) => scan(board).scatters.length;

/** Positions of every scatter on the visible grid. */
export const getScatterPositions = (board) => scan(board).scatters;
