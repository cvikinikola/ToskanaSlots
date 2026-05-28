import { PAYOUT_TABLE } from '../mock-rgs/math/paytable.js';
import { runTumbleSequence } from '../mock-rgs/math/tumble.js';

const FILLERS = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3', 'L4'];
const VISIBLE_ROWS = 5;
const REELS = 6;

const buildBoard = (symbol, count) => {
  const visible = [];
  let placed = 0;
  let fillerIndex = 0;

  for (let i = 0; i < REELS * VISIBLE_ROWS; i++) {
    if (placed < count) {
      visible.push({ name: symbol });
      placed++;
      continue;
    }

    let filler = FILLERS[fillerIndex % FILLERS.length];
    if (filler === symbol) {
      fillerIndex++;
      filler = FILLERS[fillerIndex % FILLERS.length];
    }
    fillerIndex++;
    visible.push({ name: filler });
  }

  const board = [];
  for (let reel = 0; reel < REELS; reel++) {
    const column = [{ name: 'S', scatter: true }];
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      column.push(visible[reel * VISIBLE_ROWS + row]);
    }
    column.push({ name: 'S', scatter: true });
    board.push(column);
  }
  return board;
};

for (const [symbol, tiers] of Object.entries(PAYOUT_TABLE)) {
  for (const [count, multiplier] of tiers) {
    const result = runTumbleSequence({
      initialBoard: buildBoard(symbol, count),
      betAmount: 1,
      freeSpinMode: true,
      globalMultRef: { value: 1 },
      indexRef: { value: 0 },
    });
    const firstWin = result.events.find((event) => event.type === 'winInfo')
      ?.wins.find((win) => win.symbol === symbol);
    const expected = Math.round(multiplier * 100);

    if (!firstWin || firstWin.win !== expected || firstWin.meta.winWithoutMult !== expected) {
      throw new Error(
        `${symbol} ${count}x expected ${expected}, got ${JSON.stringify(firstWin)}`,
      );
    }
  }
}

console.log('[verify-paytable] free-spin payouts match paytable');
