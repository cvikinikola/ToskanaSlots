import {
  createSpotMultiplierState,
  multiplierFromExplosionCount,
  sumSpotMultipliersForWin,
  spotMultiplierForWin,
  appliedSpotMultiplier,
  recordExplosions,
  clearSpotMultiplierState,
  MAX_SPOT_MULTIPLIER,
} from '../mock-rgs/math/spotMultipliers.js';

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

assert(multiplierFromExplosionCount(1) === 0, '1st explosion has no multiplier');
assert(multiplierFromExplosionCount(2) === 2, '2nd explosion → x2');
assert(multiplierFromExplosionCount(3) === 4, '3rd → x4');
assert(multiplierFromExplosionCount(4) === 8, '4th → x8');
assert(multiplierFromExplosionCount(11) === 1024, '11th → x1024');
assert(multiplierFromExplosionCount(20) === MAX_SPOT_MULTIPLIER, 'capped at x1024');

const state = createSpotMultiplierState();
assert(spotMultiplierForWin(state, 0, 0) === 0, '1st hit on empty cell → no mult');
recordExplosions(state, [{ reel: 0, row: 0 }]);
assert(spotMultiplierForWin(state, 0, 0) === 2, '2nd hit on marked cell → x2 before record');
assert(sumSpotMultipliersForWin(state, [{ reel: 0, row: 0 }]) === 2, 'win sum uses this hit tier');

recordExplosions(state, [{ reel: 0, row: 0 }]);
assert(spotMultiplierForWin(state, 0, 0) === 4, '3rd hit → x4');

recordExplosions(state, [{ reel: 1, row: 1 }]);
recordExplosions(state, [{ reel: 1, row: 1 }]);
recordExplosions(state, [{ reel: 1, row: 1 }]);
assert(spotMultiplierForWin(state, 1, 1) === 8, '4th hit after cell reached x4 → x8 applies to win');
assert(
  sumSpotMultipliersForWin(state, [
    { reel: 0, row: 0 },
    { reel: 1, row: 1 },
  ]) === 12,
  'x4 + x8 = 12',
);

assert(appliedSpotMultiplier(0) === 1, 'no spots → ×1');
assert(appliedSpotMultiplier(6) === 6, 'spots add');

clearSpotMultiplierState(state);
assert(state.spots.size === 0, 'clear works');

console.log('[verify-spot-multipliers] all spot multiplier tests passed');
