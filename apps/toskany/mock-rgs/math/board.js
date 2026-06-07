/**
 * Board generation and tumble/cascade mechanics.
 *
 * Pure functions — no mutation of inputs.
 * Board shape: [reelIndex][rowIndexIncludingPadding] of RawSymbol,
 * matching `apps/toskany/src/game/types.ts → RawSymbol`.
 */

import { choiceWeighted, defaultRng } from './rng.js';
import { sanitizeGridSymbol, sanitizePaddedBoard } from './symbols.js';
import {
  SCATTER_RATE,
  BASE_SYMBOL_WEIGHTS,
  buildSymbolWeights,
  neighborRefillBias,
} from './tuning.js';

export { GRID_SYMBOL_NAMES, PAYING_SYMBOL_NAMES, GRID_SYMBOLS, sanitizeGridSymbol, sanitizePaddedBoard } from './symbols.js';
export { SCATTER_RATE, BASE_SYMBOL_WEIGHTS, buildSymbolWeights };

// ─── Layout ──────────────────────────────────────────────────────────────────

export const BOARD_CONFIG = {
  numReels: 7,
  numRows: 7,
  paddingTop: 1,
  paddingBottom: 1,
};

export const COLUMN_HEIGHT =
  BOARD_CONFIG.numRows + BOARD_CONFIG.paddingTop + BOARD_CONFIG.paddingBottom;

// ─── Symbol / board generation ───────────────────────────────────────────────

const applyBias = (weights, biasSymbol, biasMultiplier) => {
  if (!biasSymbol) return weights;
  return weights.map(([name, weight]) =>
    name === biasSymbol ? [name, weight * biasMultiplier] : [name, weight],
  );
};

/**
 * Produce a single random grid symbol (H1–H4, L1–L3, or S).
 *
 * @param {object} opts
 * @param {Array<[string, number]>} [opts.symbolWeights]
 * @param {string} [opts.refillBiasSymbol]  symbol below in column (tumble refill)
 * @param {boolean} [opts.freeSpinMode]
 * @param {boolean} [opts.bonusBuyMode]
 */
export const generateSymbol = ({
  freeSpinMode = false,
  bonusBuyMode = false,
  allowScatter = true,
  symbolWeights = BASE_SYMBOL_WEIGHTS,
  refillBiasSymbol = null,
  rng = defaultRng,
} = {}) => {
  if (allowScatter && rng() < SCATTER_RATE) {
    return sanitizeGridSymbol({ name: 'S', scatter: true });
  }

  const biasedWeights = applyBias(
    symbolWeights,
    refillBiasSymbol,
    neighborRefillBias(freeSpinMode, bonusBuyMode),
  );
  const name = choiceWeighted(biasedWeights, rng);
  return sanitizeGridSymbol({ name });
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
    for (let i = 0; i < need; i++) {
      fresh.push(
        generateSymbol({
          ...opts,
          refillBiasSymbol: kept.length > 0 ? kept[0].name : null,
        }),
      );
    }
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
