/**
 * Tumble / cascade sequencer.
 *
 * Runs successive `findPayAnywhereWins → tumble` rounds until no wins
 * remain, emitting bookEvents that match `apps/olympus/src/game/typesBookEvent.ts`
 * so they replay through the existing `bookEventHandlerMap` unchanged.
 *
 * Multipliers:
 *   • Base game — collected M values are summed and applied ONCE at the end
 *     of the chain via `boardMultiplierInfo`.
 *   • Free spins — collected M values are added into a persistent globalMult
 *     via `updateGlobalMult`; every cascade win is pre-multiplied by it.
 */

import { tumble } from './board.js';
import { findPayAnywhereWins, collectMultipliers, countScatters } from './wins.js';

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
 * @param {{ value: number }} opts.globalMultRef  persistent multiplier (free spins)
 * @param {{ value: number }} opts.indexRef       auto-incremented event index
 * @returns {{ events: any[], tumbleWin: number,
 *             collectedMultipliers: any[],
 *             scattersOnInitialBoard: number,
 *             finalBoard: any[][] }}
 */
export const runTumbleSequence = ({
  initialBoard,
  betAmount,
  freeSpinMode,
  globalMultRef,
  indexRef,
}) => {
  const events = [];
  const emit = (e) => events.push({ index: indexRef.value++, ...e });

  const scattersOnInitialBoard = countScatters(initialBoard);
  let tumbleWin = 0; // × bet
  let cur = initialBoard;

  for (let cascade = 0; cascade < MAX_CASCADES; cascade++) {
    const wins = findPayAnywhereWins(cur, betAmount);
    if (wins.length === 0) break;

    const cascadeWinRaw = wins.reduce((a, w) => a + w.payoutMultiplier, 0);
    const globalMult = freeSpinMode ? globalMultRef.value : 1;
    const cascadeWin = cascadeWinRaw * globalMult;
    tumbleWin += cascadeWin;

    emit({
      type: 'winInfo',
      totalWin: toBookAmount(tumbleWin),
      wins: wins.map((w) => ({
        symbol: w.symbol,
        win: toBookAmount(w.payoutMultiplier * globalMult),
        positions: w.positions,
        meta: {
          globalMult,
          winWithoutMult: toBookAmount(w.payoutMultiplier),
          overlay: w.positions[0],
        },
      })),
    });
    emit({ type: 'updateTumbleWin', amount: toBookAmount(tumbleWin) });

    const exploding = wins.flatMap((w) => w.positions);
    const { board: next, newSymbols } = tumble(cur, exploding, { freeSpinMode });
    emit({ type: 'tumbleBoard', explodingSymbols: exploding, newSymbols });
    cur = next;
  }

  // Apply visible multipliers once at the end of the chain.
  const collected = tumbleWin > 0 ? collectMultipliers(cur) : [];
  if (collected.length > 0) {
    const boardMult = collected.reduce((a, m) => a + m.multiplier, 0);
    if (freeSpinMode) {
      globalMultRef.value += boardMult;
      emit({ type: 'updateGlobalMult', globalMult: globalMultRef.value });
    } else {
      const preMult = tumbleWin;
      const totalAfter = preMult * boardMult;
      emit({
        type: 'boardMultiplierInfo',
        multInfo: { positions: collected },
        winInfo: {
          tumbleWin: toBookAmount(preMult),
          boardMult,
          totalWin: toBookAmount(totalAfter),
        },
      });
      tumbleWin = totalAfter;
    }
  }

  return {
    events,
    tumbleWin,
    collectedMultipliers: collected,
    scattersOnInitialBoard,
    finalBoard: cur,
  };
};
