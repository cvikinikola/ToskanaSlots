/**
 * Grid spot multipliers — marks appear when winning symbols explode on a cell.
 *
 * 1st explosion on a cell → marked (no multiplier yet)
 * 2nd explosion → x2, then doubles each time (x4, x8 …), capped at x1024
 *
 * Multipliers on winning positions ADD together and multiply that win.
 * Base game: cleared after the tumble sequence. Free spins: persist entire round.
 */

export const MAX_SPOT_MULTIPLIER = 1024;

export const spotKey = (reel, row) => `${reel},${row}`;

/** @returns {{ spots: Map<string, { explosionCount: number, multiplier: number }> }} */
export const createSpotMultiplierState = () => ({
  spots: new Map(),
});

/** Multiplier value after `explosionCount` explosions on the same cell. */
export const multiplierFromExplosionCount = (explosionCount) => {
  if (explosionCount < 2) return 0;
  return Math.min(2 ** (explosionCount - 1), MAX_SPOT_MULTIPLIER);
};

export const getSpotMultiplier = (state, reel, row) =>
  state.spots.get(spotKey(reel, row))?.multiplier ?? 0;

/**
 * Multiplier applied when this cell explodes in the current cascade.
 *
 * Rule: "you multiply by whatever is ALREADY on the spot, THEN raise it for the
 * next tumble" (read-then-increment). Wins are evaluated BEFORE recordExplosions
 * (see tumble.js), so reading the stored explosionCount here gives the value that
 * was on the spot before this explosion — exactly what should multiply this win.
 *
 *   1st explosion: empty  → ×1 (nothing) → becomes GOLD (count 1)
 *   2nd explosion: GOLD   → ×1 (nothing) → becomes ×2  (count 2)
 *   3rd explosion: ×2     → ×2           → becomes ×4  (count 3)
 *   4th explosion: ×4     → ×4           → becomes ×8  (count 4)
 */
export const spotMultiplierForWin = (state, reel, row) => {
  const prev = state.spots.get(spotKey(reel, row))?.explosionCount ?? 0;
  return multiplierFromExplosionCount(prev);
};

/** Sum spot multipliers for all positions in a winning cluster (current cascade). */
export const sumSpotMultipliersForWin = (state, positions) =>
  positions.reduce((sum, p) => sum + spotMultiplierForWin(state, p.reel, p.row), 0);

/** @deprecated use sumSpotMultipliersForWin — reads stored mult (lags one cascade behind). */
export const sumSpotMultipliersForPositions = (state, positions) =>
  positions.reduce((sum, p) => sum + getSpotMultiplier(state, p.reel, p.row), 0);

/**
 * Win multiplier from spot sum: ×1 when no spots contribute, else ×sum.
 */
export const appliedSpotMultiplier = (spotSum) => (spotSum > 0 ? spotSum : 1);

/** Record explosions after a win; returns changed spots for book events. */
export const recordExplosions = (state, positions) => {
  const updates = [];
  const seen = new Set();
  for (const p of positions) {
    const key = spotKey(p.reel, p.row);
    if (seen.has(key)) continue;
    seen.add(key);
    const prev = state.spots.get(key) ?? { explosionCount: 0, multiplier: 0 };
    const explosionCount = prev.explosionCount + 1;
    const multiplier = multiplierFromExplosionCount(explosionCount);
    const entry = { explosionCount, multiplier };
    state.spots.set(key, entry);
    updates.push({ reel: p.reel, row: p.row, ...entry });
  }
  return updates;
};

export const clearSpotMultiplierState = (state) => {
  state.spots.clear();
};

/** Full grid state for client sync / replay. */
export const serializeSpotState = (state) =>
  [...state.spots.entries()].map(([key, entry]) => {
    const [reel, row] = key.split(',').map(Number);
    return { reel, row, ...entry };
  });
