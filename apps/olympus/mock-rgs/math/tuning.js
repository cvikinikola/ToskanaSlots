/**
 * Board / RTP tuning — paytable values are FIXED (see paytable.js).
 *
 * RTP ~96% comes from what lands on the grid (symbol weights, hot pools,
 * tumble refill bias, scatter rate) — never from inflating paytable tiers.
 */

import { PAYING_SYMBOL_NAMES } from './symbols.js';

export const BASE_SYMBOL_WEIGHTS = [
  ['L3', 14],
  ['L2', 13],
  ['L1', 12],
  ['H4', 11],
  ['H3', 10],
  ['H2', 9],
  ['H1', 8],
];

export const SCATTER_RATE = 0.0042;

export const HOT_SYMBOL_COUNT = 3;
export const FS_HOT_SYMBOL_COUNT = 4;

/** Base-game cluster density (recalibrated after spot-mult win fix). */
export const HOT_SYMBOL_BOOST = 1.66;
export const NEIGHBOR_REFILL_BIAS = 1.31;

/** Free spins — natural retriggers / base trigger. */
export const FS_HOT_SYMBOL_BOOST = 2.5;
export const FS_NEIGHBOR_REFILL_BIAS = 1.72;

/** Bonus-buy FS — slightly hotter than natural FS to hit ~96% at 100× cost. */
export const BUY_FS_HOT_SYMBOL_BOOST = 2.38;
export const BUY_FS_NEIGHBOR_REFILL_BIAS = 1.64;

export const MAX_WIN_MULTIPLIER = 25000;
export const BONUS_BUY_COST_MULTIPLIER = 100;
export const TARGET_RTP = 0.96;

export const buildSymbolWeights = ({ freeSpinMode = false, bonusBuyMode = false, rng }) => {
  const count = freeSpinMode ? FS_HOT_SYMBOL_COUNT : HOT_SYMBOL_COUNT;
  let boost = HOT_SYMBOL_BOOST;
  if (freeSpinMode) {
    boost = bonusBuyMode ? BUY_FS_HOT_SYMBOL_BOOST : FS_HOT_SYMBOL_BOOST;
  }
  const pool = [...PAYING_SYMBOL_NAMES];
  const hot = new Set();

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    hot.add(pool.splice(idx, 1)[0]);
  }

  return BASE_SYMBOL_WEIGHTS.map(([name, weight]) => [
    name,
    hot.has(name) ? weight * boost : weight,
  ]);
};

export const neighborRefillBias = (freeSpinMode = false, bonusBuyMode = false) => {
  if (!freeSpinMode) return NEIGHBOR_REFILL_BIAS;
  return bonusBuyMode ? BUY_FS_NEIGHBOR_REFILL_BIAS : FS_NEIGHBOR_REFILL_BIAS;
};
