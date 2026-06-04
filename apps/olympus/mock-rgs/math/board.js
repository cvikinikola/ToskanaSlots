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
// Keep symbols fairly even. With pay-anywhere 8+ wins on a 30-cell grid,
// heavily weighted low symbols make almost every spin a winner.

const SYMBOL_WEIGHTS = [
  ['L4', 12], ['L3', 12], ['L2', 11], ['L1', 10],
  ['H4', 9],  ['H3', 8],  ['H2', 7],  ['H1', 6],
];

const SCATTER_RATE = 0.004;
const MULTIPLIER_RATE_BASE = 0.005;
const MULTIPLIER_RATE_FREE = 0.018;

// Gates-of-Olympus multiplier ladder: 2× → 500×.
// Weights skew heavily to the low end; the huge values are extremely rare.
const DEFAULT_MULTIPLIER_WEIGHTS = [
  [2, 50],   [3, 30],   [4, 18],   [5, 10],
  [6, 6],    [8, 3],    [10, 2],   [12, 1.2],
  [15, 0.6], [20, 0.3], [25, 0.15], [50, 0.05],
  [100, 0.02], [250, 0.005], [500, 0.001],
];
const MULTIPLIER_WEIGHTS = DEFAULT_MULTIPLIER_WEIGHTS;

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
