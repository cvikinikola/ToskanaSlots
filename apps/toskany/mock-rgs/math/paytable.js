/**
 * Pay table for the connected-cluster slot.
 *
 * Server-side source of truth for win calculation. Keep symbol set in sync
 * with `apps/toskany/src/game/symbolLabels.ts` and `config.ts`.
 *
 * Wins require ≥ MIN_CLUSTER_SIZE orthogonally connected matching symbols.
 * Values are × bet — NEVER scaled; RTP tuning lives in board generation (tuning.js).
 */

import { PAYING_SYMBOL_NAMES } from './symbols.js';

export const PAYOUT_TABLE = {
  H1: [[5, 2], [6, 3], [7, 3.5], [8, 4], [9, 5], [10, 10], [11, 15], [12, 30], [13, 70], [14, 140], [15, 300]],
  H2: [[5, 1.5], [6, 2], [7, 2.5], [8, 3], [9, 4], [10, 8], [11, 12], [12, 25], [13, 60], [14, 120], [15, 200]],
  H3: [[5, 1], [6, 1.5], [7, 2], [8, 2.5], [9, 3], [10, 6], [11, 9], [12, 20], [13, 40], [14, 80], [15, 120]],
  H4: [[5, 0.8], [6, 1], [7, 1.5], [8, 2], [9, 2.5], [10, 4], [11, 6], [12, 10], [13, 20], [14, 40], [15, 80]],
  L1: [[5, 0.6], [6, 0.8], [7, 1], [8, 1.5], [9, 2], [10, 3], [11, 5], [12, 7], [13, 16], [14, 30], [15, 60]],
  L2: [[5, 0.5], [6, 0.6], [7, 0.8], [8, 1], [9, 1.5], [10, 2], [11, 3], [12, 5], [13, 10], [14, 20], [15, 40]],
  L3: [[5, 0.4], [6, 0.5], [7, 0.6], [8, 0.8], [9, 1], [10, 1.5], [11, 2], [12, 2.5], [13, 6], [14, 12], [15, 20]],
};

/** Symbols that count toward cluster wins (excludes S). */
export const PAYING_SYMBOLS = PAYING_SYMBOL_NAMES;

/** Minimum connected cluster size required for a win. */
export const MIN_CLUSTER_SIZE = 5;

/** Per-unit-bet payout multiplier for `count` of `symbol` (exact paytable tier). */
export const getPayoutMultiplier = (symbol, count) => {
  if (count < MIN_CLUSTER_SIZE) return 0;
  const tiers = PAYOUT_TABLE[symbol];
  if (!tiers) return 0;
  return tiers.reduce(
    (best, [threshold, multiplier]) => (count >= threshold ? multiplier : best),
    0,
  );
};

/** Bet × paytable multiplier. */
export const calculatePayout = (symbol, count, betAmount) =>
  betAmount * getPayoutMultiplier(symbol, count);
