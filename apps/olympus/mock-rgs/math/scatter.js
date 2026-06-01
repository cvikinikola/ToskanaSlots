/**
 * VINAR (S) scatter — pays on any position (count anywhere on the 7×7 grid).
 *
 * Scatter appears on all reels. Free spins awarded by scatter count:
 *   3 → 10   4 → 12   5 → 15   6 → 20   7+ → 30
 *
 * Same table applies to base-game trigger and free-spin retriggers.
 */

/** Minimum scatters to award free spins. */
export const FREE_SPINS_TRIGGER = 3;

/** Scatter count → free spins awarded (7+ uses the 7 tier). */
export const FREE_SPINS_AWARDED = {
  3: 10,
  4: 12,
  5: 15,
  6: 20,
  7: 30,
};

/** Free spins for `scatterCount` scatters; 0 if below trigger. */
export const getFreeSpinsAwarded = (scatterCount) => {
  if (scatterCount < FREE_SPINS_TRIGGER) return 0;
  if (scatterCount >= 7) return FREE_SPINS_AWARDED[7];
  return FREE_SPINS_AWARDED[scatterCount] ?? 0;
};
