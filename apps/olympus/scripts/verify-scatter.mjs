import {
  FREE_SPINS_TRIGGER,
  FREE_SPINS_AWARDED,
  getFreeSpinsAwarded,
} from '../mock-rgs/math/scatter.js';

const cases = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 10],
  [4, 12],
  [5, 15],
  [6, 20],
  [7, 30],
  [8, 30],
  [49, 30],
];

for (const [count, expected] of cases) {
  const got = getFreeSpinsAwarded(count);
  if (got !== expected) {
    throw new Error(`scatter ${count}: expected ${expected} FS, got ${got}`);
  }
}

if (FREE_SPINS_TRIGGER !== 3) {
  throw new Error(`trigger should be 3, got ${FREE_SPINS_TRIGGER}`);
}

if (JSON.stringify(FREE_SPINS_AWARDED) !== JSON.stringify({ 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 })) {
  throw new Error('FREE_SPINS_AWARDED mismatch');
}

console.log('[verify-scatter] free-spin awards match spec');
