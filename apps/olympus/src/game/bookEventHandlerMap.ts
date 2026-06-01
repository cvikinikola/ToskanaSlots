import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';
import { waitForTimeout } from 'utils-shared/wait';
import { bookEventAmountToBetAmountMultiplier } from 'utils-shared/amount';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { BOARD_DIMENSIONS, sanitizePaddedBoard, sanitizeRawSymbol } from './constants';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position, RawSymbol } from './types';
import { buildTumbleBreakdownLine } from './tumbleBreakdown';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const winLevelSoundsPlay = ({ winLevelData }: { winLevelData: WinLevelData }) => {
	if (winLevelData?.alias === 'max') eventEmitter.broadcastAsync({ type: 'uiHide' });
	if (winLevelData?.sound?.sfx) {
		eventEmitter.broadcast({ type: 'soundOnce', name: winLevelData.sound.sfx });
	}
	if (winLevelData?.sound?.bgm) {
		eventEmitter.broadcast({ type: 'soundMusic', name: winLevelData.sound.bgm });
	}
	if (winLevelData?.type === 'big') {
		eventEmitter.broadcast({ type: 'soundLoop', name: 'sfx_bigwin_coinloop' });
	}
};

const winLevelSoundsStop = () => {
	eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_bigwin_coinloop' });
	if (stateGame.gameType === 'freeSpins') {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

/**
 * Triggers win animations on the main board for the given positions.
 * Sets each symbol to 'win' state and awaits the animation completing
 * before marking them as 'postWinStatic'.
 */
const animateSymbols = async ({ positions }: { positions: Position[] }) => {
	eventEmitter.broadcast({ type: 'boardShow' });
	await eventEmitter.broadcastAsync({ type: 'boardWithAnimateSymbols', symbolPositions: positions });
};

const animateTumbleSymbols = async ({ positions }: { positions: Position[] }) => {
	await eventEmitter.broadcastAsync({
		type: 'tumbleBoardWithAnimateSymbols',
		symbolPositions: positions,
	});
};

const emptyAddingBoard = (): RawSymbol[][] =>
	_.range(BOARD_DIMENSIONS.x).map(() => []);

/** Explode one cluster; gravity runs only after the last cluster (tumbleBoard). */
const explodeClusterOnly = async (positions: Position[]) => {
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_explode' });
	await eventEmitter.broadcastAsync({
		type: 'tumbleBoardExplode',
		explodingPositions: positions,
	});
};

const settleTumbleBoard = () => {
	eventEmitter.broadcast({
		type: 'boardSettle',
		board: sanitizePaddedBoard(
			stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((sym) => sym.rawSymbol)),
		),
	});
	eventEmitter.broadcast({ type: 'tumbleBoardReset' });
	eventEmitter.broadcast({ type: 'tumbleBoardHide' });
	eventEmitter.broadcast({ type: 'boardShow' });
};

/** Set when winInfo destroys clusters one-by-one; tumbleBoard only drops new symbols. */
let sequentialClusterTumbleActive = false;

const playWinToBalanceCoins = () => {
	[0, 160, 320, 520].forEach((delay) => {
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' }), delay);
	});
};

// ─── Book event handler map ───────────────────────────────────────────────────

/**
 * Maps each book event type to an async handler function.
 *
 * RULES:
 * - `broadcast()` = fire and forget (component will handle eventually)
 * - `broadcastAsync()` = await until the component resolves the event (animation done)
 * - Handlers run sequentially via `playBookEvents()` queue.
 * - stateGame mutations here are reactive (Svelte 5 $state).
 */
let freeSpinWinBookEventAmount = 0;
let freeSpinTumbleWinBookEventAmount = 0;

const updateRoundWinBookEventAmount = (bookEventAmount: number) => {
	if (stateGame.gameType !== 'freeSpins') {
		stateBet.winBookEventAmount = bookEventAmount;
		return;
	}

	freeSpinTumbleWinBookEventAmount = bookEventAmount;
	stateBet.winBookEventAmount = freeSpinWinBookEventAmount + freeSpinTumbleWinBookEventAmount;
};

const commitFreeSpinTumbleWin = () => {
	freeSpinWinBookEventAmount += freeSpinTumbleWinBookEventAmount;
	freeSpinTumbleWinBookEventAmount = 0;
	stateBet.winBookEventAmount = freeSpinWinBookEventAmount;
};

const getFreeSpinOutroWinLevelData = (amount: number) => {
	const multiplier = bookEventAmountToBetAmountMultiplier(amount);

	if (multiplier >= 100) {
		return { ...winLevelMap[9], presentDuration: 7000 };
	}

	if (multiplier >= 50) {
		return { ...winLevelMap[8], presentDuration: 6000 };
	}

	if (multiplier >= 20) {
		return { ...winLevelMap[6], presentDuration: 5000 };
	}

	return { ...winLevelMap[1], presentDuration: 3000 };
};

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {

	// ── reveal ─────────────────────────────────────────────────────────────────
	// Triggered at the start of every spin / every cascade.
	// `isBonusGame` is true during free spins (multiple reveal events).
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });

		if (bookEvent.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		}

		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: {
				...bookEvent,
				board: sanitizePaddedBoard(bookEvent.board),
			},
			// paddingBoard not used by cascading boards, kept for API compatibility
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// ── winInfo ────────────────────────────────────────────────────────────────
	// Per cluster: highlight → show this cluster's payout → destroy; tumble after last.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		updateRoundWinBookEventAmount(bookEvent.totalWin);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		eventEmitter.broadcast({ type: 'tumbleWinBreakdownShow', lines: [] });

		sequentialClusterTumbleActive = bookEvent.wins.length > 0;

		await sequence(bookEvent.wins, async (win, index) => {
			const line = buildTumbleBreakdownLine(win);

			if (index === 0) {
				await animateSymbols({ positions: win.positions });
			} else {
				await animateTumbleSymbols({ positions: win.positions });
			}

			// One line at a time — only the cluster just highlighted.
			eventEmitter.broadcast({ type: 'tumbleWinBreakdownShow', lines: [line] });
			eventEmitter.broadcast({ type: 'tumbleHistoryAdd', lines: [line] });

			const partialWin = bookEvent.wins.slice(0, index + 1).reduce((sum, w) => sum + w.win, 0);
			await eventEmitter.broadcastAsync({
				type: 'tumbleWinAmountUpdate',
				amount: partialWin,
				animate: false,
			});

			if ((win.meta.spotMult ?? 1) > 1) {
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_win' });
			}

			if (index === 0) {
				eventEmitter.broadcast({ type: 'boardHide' });
				eventEmitter.broadcast({ type: 'tumbleBoardShow' });
				eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: emptyAddingBoard() });
			}

			await explodeClusterOnly(win.positions);

			if (index < bookEvent.wins.length - 1) {
				await waitForTimeout(220);
			}
		});

		if (bookEvent.wins.length > 0) {
			eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		}
	},

	// ── spotMultiplierUpdate ──────────────────────────────────────────────────
	spotMultiplierUpdate: async (bookEvent: BookEventOfType<'spotMultiplierUpdate'>) => {
		const upgraded = bookEvent.spots.some((spot) => spot.multiplier >= 2);
		if (upgraded) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		}
		eventEmitter.broadcast({
			type: 'spotMultipliersSync',
			spots: bookEvent.spots,
		});
	},

	spotMultipliersClear: async () => {
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
	},

	// ── boardMultiplierInfo ───────────────────────────────────────────────────
	// Legacy M-symbol books — no-op for new spot-multiplier math.
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		updateRoundWinBookEventAmount(bookEvent.winInfo.totalWin);
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: bookEvent.winInfo.totalWin,
			animate: true,
		});
	},

	// ── tumbleBoard ────────────────────────────────────────────────────────────
	// Core cascade animation step.
	// Sequence:
	//  1. Hide spinning board, show tumble overlay
	//  2. Init tumble overlay with current board + new symbols
	//  3. Explode winning symbols (particle burst)
	//  4. Slide remaining symbols down to fill gaps
	//  5. Settle the main board with the resulting symbols
	//  6. Hide tumble overlay, show main board
	tumbleBoard: async (bookEvent: BookEventOfType<'tumbleBoard'>) => {
		const addingBoard = bookEvent.newSymbols.map((reel) =>
			reel.map((sym) => sanitizeRawSymbol(sym)),
		);

		if (sequentialClusterTumbleActive) {
			eventEmitter.broadcast({ type: 'tumbleBoardSetAdding', addingBoard });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_fall' });
			await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });
			settleTumbleBoard();
			sequentialClusterTumbleActive = false;
			return;
		}

		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard });

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_explode' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});

		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_fall' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });

		settleTumbleBoard();
	},

	// ── updateTumbleWin ────────────────────────────────────────────────────────
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			updateRoundWinBookEventAmount(bookEvent.amount);
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: bookEvent.amount,
				animate: false,
			});
		}
	},

	// ── setTotalWin ────────────────────────────────────────────────────────────
	setTotalWin: async (bookEvent: BookEventOfType<'setTotalWin'>) => {
		stateBet.winBookEventAmount = bookEvent.amount;
		if (bookEvent.amount > 0) {
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' });
		}
	},

	// ── updateGlobalMult ──────────────────────────────────────────────────────
	// Legacy books only — spot multipliers replaced global M-symbol collection.
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		stateGame.globalMultiplier = bookEvent.globalMult;
		if (bookEvent.globalMult === 1) {
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
	},

	// ── freeSpinTrigger ───────────────────────────────────────────────────────
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		freeSpinWinBookEventAmount = stateBet.winBookEventAmount;
		freeSpinTumbleWinBookEventAmount = 0;
		eventEmitter.broadcast({ type: 'tumbleHistoryReset' });
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		eventEmitter.broadcast({ type: 'winGlowHide' });

		// Animate each scatter one-by-one: butterfly flutter + pop sound per scatter.
		await sequence(bookEvent.positions, async (pos) => {
			eventEmitter.broadcast({ type: 'natureFlutter' });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			await animateSymbols({ positions: [pos] });
			await waitForTimeout(110);
		});

		// All scatters confirmed — nature burst before transition.
		eventEmitter.broadcast({ type: 'natureBurst' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await waitForTimeout(1500);

		// Transition to free spins mode — swap background while screen is black.
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });
		stateGame.gameType = 'freeSpins';

		// Show free spins intro
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});

		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });

		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;

		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},

	// ── freeSpinRetrigger ─────────────────────────────────────────────────────
	// 3+ scatters during free spins → extra spins (same table as base trigger).
	// Animate scatters, show a brief "+N FREE SPINS" panel, bump the counter.
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bird_chirp' }), 350);
		await animateSymbols({ positions: bookEvent.positions });

		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'freeSpinRetriggerShow' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinRetriggerUpdate',
			extraFreeSpins: bookEvent.extraFs,
			totalFreeSpins: bookEvent.totalFs,
		});
		eventEmitter.broadcast({ type: 'freeSpinRetriggerHide' });

		// Reflect the new total on the persistent free-spin counter.
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: stateUi.freeSpinCounterCurrent,
			total: bookEvent.totalFs,
		});
	},

	// ── updateFreeSpin ────────────────────────────────────────────────────────
	updateFreeSpin: async (bookEvent: BookEventOfType<'updateFreeSpin'>) => {
		commitFreeSpinTumbleWin();
		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: bookEvent.amount,
			total: bookEvent.total,
		});
		stateUi.freeSpinCounterCurrent = bookEvent.amount;
		stateUi.freeSpinCounterTotal = bookEvent.total;
	},

	// ── freeSpinEnd ───────────────────────────────────────────────────────────
	freeSpinEnd: async (bookEvent: BookEventOfType<'freeSpinEnd'>) => {
		const winLevelData = getFreeSpinOutroWinLevelData(bookEvent.amount);

		await eventEmitter.broadcastAsync({ type: 'uiHide' });

		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		stateGame.freeSpinOutroActive = true;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_nature_burst' }), 300);
		winLevelSoundsPlay({ winLevelData });

		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});

		stateBet.winBookEventAmount = bookEvent.amount;
		winLevelSoundsStop();
		stateGame.freeSpinOutroActive = false;
		stateGame.gameType = 'basegame';
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		eventEmitter.broadcast({ type: 'winGlowHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		eventEmitter.broadcast({ type: 'tumbleHistoryReset' });

		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	// ── setWin ────────────────────────────────────────────────────────────────
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];

		eventEmitter.broadcast({ type: 'winShow' });
		winLevelSoundsPlay({ winLevelData });
		await eventEmitter.broadcastAsync({
			type: 'winUpdate',
			amount: bookEvent.amount,
			winLevelData,
		});
		winLevelSoundsStop();
		eventEmitter.broadcast({ type: 'winHide' });
	},

	// ── finalWin ──────────────────────────────────────────────────────────────
	finalWin: async (bookEvent: BookEventOfType<'finalWin'>) => {
		if (bookEvent.amount > 0) {
			playWinToBalanceCoins();
		}
		// Spot marks (×2 / golden cells) must not linger until the next spin.
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		eventEmitter.broadcast({ type: 'winGlowHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
	},

	// ── createBonusSnapshot ───────────────────────────────────────────────────
	// Replays a subset of past events to restore visual state during resume.
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		for (const evt of bookEvent.bookEvents) {
			await playBookEvent(evt, { bookEvents: bookEvent.bookEvents });
		}
	},
};
