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

const envNum = (key, fallback) => {
  const raw = process.env[key];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
};

export const SCATTER_RATE = envNum('SCATTER_RATE', 0.0042);

export const HOT_SYMBOL_COUNT = 3;
export const FS_HOT_SYMBOL_COUNT = 4;

/** Base-game cluster density — calibrated 2026-06-07 (80k×13 sim sweep, 7×7 grid). */
export const HOT_SYMBOL_BOOST = envNum('HOT_SYMBOL_BOOST', 2.128);
export const NEIGHBOR_REFILL_BIAS = envNum('NEIGHBOR_REFILL_BIAS', 1.355);

/** Free spins — natural retriggers / base trigger. */
export const FS_HOT_SYMBOL_BOOST = envNum('FS_HOT_SYMBOL_BOOST', 2.59);
export const FS_NEIGHBOR_REFILL_BIAS = envNum('FS_NEIGHBOR_REFILL_BIAS', 1.72);

/** Bonus-buy FS — calibrated to match BASE RTP within 0.5%. */
export const BUY_FS_HOT_SYMBOL_BOOST = envNum('BUY_FS_HOT_SYMBOL_BOOST', 3.1);
export const BUY_FS_NEIGHBOR_REFILL_BIAS = envNum('BUY_FS_NEIGHBOR_REFILL_BIAS', 1.775);

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
