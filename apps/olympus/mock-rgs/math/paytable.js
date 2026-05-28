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
  H1: [[8, 5], [9, 12.5], [12, 25], [15, 62.5], [20, 125], [30, 1250]],
  H2: [[8, 4], [9, 10], [12, 20], [15, 50], [20, 100], [30, 1000]],
  H3: [[8, 2.5], [9, 6], [12, 12.5], [15, 37.5], [20, 75], [30, 750]],
  H4: [[8, 1.5], [9, 4], [12, 7.5], [15, 25], [20, 50], [30, 500]],
  L1: [[8, 1], [9, 2.5], [12, 5], [15, 12.5], [20, 25], [30, 250]],
  L2: [[8, 0.75], [9, 2], [12, 4], [15, 10], [20, 20], [30, 200]],
  L3: [[8, 0.5], [9, 1.5], [12, 3], [15, 7.5], [20, 15], [30, 150]],
  L4: [[8, 0.25], [9, 1], [12, 2], [15, 5], [20, 10], [30, 100]],
};

/** Symbols that count toward pay-anywhere wins (excludes S / M). */
export const PAYING_SYMBOLS = Object.keys(PAYOUT_TABLE);

/** Minimum cluster size required for a win. */
export const MIN_CLUSTER_SIZE = 8;

/** Per-unit-bet payout multiplier for `count` of `symbol`. */
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
