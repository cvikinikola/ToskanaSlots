import _ from 'lodash';
import { tick } from 'svelte';

import { recordBookEvent, checkIsMultipleRevealEvents, type BookEventHandlerMap } from 'utils-book';
import { stateSlots } from 'utils-slots';
import { stateBet, stateUi, stateBetDerived } from 'state-shared';
import { sequence } from 'utils-shared/sequence';
import { waitForTimeout } from 'utils-shared/wait';

import { eventEmitter } from './eventEmitter';
import { playBookEvent } from './utils';
import { winLevelMap, type WinLevel, type WinLevelData } from './winLevelMap';
import {
	getCelebrationTierByAmount,
	resolveGridWinCelebrationAmount,
} from './winCelebration';
import { applyPanelChromeUiState } from './betControlsForeground';
import {
	getGridWinCelebrationDurationMs,
	getGridWinCelebrationSoundName,
} from './winCelebrationAudio';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { TUMBLE_OPTIONS, TURBO_NO_WIN_SETTLE_MS } from './constants';
import config from './config';
import { buildTumbleBreakdownLine } from './tumbleBreakdown';
import type { BookEvent, BookEventOfType, BookEventContext } from './typesBookEvent';
import type { Position } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPIN_BOUNDARY_EVENT_TYPES = new Set([
	'reveal',
	'updateFreeSpin',
	'setTotalWin',
	'freeSpinEnd',
]);

/** True when this reveal is followed by at least one winInfo before the next spin ends. */
const revealSpinHasWin = (
	bookEvents: BookEvent[],
	revealEvent: BookEventOfType<'reveal'>,
) => {
	const sorted = [...bookEvents].sort((a, b) => a.index - b.index);
	const start = sorted.findIndex((e) => e.index === revealEvent.index);
	if (start === -1) return false;
	for (const e of sorted.slice(start + 1)) {
		if (SPIN_BOUNDARY_EVENT_TYPES.has(e.type)) break;
		if (e.type === 'winInfo') return true;
	}
	return false;
};

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
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	} else {
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
	}
	eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const playBigWinCelebration = async (amount: number, winLevelData: WinLevelData) => {
	const duration = await getGridWinCelebrationDurationMs(winLevelData);
	const soundName = getGridWinCelebrationSoundName(winLevelData);
	await eventEmitter.broadcastAsync({ type: 'uiHide' });
	eventEmitter.broadcast({ type: 'bigWinCelebrationShow', winLevelData });
	eventEmitter.broadcast({ type: 'soundOnce', name: soundName });
	await eventEmitter.broadcastAsync({
		type: 'bigWinCelebrationUpdate',
		amount,
		winLevelData,
		duration,
	});
	eventEmitter.broadcast({ type: 'soundStop', name: soundName });
	eventEmitter.broadcast({ type: 'bigWinCelebrationHide' });
	await eventEmitter.broadcastAsync({ type: 'uiShow' });
};

const tryPlayGridWinCelebration = async (
	amount: number,
	options?: { inFreeSpins?: boolean },
) => {
	if (amount <= 0) return;
	if (bigWinCelebrationPlayedThisRound) return;
	if (stateGame.freeSpinIntroActive || stateGame.freeSpinOutroActive || stateGame.transitionActive) {
		return;
	}
	if (options?.inFreeSpins) {
		if (stateGame.gameType !== 'freeSpins') return;
	} else if (stateGame.gameType !== 'basegame') {
		return;
	}
	const tier = getCelebrationTierByAmount(amount);
	if (!tier) return;
	bigWinCelebrationPlayedThisRound = true;
	await playBigWinCelebration(amount, tier);
};

