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
			/** Combined spot multiplier applied to this win (×1 when no spots) */
			spotMult: number;
			/** Sum of spot multipliers on winning positions (0 when none) */
			spotMultSum: number;
			winWithoutMult: number;
			/** Position for displaying the win amount overlay */
			overlay: Position;
			/** @deprecated legacy books — use spotMult */
			globalMult?: number;
		};
	}[];
};

/**
 * @deprecated Legacy M-symbol multiplier event. New math uses spotMultiplierUpdate.
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
 * 3+ VINAR (S) scatters anywhere on the grid triggered free spins.
 * Client should show the free spins intro animation.
 */
type BookEventFreeSpinTrigger = {
	index: number;
	type: 'freeSpinTrigger';
	totalFs: number;
	positions: Position[];
};

/**
 * 3+ scatters landed DURING free spins (pay anywhere).
 * Client should animate the scatters, show a "+N FREE SPINS" panel,
 * and bump the free-spin counter total.
 * (Math: extra spins use the same 3→10 … 7+→30 table as the base trigger.)
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
 * Grid spot multiplier sync after winning symbols explode.
 * Spots persist through cascades; cleared after base-game tumble sequence.
 */
type BookEventSpotMultiplierUpdate = {
	index: number;
	type: 'spotMultiplierUpdate';
	spots: {
		reel: number;
		row: number;
		explosionCount: number;
		multiplier: number;
	}[];
};

/** Clear all spot markers (end of base-game tumble sequence or round reset). */
type BookEventSpotMultipliersClear = {
	index: number;
	type: 'spotMultipliersClear';
};

/**
 * @deprecated Legacy free-spin global multiplier. Spot multipliers replace this.
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
	| BookEventSpotMultiplierUpdate
	| BookEventSpotMultipliersClear
	| BookEventUpdateGlobalMult
	| BookEventFreeSpinEnd
	| BookEventSetWin
	| BookEventFinalWin
	| BookEventCreateBonusSnapshot;

export type Bet = BetType<BookEvent>;
export type BookEventOfType<T> = Extract<BookEvent, { type: T }>;
export type BookEventContext = { bookEvents: BookEvent[] };
