import { PAYOUT_TABLE, getPayoutMultiplier } from '../mock-rgs/math/paytable.js';
import { BOARD_CONFIG } from '../mock-rgs/math/board.js';
import { runTumbleSequence } from '../mock-rgs/math/tumble.js';

const FILLERS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3'];
const VISIBLE_ROWS = BOARD_CONFIG.numRows;
const REELS = BOARD_CONFIG.numReels;

/** Build a board with one connected cluster of `symbol` spanning `count` cells. */
const buildBoard = (symbol, count) => {
  const board = [];
  let placed = 0;
  let fillerIndex = 0;

  for (let reel = 0; reel < REELS; reel++) {
    const column = [{ name: 'L1' }];
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      if (placed < count) {
        column.push({ name: symbol });
        placed++;
        continue;
      }

      let filler = FILLERS[fillerIndex % FILLERS.length];
      if (filler === symbol) {
        fillerIndex++;
        filler = FILLERS[fillerIndex % FILLERS.length];
      }
      fillerIndex++;
      column.push({ name: filler });
    }
    column.push({ name: 'L1' });
    board.push(column);
  }
  return board;
};

for (const [symbol, tiers] of Object.entries(PAYOUT_TABLE)) {
  for (const [count, multiplier] of tiers) {
    const result = runTumbleSequence({
      initialBoard: buildBoard(symbol, count),
      betAmount: 1,
      freeSpinMode: false,
      indexRef: { value: 0 },
    });
    const firstWin = result.events.find((event) => event.type === 'winInfo')
      ?.wins.find((win) => win.symbol === symbol);
    const expected = Math.round(getPayoutMultiplier(symbol, count) * 100);

    if (!firstWin || firstWin.win !== expected || firstWin.meta.winWithoutMult !== expected) {
      throw new Error(
        `${symbol} ${count}x expected ${expected}, got ${JSON.stringify(firstWin)}`,
      );
    }
  }
}

console.log('[verify-paytable] connected-cluster payouts match paytable');
