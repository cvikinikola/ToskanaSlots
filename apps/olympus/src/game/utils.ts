import _ from 'lodash';
import { stateBet } from 'state-shared';
import { createPlayBookUtils } from 'utils-book';
import { createGetEmptyPaddedBoard } from 'utils-slots';

import { SYMBOL_SIZE, REEL_PADDING, SYMBOL_COLORS, BOARD_DIMENSIONS } from './constants';
import { eventEmitter } from './eventEmitter';
import type { Bet, BookEventOfType } from './typesBookEvent';
import { bookEventHandlerMap } from './bookEventHandlerMap';
import type { RawSymbol, SymbolState } from './types';

// ─── Book utilities ───────────────────────────────────────────────────────────

export const { getEmptyBoard } = createGetEmptyPaddedBoard({ reelsDimensions: BOARD_DIMENSIONS });
export const { playBookEvent, playBookEvents } = createPlayBookUtils({ bookEventHandlerMap });

export const playBet = async (bet: Bet) => {
	stateBet.winBookEventAmount = 0;
	await playBookEvents(bet.state);
	eventEmitter.broadcast({ type: 'stopButtonEnable' });
};

// ─── Resume bet ───────────────────────────────────────────────────────────────

const BOOK_EVENT_TYPES_TO_RESERVE_FOR_SNAPSHOT = [
	'updateGlobalMult',
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

/** Pixel X coordinate for the left edge of reel `reelIndex` (centred in cell). */
export const getSymbolX = (reelIndex: number) => SYMBOL_SIZE * (reelIndex + REEL_PADDING);

/** Pixel Y coordinate for the top edge of visible row `symbolIndexOfBoard` (centred in cell). */
export const getSymbolY = (symbolIndexOfBoard: number) => (symbolIndexOfBoard + 0.5) * SYMBOL_SIZE;

// ─── Symbol colour helper ─────────────────────────────────────────────────────

/** Returns the placeholder fill colour for a given RawSymbol. */
export const getSymbolColor = (rawSymbol: RawSymbol): number =>
	SYMBOL_COLORS[rawSymbol.name] ?? 0x888888;
