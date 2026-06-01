/**
 * Tumble / cascade sequencer.
 *
 * Spot multipliers on grid cells apply to wins (positions ADD); explosions mark
 * cells and grow multipliers. Client keeps spot visuals until the next base-game
 * spin (reveal); math state is reset each spin. Free spins keep spots for the
 * entire bonus round.
 */

import { tumble } from './board.js';
import { findConnectedClusterWins, countScatters } from './wins.js';
import { defaultRng } from './rng.js';
import {
  createSpotMultiplierState,
  sumSpotMultipliersForWin,
  appliedSpotMultiplier,
  recordExplosions,
  serializeSpotState,
} from './spotMultipliers.js';

/**
 * Stake's web-sdk encodes book amounts in "book units" where 100 = 1× bet.
 * See packages/constants-shared/bet.ts → BOOK_AMOUNT_MULTIPLIER.
 *
 * Positive wins below 0.005 × bet would round to 0, which displays as
 * "$0.00" in the win counter and confuses the player. Floor positive wins
 * to at least 1 book unit (= $0.01 at $1 bet).
 */
const BOOK_AMOUNT_MULTIPLIER = 100;
export const toBookAmount = (xBet) => {
  if (xBet <= 0) return 0;
  return Math.max(1, Math.round(xBet * BOOK_AMOUNT_MULTIPLIER));
};

const MAX_CASCADES = 30;

/**
 * Drive a single cascade chain.
 *
 * @param {object} opts
 * @param {any[][]} opts.initialBoard
 * @param {number} opts.betAmount         in × bet (typically 1)
 * @param {boolean} opts.freeSpinMode
 * @param {{ state: ReturnType<typeof createSpotMultiplierState> } | null} opts.spotStateRef
 * @param {{ value: number }} opts.indexRef       auto-incremented event index
 */
export const runTumbleSequence = ({
  initialBoard,
  betAmount,
  freeSpinMode,
  bonusBuyMode = false,
  symbolWeights,
  rng = defaultRng,
  spotStateRef = null,
  indexRef,
}) => {
  const events = [];
  const emit = (e) => events.push({ index: indexRef.value++, ...e });

  const spotState =
    freeSpinMode && spotStateRef?.state ? spotStateRef.state : createSpotMultiplierState();

  const scattersOnInitialBoard = countScatters(initialBoard);
  let tumbleWin = 0; // × bet
  let cur = initialBoard;

  for (let cascade = 0; cascade < MAX_CASCADES; cascade++) {
    const wins = findConnectedClusterWins(cur, betAmount);
    if (wins.length === 0) break;

    let cascadeWinRaw = 0;
    const winPayloads = wins.map((w) => {
      const spotMultSum = sumSpotMultipliersForWin(spotState, w.boardPositions);
      const spotMult = appliedSpotMultiplier(spotMultSum);
      const payoutWithSpots = w.payoutMultiplier * spotMult;
      cascadeWinRaw += payoutWithSpots;
      return {
        symbol: w.symbol,
        win: toBookAmount(payoutWithSpots),
        positions: w.boardPositions,
        meta: {
          spotMult,
          spotMultSum,
          winWithoutMult: toBookAmount(w.payoutMultiplier),
          overlay: w.boardPositions[0],
        },
      };
    });

    tumbleWin += cascadeWinRaw;

    emit({
      type: 'winInfo',
      totalWin: toBookAmount(tumbleWin),
      wins: winPayloads,
    });
    emit({ type: 'updateTumbleWin', amount: toBookAmount(tumbleWin) });

    const exploding = wins.flatMap((w) => w.boardPositions);
    recordExplosions(spotState, exploding);
    emit({
      type: 'spotMultiplierUpdate',
      spots: serializeSpotState(spotState),
    });

    const { board: next, newSymbols } = tumble(cur, exploding, {
      freeSpinMode,
      bonusBuyMode,
      symbolWeights,
      rng,
    });
    emit({ type: 'tumbleBoard', explodingSymbols: exploding, newSymbols });
    cur = next;
  }

  return {
    events,
    tumbleWin,
    scattersOnInitialBoard,
    finalBoard: cur,
  };
};
