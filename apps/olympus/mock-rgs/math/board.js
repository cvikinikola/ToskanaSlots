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
const MULTIPLIER_RATE_BASE = 0.004;
const MULTIPLIER_RATE_FREE = 0.012;

const MULTIPLIER_WEIGHTS = [
  [2, 45], [3, 30], [4, 16], [5, 8], [6, 4], [8, 2], [10, 1],
  [12, 0.5], [15, 0.25], [20, 0.1], [25, 0.05], [50, 0.01],
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
