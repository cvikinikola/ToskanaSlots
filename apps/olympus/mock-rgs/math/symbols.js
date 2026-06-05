/**
 * Allowed symbols on the 7×7 grid — keep in sync with
 * `apps/olympus/src/game/constants.ts → GRID_SYMBOL_NAMES`.
 *
 * 7 paying symbols (H1–H4, L1–L3) + scatter (S).
 */

export const GRID_SYMBOL_NAMES = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'S'];

export const PAYING_SYMBOL_NAMES = GRID_SYMBOL_NAMES.filter((name) => name !== 'S');

export const GRID_SYMBOLS = new Set(GRID_SYMBOL_NAMES);

export const isGridSymbol = (name) =>
  GRID_SYMBOLS.has(String(name ?? '').toUpperCase());

/** Replace invalid symbols (e.g. legacy L4, M) with a safe paying symbol. */
export const sanitizeGridSymbol = (raw) => {
  const name = String(raw?.name ?? raw ?? '').toUpperCase();
  if (name === 'S') return { name: 'S', scatter: true };
  if (PAYING_SYMBOL_NAMES.includes(name)) return { name };
  return { name: 'L1' };
};

export const sanitizePaddedBoard = (board) =>
  board.map((reel) => reel.map((sym) => sanitizeGridSymbol(sym)));
