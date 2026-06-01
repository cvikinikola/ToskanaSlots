/**
 * Connected-cluster slot math.
 *
 *  mock-rgs/math/
 *  ├── rng.js        — choiceWeighted, shuffle, createSeededRng
 *  ├── paytable.js   — PAYOUT_TABLE, getPayoutMultiplier, calculatePayout
 *  ├── board.js      — generateBoard, generateSymbol, tumble, dropAndFill
 *  ├── clusterDetection.js — BFS flood-fill on 7×7 grid
 *  ├── wins.js       — findConnectedClusterWins, findWinningClustersOnGrid
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

export * from './symbols.js';
export * from './rng.js';
export * from './paytable.js';
export * from './board.js';
export * from './clusterDetection.js';
export * from './wins.js';
export * from './spotMultipliers.js';
export * from './tumble.js';
export * from './scatter.js';
export * from './spin.js';
export * from './tuning.js';
