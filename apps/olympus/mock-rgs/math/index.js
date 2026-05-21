/**
 * Pay-anywhere cluster-slot math.
 *
 *  mock-rgs/math/
 *  ├── rng.js        — choiceWeighted, shuffle, createSeededRng
 *  ├── paytable.js   — PAYOUT_TABLE, getPayoutMultiplier, calculatePayout
 *  ├── board.js      — generateBoard, generateSymbol, tumble, dropAndFill
 *  ├── wins.js       — findPayAnywhereWins, collectMultipliers, countScatters
 *  ├── tumble.js     — runTumbleSequence
 *  ├── spin.js       — runBaseSpin, runFreeSpins, runBonusBuy
 *  └── index.js      — barrel (this file)
 *
 * Pure JS, no SDK / Svelte / Pixi imports. Lives OUTSIDE `src/` on purpose
 * so it can never be bundled into the client build (the math must only run
 * server-side — for real production, use the Python Stake math-sdk).
 *
 * BookEvents emitted match `apps/olympus/src/game/typesBookEvent.ts` exactly.
 */

export * from './rng.js';
export * from './paytable.js';
export * from './board.js';
export * from './wins.js';
export * from './tumble.js';
export * from './spin.js';
