import _ from 'lodash';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateBet, stateUi } from 'state-shared';
import { sequence } from 'utils-shared/sequence';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';

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
export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {

	// ── reveal ─────────────────────────────────────────────────────────────────
	// Triggered at the start of every spin / every cascade.
	// `isBonusGame` is true during free spins (multiple reveal events).
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });

		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		if (isBonusGame) {
			eventEmitter.broadcast({ type: 'stopButtonEnable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;
		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			// paddingBoard not used by cascading boards, kept for API compatibility
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// ── winInfo ────────────────────────────────────────────────────────────────
	// One or more winning clusters found. Animate each winning group in sequence.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' });
		await sequence(bookEvent.wins, async (win) => {
			await animateSymbols({ positions: win.positions });
		});
	},

	// ── boardMultiplierInfo ───────────────────────────────────────────────────
	// Multiplier symbols (M) are on the board after a winning cascade.
	// Sequence:
	//  1. Update tumble win display to show pre-multiplier win
	//  2. Animate each M symbol's "activate" state on the main board
	//  3. Move multiplier values up to the global multiplier counter
	//  4. Update the global multiplier display
	//  5. Animate the win amount jumping to post-multiplier total
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		// Show the pre-multiplier tumble win
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: bookEvent.winInfo.tumbleWin,
			animate: false,
		});

		// Animate each multiplier symbol on the main board (they glow/bounce)
		await animateSymbols({ positions: bookEvent.multInfo.positions });

		// Update the global multiplier counter display
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.winInfo.boardMult,
		});

		// Animate the tumble win counter to the post-multiplier total
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_win' });
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
		eventEmitter.broadcast({ type: 'boardHide' });
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });

		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_explode' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleBoardExplode',
			explodingPositions: bookEvent.explodingSymbols,
		});

		eventEmitter.broadcast({ type: 'tumbleBoardRemoveExploded' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_tumble_fall' });
		await eventEmitter.broadcastAsync({ type: 'tumbleBoardSlideDown' });

		// Settle the main board using the resulting tumble board symbols
		eventEmitter.broadcast({
			type: 'boardSettle',
			board: stateGameDerived
				.tumbleBoardCombined()
				.map((tumbleReel) => tumbleReel.map((sym) => sym.rawSymbol)),
		});

		eventEmitter.broadcast({ type: 'tumbleBoardReset' });
		eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		eventEmitter.broadcast({ type: 'boardShow' });
	},

	// ── updateTumbleWin ────────────────────────────────────────────────────────
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
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
	updateGlobalMult: async (bookEvent: BookEventOfType<'updateGlobalMult'>) => {
		stateGame.globalMultiplier = bookEvent.globalMult;
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		if (bookEvent.globalMult === 1) {
			// Reset means a new free spin cascade cycle
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.globalMult,
		});
	},

	// ── freeSpinTrigger ───────────────────────────────────────────────────────
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		// Animate each scatter one-by-one: individual lightning bolt + pop sound per scatter.
		// This gives the player clear visual feedback for each one landing.
		await sequence(bookEvent.positions, async (pos) => {
			eventEmitter.broadcast({ type: 'lightningStrike', durationMs: 280 });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			await animateSymbols({ positions: [pos] });
			await waitForTimeout(110);
		});

		// All scatters confirmed — unleash the storm before transition.
		eventEmitter.broadcast({ type: 'scatterStorm' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		if (bookEvent.positions.length >= 4) {
			// First boom — thunder travels slower than lightning
			setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder' }), 420);
			// Second rolling thunder as the storm builds
			setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder' }), 1050);
		}
		await waitForTimeout(1500);

		// Transition to free spins mode
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });

		// Show free spins intro
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'jng_intro_fs' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});

		// Switch game mode
		stateGame.gameType = 'freeSpins';
		stateGame.globalMultiplier = 1;

		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier: 1 });

		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;

		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerButtonShow' });
		eventEmitter.broadcast({ type: 'drawerFold' });
	},

	// ── freeSpinRetrigger ─────────────────────────────────────────────────────
	// 3+ scatters during free spins → +N extra spins.
	// Animate scatters, show a brief "+N FREE SPINS" panel, bump the counter.
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Thunder strike on retrigger — it's an exciting moment
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder' }), 350);
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
		// winLevel 0 is not in the map — fall back to level 1 (no win presentation)
		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel] ?? winLevelMap[1];

		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		stateGame.gameType = 'basegame';
		stateGame.globalMultiplier = 1;

		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		stateGame.freeSpinOutroActive = true;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		// Thunder boom as the free-spin finale
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder' }), 300);
		winLevelSoundsPlay({ winLevelData });

		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
			winLevelData,
		});

		winLevelSoundsStop();
		stateGame.freeSpinOutroActive = false;
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });

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
			setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' }), 420);
		}
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
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