const tryPlayBigWinCelebration = async (amount: number) => {
	await tryPlayGridWinCelebration(amount);
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

// QA 03.06.2026: tokom spina prikazujemo SIROVE (winWithoutMult) vrednosti u
// TumbleHistory i TumbleWinAmount panelu — ranije su iznosi bili odmah
// pomnoženi globalnim multiplikatorom (npr. 8×T = 0.5 je prikazivano kao 1.0
// pri globalMult=2). Na kraju spina (`finalWin`) animiramo množenje
// (raw×globalMult) tako da igrač vidi finalni iznos.
let spinRawWinAmount = 0;
let dekaSaluteTriggeredThisSpin = false;
let bigWinCelebrationPlayedThisRound = false;
/** Per-spin grid-win celebrations run during FS; skip duplicate in `finalWin`. */
let bonusRoundGridWinCelebrationsActive = false;

const getSpinGridWinCelebrationAmount = () =>
	resolveGridWinCelebrationAmount(freeSpinTumbleWinBookEventAmount, spinEndMultiply);

const resetSpinRawWinAmount = () => {
	spinRawWinAmount = 0;
	dekaSaluteTriggeredThisSpin = false;
	bigWinCelebrationPlayedThisRound = false;
};

// QA 05.06.2026: množenje se prikazuje na KRAJU SPINA (ne odmah). Tokom spina
// TumbleHistory i TumbleWinAmount panel pokazuju SIROVE iznose; ovde čuvamo
// podatke za animaciju (sirovo → pomnoženo) koja se okida na kraju SVAKOG spina:
//  - base game: zabeleženo u `boardMultiplierInfo`, odigrano u `finalWin`
//  - free spins: zabeleženo u `winInfo`, odigrano u `updateFreeSpin` (sledeći
//    spin) odnosno `freeSpinEnd` (poslednji spin).
let spinEndMultiply: { raw: number; multiplied: number; multiplier: number } | null = null;

const triggerDekaSalute = () => {
	if (stateGame.freeSpinIntroActive || stateGame.freeSpinOutroActive || stateGame.transitionActive) {
		return;
	}
	if (dekaSaluteTriggeredThisSpin) return;
	dekaSaluteTriggeredThisSpin = true;
	eventEmitter.broadcast({ type: 'dekaSalute' });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_deka_salute' });
};

const hasMoreTumbleCascades = (bookEvent: { index: number }, bookEvents: BookEvent[]) => {
	// Free-spin books contain many spins — only look within the current spin
	// (events before the next `reveal`), not at winInfo from later spins.
	const nextRevealIndex =
		bookEvents.find((event) => event.index > bookEvent.index && event.type === 'reveal')
			?.index ?? Number.POSITIVE_INFINITY;

	return bookEvents.some(
		(event) =>
			event.index > bookEvent.index &&
			event.index < nextRevealIndex &&
			event.type === 'winInfo',
	);
};

const playSpinEndMultiply = async (): Promise<{ animated: boolean; finalAmount: number | null }> => {
	const data = spinEndMultiply;
	spinEndMultiply = null;
	if (!data) return { animated: false, finalAmount: null };
	const shouldAnimate =
		data.multiplier > 1 && data.multiplied > data.raw && data.raw > 0;
	if (!shouldAnimate) {
		return { animated: false, finalAmount: data.multiplied };
	}

	eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
	eventEmitter.broadcast({ type: 'tumbleWinAmountShowMultiplier', multiplier: data.multiplier });
	// GoO-stil: veliki sjajni ×N orb iskoči u centru ploče i odleti u
	// TumbleWinAmount panel — pa tek onda kre\u0107e count-up mno\u017eenja, da igra\u010du
	// bude jasno da se dobitak mno\u017ei.
	await eventEmitter.broadcastAsync({ type: 'multiplierFly', multiplier: data.multiplier });
	eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_win' });
	// Pulse + gold flash da igrač jasno vidi da je iznos pomnožen.
	eventEmitter.broadcast({ type: 'tumbleWinAmountPulse' });
	await eventEmitter.broadcastAsync({
		type: 'tumbleWinAmountUpdate',
		amount: data.multiplied,
		animate: true,
	});
	eventEmitter.broadcast({ type: 'tumbleWinAmountHideMultiplier' });
	return { animated: true, finalAmount: data.multiplied };
};

const resolveSpinCelebrationAmount = async () => {
	const preAmount = Math.max(
		getSpinGridWinCelebrationAmount(),
		freeSpinTumbleWinBookEventAmount,
	);
	const { animated, finalAmount } = await playSpinEndMultiply();
	if (animated) await waitForTimeout(stateBet.isTurbo ? 350 : 700);
	return finalAmount != null ? Math.max(preAmount, finalAmount) : preAmount;
};

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

export const bookEventHandlerMap: BookEventHandlerMap<BookEvent, BookEventContext> = {

	// ── reveal ─────────────────────────────────────────────────────────────────
	// Triggered at the start of every spin / every cascade.
	// `isBonusGame` is true during free spins (multiple reveal events).
	reveal: async (bookEvent: BookEventOfType<'reveal'>, { bookEvents }: BookEventContext) => {
		eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		eventEmitter.broadcast({ type: 'tumbleHistoryReset' });
		resetSpinRawWinAmount();
		spinEndMultiply = null;
		// QA 02.06.2026: defensively reset any lingering 'win' symbol states
		// from the previous round so a gold glow can never bleed into the new
		// spin's symbols (was visible on turbo when the multiplier sequence
		// was still in flight as the next round began).
		stateGame.board.forEach((reel) => {
			reel.reelState.symbols.forEach((reelSymbol) => {
				reelSymbol.symbolState = 'static';
				reelSymbol.oncomplete = () => {};
			});
		});

		const isBonusGame = checkIsMultipleRevealEvents({ bookEvents });
		// Do not set activeRevealBoard before preSpin — matches base game where
		// preSpin runs before reveal. Early board lets STOP settle then spin()
		// re-runs fallOut and symbols vanish off-screen.
		stateSlots.skipStopRequested = false;
		stateSlots.spinStopSettled = false;

		if (isBonusGame) {
			// STOP turbo from the previous free spin does not carry over.
			stateBetDerived.updateIsTurbo(false, { persistent: false });
			recordBookEvent({ bookEvent });
			eventEmitter.broadcast({ type: 'stopButtonAllowClick' });
		}

		stateGame.gameType = bookEvent.gameType;

		const isFreeSpinReveal = bookEvent.gameType === 'freeSpins';

		// Sugar Rush: na POČETKU svakog free spina prikaži preostale spinove;
		// sakrij čim krene animacija (preSpin/spin), winInfo zamenjuje dobitkom.
		if (isFreeSpinReveal) {
			const current = stateUi.freeSpinCounterCurrent || 0;
			const remaining = Math.max(0, stateUi.freeSpinCounterTotal - current + 1);
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			eventEmitter.broadcast({ type: 'tumbleWinSpinRemainingShow', remaining });
		}

		// Free spins: each reveal starts a new spin (onNewGameStart does not run between them).
		if (isFreeSpinReveal) {
			eventEmitter.broadcast({ type: 'soundReelSpin' });
		}

		// Free spins live inside one long `playGame` call — `onNewGameStart`
		// preSpin never runs between them. Run preSpin here so reel fallOut /
		// fallIn match a normal spin (staggered unless turbo is on).
		if (isFreeSpinReveal) {
			await stateGameDerived.enhancedBoard.preSpin({
				paddingBoard: config.paddingReels.freeSpins,
			});
			eventEmitter.broadcast({ type: 'tumbleWinSpinRemainingHide' });
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			// paddingBoard not used by cascading boards, kept for API compatibility
		});

		// Turbo: brief pause on dead spins so fruits read before the next spin chains.
		if (stateBet.isTurbo && !revealSpinHasWin(bookEvents, bookEvent)) {
			await waitForTimeout(TURBO_NO_WIN_SETTLE_MS);
		}

		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// ── winInfo ────────────────────────────────────────────────────────────────
	// One or more winning clusters found. Animate each winning group in sequence.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		updateRoundWinBookEventAmount(bookEvent.totalWin);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' });

		eventEmitter.broadcast({ type: 'tumbleWinSpinRemainingHide' });

		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		eventEmitter.broadcast({
			type: 'tumbleWinBreakdownShow',
			lines: bookEvent.wins.map(buildTumbleBreakdownLine),
			multiCluster: bookEvent.wins.length > 1,
		});

		// QA 03.06.2026: tokom free spina prikazujemo SIROVE (winWithoutMult)
		// iznose — globalMult se množi tek na kraju spina u `finalWin`.
		const rawCascadeWin = bookEvent.wins.reduce(
			(sum, win) => sum + win.meta.winWithoutMult,
			0,
		);
		spinRawWinAmount += rawCascadeWin;

		// QA 05.06.2026: zabeleži množenje za KRAJ SPINA (po spinu, ne odmah).
		// U jednom free spinu svi cascade-i dele isti globalMult, pa je
		// (sirovi zbir × globalMult) === server `totalWin`. Čuvamo poslednje
		// vrednosti; animacija se odigrava u `updateFreeSpin`/`freeSpinEnd`.
		if (stateGame.gameType === 'freeSpins') {
			const spinMultiplier = Math.max(1, bookEvent.wins[0]?.meta.globalMult ?? 1);
			const raw = spinRawWinAmount;
			const tumbleTotal = bookEvent.totalWin;
			let multiplied = Math.max(tumbleTotal, raw);
			if (spinMultiplier > 1 && raw > 0) {
				multiplied = Math.max(multiplied, Math.round(raw * spinMultiplier));
			}
			spinEndMultiply = {
				raw,
				multiplied,
				multiplier: spinMultiplier,
			};
		}

		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: spinRawWinAmount,
			animate: false,
		});
		eventEmitter.broadcast({
			type: 'tumbleHistoryAdd',
			lines: bookEvent.wins.map(buildTumbleBreakdownLine),
		});
		// QA 02.06.2026: on turbo, animating each cluster sequentially felt
		// laggy compared to a normal spin. Collapse all winning clusters into
		// a single parallel animation so the whole win flashes at once.
		if (stateGameDerived.useTurboPacing()) {
			await animateSymbols({
				positions: bookEvent.wins.flatMap((win) => win.positions),
			});
		} else {
			await sequence(bookEvent.wins, async (win) => {
				await animateSymbols({ positions: win.positions });
			});
		}

		// Let the player read the tumble-win amount before cascade destroy starts.
		await waitForTimeout(
			stateGameDerived.useTurboPacing()
				? TUMBLE_OPTIONS.winSettleHoldTurboMs
				: TUMBLE_OPTIONS.winSettleHoldMs,
		);
	},

	// ── boardMultiplierInfo ───────────────────────────────────────────────────
	// Multiplier symbols (M) are on the board after a winning cascade.
	// Sequence (matches Gates-of-Olympus reference, per QA 02.06.2026):
	//  1. Snap tumble-win panel to pre-multiplier RAW win
	//  2. Show "×" overlay starting at 0 (panel reads `WIN $X ×0`)
	//  3. For each M symbol on the board in turn:
	//       a. animate that symbol (glow/bounce)
	//       b. add its value to the running board multiplier and update
	//          the overlay so the player sees it grow (e.g. ×2 → ×4 → ×8)
	//  4. Flash the global multiplier counter with the final boardMult
	//  5. QA 05.06.2026: keep the panel RAW and the "× N" overlay visible —
	//     the actual multiply count-up (raw → totalWin) is deferred to the END
	//     of the spin (`finalWin` → `playSpinEndMultiply()`), NOT applied here.
	boardMultiplierInfo: async (bookEvent: BookEventOfType<'boardMultiplierInfo'>) => {
		updateRoundWinBookEventAmount(bookEvent.winInfo.tumbleWin);

		// QA 03.06.2026: panel prikazuje SIROVI tumble win (bez globalMult).
		// spinRawWinAmount je već osvežen u prethodnom `winInfo` handleru.
		const rawPreMultiplier = spinRawWinAmount;

		// (1) Snap to pre-multiplier RAW tumble win
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: rawPreMultiplier,
			animate: false,
		});

		// (2) Reveal the "× N" overlay starting at 0
		eventEmitter.broadcast({ type: 'tumbleWinAmountShowMultiplier', multiplier: 0 });

		// (3) Reveal each M-symbol multiplier, accumulating into the panel.
		// Normal mode: animate one M at a time (Gates-of-Olympus pacing).
		// Turbo (QA 02.06.2026): glow all M symbols in parallel and snap the
		// running multiplier to the final value — otherwise the per-symbol
		// sequence spilled into the next spin and left a gold glow behind.
		if (stateGameDerived.useTurboPacing()) {
			await animateSymbols({ positions: bookEvent.multInfo.positions });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
			eventEmitter.broadcast({
				type: 'tumbleWinAmountShowMultiplier',
				multiplier: bookEvent.winInfo.boardMult,
			});
		} else {
			let runningMult = 0;
			for (const mPosition of bookEvent.multInfo.positions) {
				await animateSymbols({ positions: [mPosition] });
				runningMult += mPosition.multiplier;
				eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
				eventEmitter.broadcast({
					type: 'tumbleWinAmountShowMultiplier',
					multiplier: runningMult,
				});
			}
		}

		// (4) Flash the persistent global multiplier counter with the final board mult
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.winInfo.boardMult,
		});

		// (5) QA 05.06.2026: NE množimo panel odmah tokom spina. "× N" overlay
		// ostaje vidljiv (igrač vidi koliko je multiplikatora skupljeno), ali
		// iznos panela ostaje SIROV. Stvarno množenje (count-up raw → totalWin)
		// odigrava se na KRAJU SPINA u `finalWin` preko `playSpinEndMultiply()`.
		updateRoundWinBookEventAmount(bookEvent.winInfo.totalWin);
		spinEndMultiply = {
			raw: rawPreMultiplier,
			multiplied: bookEvent.winInfo.totalWin,
			multiplier: bookEvent.winInfo.boardMult,
		};
	},

	// ── spotMultiplierUpdate ───────────────────────────────────────────────────
	// Grid-position multipliers (Sugar Rush). Emitted after explosions, before
	// tumbleBoard — spots must survive refill/drop and only clear when the full
	// tumble sequence ends (finalWin / freeSpinEnd), never mid-cascade.
	spotMultiplierUpdate: async (bookEvent: BookEventOfType<'spotMultiplierUpdate'>) => {
		eventEmitter.broadcast({ type: 'spotMultiplierUpdate', spots: bookEvent.spots });
	},

	spotMultipliersClear: async () => {
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });
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
	tumbleBoard: async (
		bookEvent: BookEventOfType<'tumbleBoard'>,
		{ bookEvents }: BookEventContext,
	) => {
		// Paint tumble overlay before hiding the main board — boardHide first caused
		// a blank frame where non-winning symbols (esp. bottom row) vanished in QA.
		eventEmitter.broadcast({ type: 'tumbleBoardShow' });
		eventEmitter.broadcast({ type: 'tumbleBoardInit', addingBoard: bookEvent.newSymbols });
		await tick();
		eventEmitter.broadcast({ type: 'boardHide' });

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

		if (!hasMoreTumbleCascades(bookEvent, bookEvents) && spinRawWinAmount > 0) {
			triggerDekaSalute();
		}
	},

	// ── updateTumbleWin ────────────────────────────────────────────────────────
	updateTumbleWin: async (bookEvent: BookEventOfType<'updateTumbleWin'>) => {
		if (bookEvent.amount > 0) {
			updateRoundWinBookEventAmount(bookEvent.amount);
			if (stateGame.gameType === 'freeSpins' && spinEndMultiply) {
				spinEndMultiply = {
					...spinEndMultiply,
					multiplied: Math.max(spinEndMultiply.multiplied, bookEvent.amount),
				};
			}
			eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
			// QA 03.06.2026: server `amount` ovde uključuje globalMult tokom free
			// spina; mi prikazujemo SIROVI iznos (ažuriran u `winInfo`/
			// `boardMultiplierInfo`). Tako da koristimo spinRawWinAmount kao
			// source-of-truth, a server `amount` samo za računsku živu vrednost.
			eventEmitter.broadcast({
				type: 'tumbleWinAmountUpdate',
				amount: spinRawWinAmount,
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
		if (bookEvent.globalMult === 0) {
			// Reset (start of a new free-spin round) — clear the tumble win counter.
			eventEmitter.broadcast({ type: 'tumbleWinAmountReset' });
		}
		await eventEmitter.broadcastAsync({
			type: 'globalMultiplierUpdate',
			multiplier: bookEvent.globalMult,
		});
	},

	// ── freeSpinTrigger ───────────────────────────────────────────────────────
	freeSpinTrigger: async (bookEvent: BookEventOfType<'freeSpinTrigger'>) => {
		bonusRoundGridWinCelebrationsActive = true;
		freeSpinWinBookEventAmount = stateBet.winBookEventAmount;
		freeSpinTumbleWinBookEventAmount = 0;
		spinEndMultiply = null;
		eventEmitter.broadcast({ type: 'tumbleHistoryReset' });
		// Base-game tumble ended — free spins start with a fresh spot grid.
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });

		// Animate each scatter one-by-one: individual lightning bolt + pop sound per scatter.
		// This gives the player clear visual feedback for each one landing.
		await sequence(bookEvent.positions, async (pos) => {
			eventEmitter.broadcast({ type: 'lightningStrike', durationMs: 280 });
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_mark' });
			await animateSymbols({ positions: [pos] });
			await waitForTimeout(110);
		});

		// All scatters confirmed — unleash the storm before transition.
		eventEmitter.broadcast({ type: 'scatterStorm' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
		await waitForTimeout(1500);

		// Transition to free spins mode — suppress deka/BET chrome before panel (outside UI fade).
		stateGame.freeSpinIntroActive = true;
		applyPanelChromeUiState();
		await eventEmitter.broadcastAsync({ type: 'uiHide' });
		await eventEmitter.broadcastAsync({ type: 'transition' });

		// Intro sting (free_spin_intro.mp3); Nova returns when animation ends.
		eventEmitter.broadcast({ type: 'freeSpinIntroShow' });
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_freespin' });
		await eventEmitter.broadcastAsync({
			type: 'freeSpinIntroUpdate',
			totalFreeSpins: bookEvent.totalFs,
		});
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });

		// Switch game mode
		stateGame.gameType = 'freeSpins';
		stateGame.globalMultiplier = 0;

		eventEmitter.broadcast({ type: 'freeSpinIntroHide' });
		eventEmitter.broadcast({ type: 'globalMultiplierShow' });
		await eventEmitter.broadcastAsync({ type: 'globalMultiplierUpdate', multiplier: 0 });

		eventEmitter.broadcast({ type: 'freeSpinCounterShow' });
		stateUi.freeSpinCounterShow = true;
		eventEmitter.broadcast({
			type: 'freeSpinCounterUpdate',
			current: undefined,
			total: bookEvent.totalFs,
		});
		stateUi.freeSpinCounterTotal = bookEvent.totalFs;

		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		// QA: keep Balance + spin/stop visible during free spins exactly like
		// in base game. Do NOT fold the drawer and do NOT show the toggle
		// arrow button — all UI elements stay in place on every device.
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
		eventEmitter.broadcast({ type: 'drawerUnfold' });
	},

	// ── freeSpinRetrigger ─────────────────────────────────────────────────────
	// 3+ scatters during free spins → +N extra spins.
	// Animate scatters, show a brief "+N FREE SPINS" panel, bump the counter.
	freeSpinRetrigger: async (bookEvent: BookEventOfType<'freeSpinRetrigger'>) => {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
		// Thunder strike on retrigger — it's an exciting moment
		setTimeout(() => eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder' }), 350);
		await animateSymbols({ positions: bookEvent.positions });

		stateGame.freeSpinIntroActive = true;
		applyPanelChromeUiState();
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
		// QA 05.06.2026: na kraju PRETHODNOG spina odigraj animaciju množenja
		// (sirovo → pomnoženo) pre nego što commit-ujemo dobitak u WIN i pre nego
		// što sledeći `reveal` resetuje panel.
		const celebrationAmount = await resolveSpinCelebrationAmount();

		// Grid win (Bravo) — per spin only; FS outro keeps its own panel/music.
		await tryPlayGridWinCelebration(celebrationAmount, { inFreeSpins: true });

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
		// Poslednji spin nema `updateFreeSpin` posle sebe — množenje + grid-win
		// celebration moraju ovde, PRE outro panela.
		const celebrationAmount = await resolveSpinCelebrationAmount();

		await tryPlayGridWinCelebration(celebrationAmount, { inFreeSpins: true });
		commitFreeSpinTumbleWin();

		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });
		eventEmitter.broadcast({ type: 'tumbleWinSpinRemainingShow', remaining: 0 });
		await waitForTimeout(stateBet.isTurbo ? 400 : 800);
		eventEmitter.broadcast({ type: 'tumbleWinSpinRemainingHide' });

		await eventEmitter.broadcastAsync({ type: 'uiHide' });

		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		stateGame.freeSpinOutroActive = true;
		applyPanelChromeUiState();
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });

		await eventEmitter.broadcastAsync({
			type: 'freeSpinOutroCountUp',
			amount: bookEvent.amount,
		});

		stateBet.winBookEventAmount = bookEvent.amount;
		stateGame.gameType = 'basegame';
		stateSlots.activeRevealBoard = undefined;
		stateSlots.skipStopRequested = false;
		stateSlots.spinStopSettled = false;
		eventEmitter.broadcast({ type: 'soundMusic', name: 'bgm_main' });
		stateGame.globalMultiplier = 0;
		// Restore STOP button so base-game spins can be interrupted again.
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
		stateGame.freeSpinOutroActive = false;
		applyPanelChromeUiState();
		eventEmitter.broadcast({ type: 'freeSpinCounterHide' });
		stateUi.freeSpinCounterShow = false;
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountHide' });
		eventEmitter.broadcast({ type: 'tumbleHistoryReset' });
		eventEmitter.broadcast({ type: 'spotMultipliersClear' });

		await eventEmitter.broadcastAsync({ type: 'transition' });
		await eventEmitter.broadcastAsync({ type: 'uiShow' });
		await eventEmitter.broadcastAsync({ type: 'drawerUnfold' });
		eventEmitter.broadcast({ type: 'drawerButtonHide' });
	},

	// ── setWin ────────────────────────────────────────────────────────────────
	setWin: async (bookEvent: BookEventOfType<'setWin'>) => {
		if (stateGame.gameType !== 'basegame') return;

		const celebrationTier = getCelebrationTierByAmount(bookEvent.amount);
		if (celebrationTier) {
			if (!bigWinCelebrationPlayedThisRound) {
				bigWinCelebrationPlayedThisRound = true;
				await playBigWinCelebration(bookEvent.amount, celebrationTier);
			}
			return;
		}

		const winLevelData = winLevelMap[bookEvent.winLevel as WinLevel];
		if (!winLevelData) return;

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
		// Base game ≥10×/30×/100× — not after FS (per-spin Bravo already ran in bonus).
		if (
			stateGame.gameType === 'basegame' &&
			bookEvent.amount > 0 &&
			!bonusRoundGridWinCelebrationsActive
		) {
			await tryPlayBigWinCelebration(bookEvent.amount);
		}
		bonusRoundGridWinCelebrationsActive = false;
		// Simboli su stali — spin dugme posle celebration-a.
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
		if (bookEvent.amount > 0) {
			playWinToBalanceCoins();
		}
		if (spinRawWinAmount > 0 || bookEvent.amount > 0) {
			triggerDekaSalute();
		}
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		// Base game: tumble sequence finished — reset spot markers for next spin.
		if (stateGame.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		}
		// Animacija množenja u pozadini — ne blokira spin dugme.
		void playSpinEndMultiply();
	},

	// ── createBonusSnapshot ───────────────────────────────────────────────────
	// Replays a subset of past events to restore visual state during resume.
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		for (const evt of bookEvent.bookEvents) {
			await playBookEvent(evt, { bookEvents: bookEvent.bookEvents });
		}
	},
};
