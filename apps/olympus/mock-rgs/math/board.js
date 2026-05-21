/**
 * Board generation and tumble/cascade mechanics.
 *
 * Pure functions — no mutation of inputs.
 * Board shape: [reelIndex][rowIndexIncludingPadding] of RawSymbol,
 * matching `apps/olympus/src/game/types.ts → RawSymbol`.
 */

import { choiceWeighted, defaultRng } from './rng.js';

// ─── Layout ──────────────────────────────────────────────────────────────────

export const BOARD_CONFIG = {
  numReels: 6,
  numRows: 5,
  paddingTop: 1,
  paddingBottom: 1,
};

export const COLUMN_HEIGHT =
  BOARD_CONFIG.numRows + BOARD_CONFIG.paddingTop + BOARD_CONFIG.paddingBottom;

// ─── Reel weights (Gates-of-Olympus style: lows dominate) ────────────────────
//
// Weights are tuned so wins (8+ of one paying symbol on the 30-cell visible
// grid) land on roughly 60–70 % of all spins. With this hit-rate the RTP
// calibrator's `scale` ends up close to 1 — so per-cascade book amounts
// (1 unit = 0.01 × bet) don't get rounded down to 0.

const SYMBOL_WEIGHTS = [
  ['L4', 30], ['L3', 24], ['L2', 18], ['L1', 14],
  ['H4', 8],  ['H3', 6],  ['H2', 4],  ['H1', 3],
];

const SCATTER_RATE = 0.014;
const MULTIPLIER_RATE_BASE = 0.018;
const MULTIPLIER_RATE_FREE = MULTIPLIER_RATE_BASE * 2.5;

const MULTIPLIER_WEIGHTS = [
  [2, 30], [3, 25], [4, 18], [5, 14], [6, 10], [8, 8], [10, 6],
  [12, 4], [15, 3], [20, 2], [25, 1.5], [50, 1], [100, 0.5], [250, 0.2], [500, 0.1],
];

// ─── Symbol / board generation ───────────────────────────────────────────────

/**
 * Produce a single random symbol.
 *  - Scatters: can land in both base and free-spin mode
 *    (3+ during free spins triggers a retrigger of extra spins).
 *  - Multipliers: ~2x denser in free spins.
 */
export const generateSymbol = ({
  freeSpinMode = false,
  allowScatter = true,
  allowMultiplier = true,
  rng = defaultRng,
} = {}) => {
  if (allowScatter && rng() < SCATTER_RATE) {
    return { name: 'S', scatter: true };
  }
  const multRate = freeSpinMode ? MULTIPLIER_RATE_FREE : MULTIPLIER_RATE_BASE;
  if (allowMultiplier && rng() < multRate) {
    return { name: 'M', multiplier: choiceWeighted(MULTIPLIER_WEIGHTS, rng) };
  }
  return { name: choiceWeighted(SYMBOL_WEIGHTS, rng) };
};

/** Fresh board sized to BOARD_CONFIG. */
export const generateBoard = (opts = {}) => {
  const board = [];
  for (let r = 0; r < BOARD_CONFIG.numReels; r++) {
    const reel = [];
    for (let i = 0; i < COLUMN_HEIGHT; i++) reel.push(generateSymbol(opts));
    board.push(reel);
  }
  return board;
};

// ─── Visible-grid helpers ────────────────────────────────────────────────────

/** Visible row index → padded board row index. */
export const visibleToBoardRow = (row) => row + BOARD_CONFIG.paddingTop;

/** Iterate every visible cell. */
export const forEachVisibleCell = (board, cb) => {
  for (let r = 0; r < BOARD_CONFIG.numReels; r++) {
    for (let row = 0; row < BOARD_CONFIG.numRows; row++) {
      cb(r, row, board[r][visibleToBoardRow(row)]);
    }
  }
};

/** Count every symbol name on the visible grid. */
export const countSymbols = (board) => {
  const counts = {};
  forEachVisibleCell(board, (_r, _row, sym) => {
    counts[sym.name] = (counts[sym.name] ?? 0) + 1;
  });
  return counts;
};

// ─── Tumble / cascade ────────────────────────────────────────────────────────

/**
 * Replace exploding cells with `null` placeholders.
 * Returns a new sparse board (input is not mutated).
 */
export const removeWinningSymbols = (board, exploding) => {
  const out = board.map((reel) => reel.slice());
  for (const p of exploding) {
    out[p.reel][visibleToBoardRow(p.row)] = null;
  }
  return out;
};

/**
 * Drop existing symbols down, fill the top with new ones.
 * Returns `{ board, newSymbols }`. `newSymbols[reel]` is the array of
 * fresh symbols that fell into reel `reel`, top → bottom.
 */
export const dropAndFill = (sparseBoard, opts = {}) => {
  const board = [];
  const newSymbols = [];
  for (let r = 0; r < BOARD_CONFIG.numReels; r++) {
    const kept = sparseBoard[r].filter((s) => s !== null);
    const need = COLUMN_HEIGHT - kept.length;
    const fresh = [];
    for (let i = 0; i < need; i++) fresh.push(generateSymbol(opts));
    board.push([...fresh, ...kept]);
    newSymbols.push(fresh);
  }
  return { board, newSymbols };
};

/** Convenience: remove + drop + fill in one call. */
export const tumble = (board, exploding, opts = {}) => {
  const sparse = removeWinningSymbols(board, exploding);
  return dropAndFill(sparse, opts);
};
