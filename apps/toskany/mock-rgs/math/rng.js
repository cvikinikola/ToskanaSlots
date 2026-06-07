/**
 * RNG primitives.
 *
 * `Rng = () => number` returning a uniform sample in [0, 1).
 * Defaults to `Math.random`; pass `createSeededRng(seed)` for
 * deterministic simulation / RTP calibration runs.
 */

export const defaultRng = Math.random;

/** Pick one entry from `[value, weight][]`. */
export const choiceWeighted = (weights, rng = defaultRng) => {
  let total = 0;
  for (const [, w] of weights) total += w;
  let r = rng() * total;
  for (const [v, w] of weights) {
    r -= w;
    if (r <= 0) return v;
  }
  return weights[weights.length - 1][0];
};

/** In-place Fisher–Yates shuffle. */
export const shuffle = (arr, rng = defaultRng) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/** Deterministic seeded PRNG (mulberry32). */
export const createSeededRng = (seed) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
