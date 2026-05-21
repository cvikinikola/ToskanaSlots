/**
 * Pay table for the pay-anywhere cluster slot.
 *
 * Server-side source of truth for win calculation. Keep symbol set in sync
 * with the client visuals in `apps/olympus/src/game/config.ts` (the client
 * does NOT compute wins; it only displays symbols and amounts the server
 * sends in book events).
 *
 * Tiers (Gates-of-Olympus inspired):
 *   • 8–9   matches → tier 0
 *   • 10–11 matches → tier 1
 *   • 12+   matches → tier 2
 *
 * Values are × bet.
 */

export const PAYOUT_TABLE = {
  H1: [10, 25, 50],
  H2: [5,  15, 25],
  H3: [4,  10, 20],
  H4: [3,  8,  15],
  L1: [1.5, 2.0,  12],
  L2: [1.2, 1.5,  10],
  L3: [1.0, 1.25, 8],
  L4: [0.4, 0.9,  4],
};

/** Symbols that count toward pay-anywhere wins (excludes S / M). */
export const PAYING_SYMBOLS = Object.keys(PAYOUT_TABLE);

/** Minimum cluster size required for a win. */
export const MIN_CLUSTER_SIZE = 8;

const tierIndex = (count) => (count >= 12 ? 2 : count >= 10 ? 1 : 0);

/** Per-unit-bet payout multiplier for `count` of `symbol`. */
export const getPayoutMultiplier = (symbol, count) => {
  if (count < MIN_CLUSTER_SIZE) return 0;
  const tiers = PAYOUT_TABLE[symbol];
  if (!tiers) return 0;
  return tiers[tierIndex(count)] ?? 0;
};

/** Bet × paytable multiplier. */
export const calculatePayout = (symbol, count, betAmount) =>
  betAmount * getPayoutMultiplier(symbol, count);
