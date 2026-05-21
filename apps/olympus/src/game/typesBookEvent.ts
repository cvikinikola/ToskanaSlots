import type { BetType } from 'rgs-requests';
import type { SymbolName, RawSymbol, GameType, Position } from './types';

// ─── Individual event types ───────────────────────────────────────────────────

/**
 * Server sends the full board after a spin/cascade.
 * The board includes padding rows (top & bottom).
 */
type BookEventReveal = {
	index: number;
	type: 'reveal';
	board: RawSymbol[][];
	paddingPositions: number[];
	anticipation: number[];
	gameType: GameType;
};

/**
 * Winning cluster information for one cascade round.
 * Contains all winning symbol groups and their positions.
 */
type BookEventWinInfo = {
	index: number;
	type: 'winInfo';
	totalWin: number;
	wins: {
		symbol: SymbolName;
		win: number;
		positions: Position[];
		meta: {
			/** Current accumulated global multiplier when this win was calculated */
			globalMult: number;
			winWithoutMult: number;
			/** Position for displaying the win amount overlay */
			overlay: Position;
		};
	}[];
};

/**
 * Fired when multiplier symbols (M) are present on the board after a win.
 * The client should:
 *   1. Animate the M symbols on the board
 *   2. Collect them into the global multiplier counter
 *   3. Show the updated totalWin (tumbleWin × boardMult)
 */
type BookEventBoardMultiplierInfo = {
	index: number;
	type: 'boardMultiplierInfo';
	multInfo: {
		positions: (Position & { multiplier: number })[];
	};
	winInfo: {
		tumbleWin: number;
		boardMult: number;
		totalWin: number;
	};
};

/**
 * Cascade/tumble step.
 * The winning symbols listed in explodingSymbols should explode,
 * then newSymbols fall in from the top.
 */
type BookEventTumbleBoard = {
	index: number;
	type: 'tumbleBoard';
	explodingSymbols: Position[];
	newSymbols: RawSymbol[][];
};

/**
 * Running win accumulator during a cascade sequence.
 * Show this in the tumble win counter.
 */
type BookEventUpdateTumbleWin = {
	index: number;
	type: 'updateTumbleWin';
	amount: number;
};

/** Final total win for the entire bet round (all cascades combined). */
type BookEventSetTotalWin = {
	index: number;
	type: 'setTotalWin';
	amount: number;
};

/**
 * 4+ scatter symbols triggered free spins.
 * Client should show the free spins intro animation.
 */
type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

/**
 * 3+ scatters landed DURING free spins.
 * Client should animate the scatters, show a "+N FREE SPINS" panel,
 * and bump the free-spin counter total.
 * (Math: extra spins are appended to the running free-spin loop.)
 */
type BookEventFreeSpinRetrigger = {
	index: number;
	type: 'freeSpinRetrigger';
	extraFs: number;
	totalFs: number;
	positions: Position[];
};

/** Free spin counter update – sent before each free spin. */
type BookEventUpdateFreeSpin = {
	index: number;
	type: 'updateFreeSpin';
	amount: number;
	total: number;
};

/**
 * Global multiplier update during free spins.
 * When globalMult === 1 it means the multiplier has reset (new free spin cycle).
 */
type BookEventUpdateGlobalMult = {
	index: number;
	type: 'updateGlobalMult';
	globalMult: number;
};

/** Free spins session ended. Show total free spins win. */
type BookEventFreeSpinEnd = {
	index: number;
	type: 'freeSpinEnd';
	amount: number;
	winLevel: number;
};

/** Non-free-spins win level presentation (big win, super win, etc.). */
type BookEventSetWin = {
	index: number;
	type: 'setWin';
	amount: number;
	winLevel: number;
};

/** Last event in a bet round. Clean up tumble/multiplier displays. */
type BookEventFinalWin = {
	index: number;
	type: 'finalWin';
	amount: number;
};

/**
 * Custom internal event used for resume-bet support.
 * The client replays a subset of previous bookEvents to restore visual state.
 */
type BookEventCreateBonusSnapshot = {
	index: number;
	type: 'createBonusSnapshot';
	bookEvents: BookEvent[];
};

// ─── Union & helpers ──────────────────────────────────────────────────────────

export type BookEvent =
	| BookEventReveal
	| BookEventWinInfo
	| BookEventBoardMultiplierInfo
	| BookEventTumbleBoard
	| BookEventUpdateTumbleWin
	| BookEventSetTotalWin
	| BookEventFreeSpinTrigger
	| BookEventFreeSpinRetrigger
	| BookEventUpdateFreeSpin
	| BookEventUpdateGlobalMult
	| BookEventFreeSpinEnd
	| BookEventSetWin
	| BookEventFinalWin
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
