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
  H1: [[8, 10], [9, 25], [12, 50], [15, 125], [20, 250], [30, 2500]],
  H2: [[8, 8], [9, 20], [12, 40], [15, 100], [20, 200], [30, 2000]],
  H3: [[8, 5], [9, 12], [12, 25], [15, 75], [20, 150], [30, 1500]],
  H4: [[8, 3], [9, 8], [12, 15], [15, 50], [20, 100], [30, 1000]],
  L1: [[8, 2], [9, 5], [12, 10], [15, 25], [20, 50], [30, 500]],
  L2: [[8, 1.5], [9, 4], [12, 8], [15, 20], [20, 40], [30, 400]],
  L3: [[8, 1], [9, 3], [12, 6], [15, 15], [20, 30], [30, 300]],
  L4: [[8, 0.5], [9, 2], [12, 4], [15, 10], [20, 20], [30, 200]],
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
