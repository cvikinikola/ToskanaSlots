/**
 * Verify every paytable tier pays correctly on the real 7×7 padded board.
 * Uses mock-rgs math (same as RGS / gen-books).
 */
import { BOARD_CONFIG, visibleToBoardRow } from '../mock-rgs/math/board.js';
import { PAYOUT_TABLE } from '../mock-rgs/math/paytable.js';
import { PAYING_SYMBOL_NAMES } from '../mock-rgs/math/symbols.js';
import { runTumbleSequence, toBookAmount } from '../mock-rgs/math/tumble.js';
import { createSeededRng } from '../mock-rgs/math/rng.js';

const { numReels, numRows, paddingTop, paddingBottom } = BOARD_CONFIG;
const COLUMN_HEIGHT = numRows + paddingTop + paddingBottom;
const rng = createSeededRng(42);

/** Build a 7×7 padded board with exactly `count` connected `symbol` cells (row-major fill). */
const buildClusterBoard = (symbol, count) => {
	const fillerCycle = PAYING_SYMBOL_NAMES.filter((name) => name !== symbol);
	let fillerIndex = 0;
	const nextFiller = () => fillerCycle[fillerIndex++ % fillerCycle.length];

	const board = [];
	for (let reel = 0; reel < numReels; reel++) {
		const column = [];
		for (let i = 0; i < COLUMN_HEIGHT; i++) {
			column.push({ name: nextFiller() });
		}
		board.push(column);
	}

	let placed = 0;
	for (let row = 0; row < numRows && placed < count; row++) {
		for (let reel = 0; reel < numReels && placed < count; reel++) {
			board[reel][visibleToBoardRow(row)] = { name: symbol };
			placed++;
		}
	}

	if (placed !== count) {
		throw new Error(`Could not place ${count} symbols on ${numReels}×${numRows} grid`);
	}

	return board;
};

let passed = 0;
const failures = [];

for (const [symbol, tiers] of Object.entries(PAYOUT_TABLE)) {
	for (const [count, multiplier] of tiers) {
		const indexRef = { value: 0 };
		const result = runTumbleSequence({
			initialBoard: buildClusterBoard(symbol, count),
			betAmount: 1,
			freeSpinMode: false,
			rng,
			indexRef,
		});

		const winEvent = result.events.find((event) => event.type === 'winInfo');
		const firstWin = winEvent?.wins.find((win) => win.symbol === symbol);
		const expectedBook = toBookAmount(multiplier);

		if (
			!firstWin ||
			firstWin.win !== expectedBook ||
			firstWin.meta.winWithoutMult !== expectedBook
		) {
			failures.push({
				symbol,
				count,
				multiplier,
				expectedBook,
				got: firstWin ?? null,
			});
			continue;
		}

		passed++;
	}
}

console.log(`[verify-paytable] grid ${numReels}×${numRows} — ${passed} tiers OK`);

if (failures.length > 0) {
	console.error(`[verify-paytable] ${failures.length} FAILURES:`);
	for (const f of failures) {
		console.error(`  ${f.symbol} ×${f.count} (${f.multiplier}x bet) expected book ${f.expectedBook}`, f.got);
	}
	process.exit(1);
}

console.log('[verify-paytable] all payouts match paytable.js on 7×7 board');
