/**
 * High-level "play a round" entry points.
 *
 * Returns `{ bookEvents, totalWin }` where `bookEvents` is ready to be
 * placed into `round.state` of the RGS `/wallet/play` response.
 *
 * `totalWin` is in × bet.
 */

import { BOARD_CONFIG, generateBoard, visibleToBoardRow, buildSymbolWeights } from './board.js';
import { getScatterPositions, countScatters } from './wins.js';
import { runTumbleSequence, toBookAmount } from './tumble.js';
import { shuffle, defaultRng } from './rng.js';
import { createSpotMultiplierState } from './spotMultipliers.js';
import {
  FREE_SPINS_TRIGGER,
  FREE_SPINS_AWARDED,
  getFreeSpinsAwarded,
} from './scatter.js';
import { MAX_WIN_MULTIPLIER } from './tuning.js';

const capRoundWin = (totalWin) => Math.min(totalWin, MAX_WIN_MULTIPLIER);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const forceScatters = (board, count, rng) => {
  const out = board.map((reel) => reel.slice());
  const positions = [];
  for (let r = 0; r < BOARD_CONFIG.numReels; r++) {
    for (let row = 0; row < BOARD_CONFIG.numRows; row++) positions.push({ reel: r, row });
  }
  shuffle(positions, rng);
  for (let i = 0; i < count; i++) {
    const p = positions[i];
    out[p.reel][visibleToBoardRow(p.row)] = { name: 'S', scatter: true };
  }
  return out;
};

const emptyAnticipation = () => new Array(BOARD_CONFIG.numReels).fill(0);

// ─── Public API ──────────────────────────────────────────────────────────────

/** Base spin (with optional follow-on free spins on 3+ scatters). */
export const runBaseSpin = ({ betAmount = 1, rng = defaultRng } = {}) =>
  playRound({ betAmount, rng, forceBonus: false });

/** Bonus-buy entry: forces minimum scatters on the initial board. */
export const runBonusBuy = ({ betAmount = 1, rng = defaultRng } = {}) =>
  playRound({ betAmount, rng, forceBonus: true });

/**
 * Run an isolated free-spins session.
 * Exported separately so it can be unit-tested without the base wrapper.
 */
export const runFreeSpins = ({
  betAmount = 1,
  freeSpinCount = FREE_SPINS_AWARDED[FREE_SPINS_TRIGGER],
  bonusBuyMode = false,
  rng = defaultRng,
  indexRef = { value: 0 },
  spotStateRef = { state: createSpotMultiplierState() },
} = {}) => {
  const bookEvents = [];
  const emit = (e) => bookEvents.push({ index: indexRef.value++, ...e });

  let totalWin = 0;
  let totalFs = freeSpinCount;

  for (let fs = 1; fs <= totalFs; fs++) {
    emit({ type: 'updateFreeSpin', amount: fs, total: totalFs });

    const symbolWeights = buildSymbolWeights({ freeSpinMode: true, bonusBuyMode, rng });
    const fsBoard = generateBoard({ freeSpinMode: true, bonusBuyMode, symbolWeights, rng });
    emit({
      type: 'reveal',
      board: fsBoard,
      paddingPositions: [0],
      anticipation: emptyAnticipation(),
      gameType: 'freeSpins',
    });

    // Retrigger: 3+ scatters anywhere on the grid → same free-spin table as base.
    const scattersOnThisSpin = countScatters(fsBoard);
    const extraFs = getFreeSpinsAwarded(scattersOnThisSpin);
    if (extraFs > 0) {
      totalFs += extraFs;
      emit({
        type: 'freeSpinRetrigger',
        extraFs,
        totalFs,
        positions: getScatterPositions(fsBoard),
      });
      // Update counter so UI shows the new total immediately.
      emit({ type: 'updateFreeSpin', amount: fs, total: totalFs });
    }

    const chain = runTumbleSequence({
      initialBoard: fsBoard,
      betAmount,
      freeSpinMode: true,
      bonusBuyMode,
      symbolWeights,
      rng,
      spotStateRef,
      indexRef,
    });
    bookEvents.push(...chain.events);
    totalWin += chain.tumbleWin;
  }

  return { bookEvents, totalWin };
};

// ─── Internal ────────────────────────────────────────────────────────────────

const playRound = ({ betAmount, rng, forceBonus }) => {
  const bookEvents = [];
  const indexRef = { value: 0 };
  const emit = (e) => bookEvents.push({ index: indexRef.value++, ...e });

  // ── Base spin ────────────────────────────────────────────────────────────
  const symbolWeights = buildSymbolWeights({ freeSpinMode: false, rng });
  let board = generateBoard({ freeSpinMode: false, symbolWeights, rng });
  if (forceBonus) board = forceScatters(board, FREE_SPINS_TRIGGER, rng);

  emit({
    type: 'reveal',
    board,
    paddingPositions: [0],
    anticipation: emptyAnticipation(),
    gameType: 'basegame',
  });

  const spotStateRef = { state: createSpotMultiplierState() };
  const baseChain = runTumbleSequence({
    initialBoard: board,
    betAmount,
    freeSpinMode: false,
    symbolWeights,
    rng,
    indexRef,
  });
  bookEvents.push(...baseChain.events);
  let totalWin = baseChain.tumbleWin;

  // ── Free spins trigger ───────────────────────────────────────────────────
  // Count scatters on the FINAL board so scatters that fell in during cascades
  // are also counted (player sees them → expects the trigger).
  const scattersFinal = countScatters(baseChain.finalBoard);
  const scatterCount = forceBonus ? Math.max(scattersFinal, FREE_SPINS_TRIGGER) : scattersFinal;
  const fsAward = getFreeSpinsAwarded(scatterCount);
  const triggered = fsAward > 0;

  if (triggered) {
    emit({
      type: 'freeSpinTrigger',
      totalFs: fsAward,
      positions: getScatterPositions(baseChain.finalBoard),
    });

    const fs = runFreeSpins({
      betAmount,
      freeSpinCount: fsAward,
      bonusBuyMode: forceBonus,
      rng,
      indexRef,
      spotStateRef,
    });
    bookEvents.push(...fs.bookEvents);
    totalWin += fs.totalWin;
    emit({ type: 'freeSpinEnd', amount: toBookAmount(fs.totalWin), winLevel: 0 });
  }

  totalWin = capRoundWin(totalWin);

  emit({ type: 'setTotalWin', amount: toBookAmount(totalWin) });
  emit({ type: 'finalWin', amount: toBookAmount(totalWin) });

  return { bookEvents, totalWin };
};

// ─── Constants exported for the mock-rgs server ──────────────────────────────

export const FREE_SPINS_CONFIG = {
  triggerCount: FREE_SPINS_TRIGGER,
  awarded: FREE_SPINS_AWARDED,
};
