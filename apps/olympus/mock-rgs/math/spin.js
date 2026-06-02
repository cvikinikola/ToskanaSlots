/**
 * High-level "play a round" entry points.
 *
 * Returns `{ bookEvents, totalWin }` where `bookEvents` is ready to be
 * placed into `round.state` of the RGS `/wallet/play` response.
 *
 * `totalWin` is in × bet.
 */

import { BOARD_CONFIG, generateBoard, visibleToBoardRow } from './board.js';
import { getScatterPositions, countScatters } from './wins.js';
import { runTumbleSequence, toBookAmount } from './tumble.js';
import { shuffle, defaultRng } from './rng.js';

const FREE_SPINS_AWARDED = 15;
const FREE_SPINS_TRIGGER = 4;
/** During free spins: 3+ scatters retriggers extra spins. */
const FREE_SPINS_RETRIGGER_THRESHOLD = 3;
const FREE_SPINS_RETRIGGER_AWARD = 5;

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

/** Base spin (with optional follow-on free spins on 4+ scatters). */
export const runBaseSpin = ({ betAmount = 1, rng = defaultRng } = {}) =>
  playRound({ betAmount, rng, forceBonus: false });

/** Bonus-buy entry: forces 4 scatters on the initial board. */
export const runBonusBuy = ({ betAmount = 1, rng = defaultRng } = {}) =>
  playRound({ betAmount, rng, forceBonus: true });

/**
 * Run an isolated free-spins session.
 * Exported separately so it can be unit-tested without the base wrapper.
 */
export const runFreeSpins = ({
  betAmount = 1,
  freeSpinCount = FREE_SPINS_AWARDED,
  rng = defaultRng,
  indexRef = { value: 0 },
  // QA: Free-spin global multiplier starts at 0 (not 1) and can only grow.
  globalMultRef = { value: 0 },
} = {}) => {
  const bookEvents = [];
  const emit = (e) => bookEvents.push({ index: indexRef.value++, ...e });

  let totalWin = 0;
  let totalFs = freeSpinCount;

  for (let fs = 1; fs <= totalFs; fs++) {
    emit({ type: 'updateFreeSpin', amount: fs, total: totalFs });

    const fsBoard = generateBoard({ freeSpinMode: true, rng });
    emit({
      type: 'reveal',
      board: fsBoard,
      paddingPositions: [0],
      anticipation: emptyAnticipation(),
      gameType: 'freeSpins',
    });

    // Retrigger: 3+ scatters during free spins → +5 spins.
    const scattersOnThisSpin = countScatters(fsBoard);
    if (scattersOnThisSpin >= FREE_SPINS_RETRIGGER_THRESHOLD) {
      totalFs += FREE_SPINS_RETRIGGER_AWARD;
      emit({
        type: 'freeSpinRetrigger',
        extraFs: FREE_SPINS_RETRIGGER_AWARD,
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
      globalMultRef,
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
  let board = generateBoard({ freeSpinMode: false, rng });
  if (forceBonus) board = forceScatters(board, FREE_SPINS_TRIGGER, rng);

  emit({
    type: 'reveal',
    board,
    paddingPositions: [0],
    anticipation: emptyAnticipation(),
    gameType: 'basegame',
  });

  // Base game does not use the persistent multiplier (kept at 0).
  const globalMultRef = { value: 0 };
  const baseChain = runTumbleSequence({
    initialBoard: board,
    betAmount,
    freeSpinMode: false,
    globalMultRef,
    indexRef,
  });
  bookEvents.push(...baseChain.events);
  let totalWin = baseChain.tumbleWin;

  // ── Free spins trigger ───────────────────────────────────────────────────
  // Count scatters on the FINAL board so scatters that fell in during cascades
  // are also counted (player sees them → expects the trigger).
  const scattersFinal = countScatters(baseChain.finalBoard);
  const triggered = scattersFinal >= FREE_SPINS_TRIGGER || forceBonus;

  if (triggered) {
    emit({
      type: 'freeSpinTrigger',
      totalFs: FREE_SPINS_AWARDED,
      positions: getScatterPositions(baseChain.finalBoard),
    });
    // QA: starts at 0, not 1.
    globalMultRef.value = 0;
    emit({ type: 'updateGlobalMult', globalMult: 0 });

    const fs = runFreeSpins({
      betAmount,
      freeSpinCount: FREE_SPINS_AWARDED,
      rng,
      indexRef,
      globalMultRef,
    });
    bookEvents.push(...fs.bookEvents);
    totalWin += fs.totalWin;
    emit({ type: 'freeSpinEnd', amount: toBookAmount(fs.totalWin), winLevel: 0 });
  }

  emit({ type: 'setTotalWin', amount: toBookAmount(totalWin) });
  emit({ type: 'finalWin', amount: toBookAmount(totalWin) });

  return { bookEvents, totalWin };
};

// ─── Constants exported for the mock-rgs server ──────────────────────────────

export const FREE_SPINS_CONFIG = {
  awarded: FREE_SPINS_AWARDED,
  triggerCount: FREE_SPINS_TRIGGER,
  retriggerThreshold: FREE_SPINS_RETRIGGER_THRESHOLD,
  retriggerAward: FREE_SPINS_RETRIGGER_AWARD,
};
