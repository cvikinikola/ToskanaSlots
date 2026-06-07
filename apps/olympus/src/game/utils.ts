import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import {
	SYMBOL_SIZE,
	REEL_STEP_X,
	REEL_STEP_Y,
	SYMBOL_COLORS,
	SYMBOL_SPRITE_BASE,
	SYMBOL_SPRITE_SCALE,
	GRAPE_SYMBOL_NAMES,
	GRAPE_SYMBOL_SPRITE_SCALE,
	SYMBOL_SPRITE_SCALE_BY_NAME,
	SCATTER_SPRITE_ASPECT,
	SCATTER_SPRITE_SCALE,
	SYMBOL_DRAW_HALF,
	BOARD_DIMENSIONS,
} from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol } from './types';

// ─── Book utilities ───────────────────────────────────────────────────────────

export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	try {
		await playBookEvents(bet.state);
	} catch (error) {
		console.error('[playBet] book event playback failed:', error);
		eventEmitter.broadcast({ type: 'boardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
	} finally {
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
	}
};

// ─── Resume bet ───────────────────────────────────────────────────────────────

const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'spotMultiplierUpdate',
	'freeSpinTrigger',
	'updateFreeSpin',
	'setTotalWin',
];

export const convertTorResumableBet = (betToResume: Bet) => {
	const resumingIndex = Number(betToResume.event);
	const bookEventsBeforeResume = betToResume.state.filter((_, i) => i < resumingIndex);
	const bookEventsAfterResume = betToResume.state.filter((_, i) => i >= resumingIndex);

	const bookEventToCreateSnapshot: BookEventOfType<'createBonusSnapshot'> = {
		index: 0,
		type: 'createBonusSnapshot',
		bookEvents: bookEventsBeforeResume.filter((bookEvent) =>
			BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT.includes(bookEvent.type),
		),
	};

	return { ...betToResume, state: [bookEventToCreateSnapshot, ...bookEventsAfterResume] };
};

// ─── Symbol position helpers ──────────────────────────────────────────────────

/** Pixel X — 7 columns; sprite edges stay inside inner frame (see REEL_STEP_X). */
export const getSymbolX = (reelIndex: number) =>
	SYMBOL_DRAW_HALF + reelIndex * REEL_STEP_X;

const normalizeSymbolName = (name: string) => (name === 'L4' ? 'L1' : name);

export const getSymbolSpriteScale = (name: string) => {
	const id = normalizeSymbolName(name);
	if (id in SYMBOL_SPRITE_SCALE_BY_NAME) return SYMBOL_SPRITE_SCALE_BY_NAME[id];
	return GRAPE_SYMBOL_NAMES.has(id) ? GRAPE_SYMBOL_SPRITE_SCALE : SYMBOL_SPRITE_SCALE;
};

export const getSymbolSpriteSize = (name: string) =>
	SYMBOL_SPRITE_BASE * getSymbolSpriteScale(name);

/** Draw size — scatter keeps portrait aspect; all other symbols stay square. */
export const getSymbolSpriteDimensions = (name: string) => {
	const id = normalizeSymbolName(name);
	if (id === 'S') {
		const height = SYMBOL_SPRITE_BASE * SCATTER_SPRITE_SCALE;
		return { width: height * SCATTER_SPRITE_ASPECT, height };
	}
	const size = getSymbolSpriteSize(name);
	return { width: size, height: size };
};

/** Pixi asset key — L4 nije u mreži 7×7; zeleno grožđe je L1 (sym_l1). */
export const getSymbolAssetKey = (name: string) =>
	`sym_${normalizeSymbolName(name).toLowerCase()}`;

/** Pixel Y — 7 rows; sprite edges stay inside inner frame (see REEL_STEP_Y). */
export const getSymbolY = (symbolIndexOfBoard: number) =>
	SYMBOL_DRAW_HALF + symbolIndexOfBoard * REEL_STEP_Y;

// ─── Symbol colour helper ─────────────────────────────────────────────────────

/** Returns the placeholder fill colour for a given RawSymbol. */
export const getSymbolColor = (rawSymbol: RawSymbol): number =>
	SYMBOL_COLORS[rawSymbol.name] ?? 0x888888;
