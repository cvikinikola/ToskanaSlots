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
const resetSpinRawWinAmount = () => {
	spinRawWinAmount = 0;
};

// QA 05.06.2026: množenje se prikazuje na KRAJU SPINA (ne odmah). Tokom spina
// TumbleHistory i TumbleWinAmount panel pokazuju SIROVE iznose; ovde čuvamo
// podatke za animaciju (sirovo → pomnoženo) koja se okida na kraju SVAKOG spina:
//  - base game: zabeleženo u `boardMultiplierInfo`, odigrano u `finalWin`
//  - free spins: zabeleženo u `winInfo`, odigrano u `updateFreeSpin` (sledeći
//    spin) odnosno `freeSpinEnd` (poslednji spin).
let spinEndMultiply: { raw: number; multiplied: number; multiplier: number } | null = null;

const playSpinEndMultiply = async (): Promise<boolean> => {
	const data = spinEndMultiply;
	spinEndMultiply = null;
	if (!data) return false;
	// Ako nema stvarnog multiplikatora (×1) ili pomnoženi iznos nije veći od
	// sirovog, nema šta da se animira.
	if (!(data.multiplier > 1 && data.multiplied > data.raw && data.raw > 0)) return false;

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
	return true;
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
		if (isBonusGame) {
			// QA: during free spins the STOP button must stay disabled (greyed
			// out) like +/- — players cannot interrupt the auto-played sequence.
			eventEmitter.broadcast({ type: 'stopButtonDisable' });
			recordBookEvent({ bookEvent });
		}

		stateGame.gameType = bookEvent.gameType;

		// Play spin sound only on the first reveal of each round.
		// Cascade re-reveals share the same bookEvents array but have a higher
		// index — we detect them by checking for any prior reveal event.
		const isFirstReveal = !bookEvents.some(
			(e) => e.type === 'reveal' && e.index < bookEvent.index,
		);
		if (isFirstReveal) {
			eventEmitter.broadcast({ type: 'soundReelSpin' });
		}

		await stateGameDerived.enhancedBoard.spin({
			revealEvent: bookEvent,
			// paddingBoard not used by cascading boards, kept for API compatibility
		});
		eventEmitter.broadcast({ type: 'soundScatterCounterClear' });
	},

	// ── winInfo ────────────────────────────────────────────────────────────────
	// One or more winning clusters found. Animate each winning group in sequence.
	winInfo: async (bookEvent: BookEventOfType<'winInfo'>) => {
		updateRoundWinBookEventAmount(bookEvent.totalWin);
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_winlevel_small' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_coin_clink' });
		eventEmitter.broadcast({ type: 'tumbleWinAmountShow' });

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
			const spinMultiplier = bookEvent.wins[0]?.meta.globalMult ?? stateGame.globalMultiplier;
			spinEndMultiply = {
				raw: spinRawWinAmount,
				multiplied: bookEvent.totalWin,
				multiplier: spinMultiplier,
			};
		}

		await eventEmitter.broadcastAsync({
			type: 'tumbleWinAmountUpdate',
			amount: spinRawWinAmount,
			animate: false,
		});
		eventEmitter.broadcast({
			type: 'tumbleWinBreakdownShow',
			lines: bookEvent.wins.map((win) => ({
				count: win.positions.length,
				symbol: win.symbol,
				amount: win.meta.winWithoutMult,
			})),
		});
		eventEmitter.broadcast({
			type: 'tumbleHistoryAdd',
			lines: bookEvent.wins.map((win) => ({
				count: win.positions.length,
				symbol: win.symbol,
				amount: win.meta.winWithoutMult,
			})),
		});
		// QA 02.06.2026: on turbo, animating each cluster sequentially felt
		// laggy compared to a normal spin. Collapse all winning clusters into
		// a single parallel animation so the whole win flashes at once.
		if (stateBet.isTurbo) {
			await animateSymbols({
				positions: bookEvent.wins.flatMap((win) => win.positions),
			});
		} else {
			await sequence(bookEvent.wins, async (win) => {
				await animateSymbols({ positions: win.positions });
			});
		}
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
		if (stateBet.isTurbo) {
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
			updateRoundWinBookEventAmount(bookEvent.amount);
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
			eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_scatter_win_v2' });
			await animateSymbols({ positions: [pos] });
			await waitForTimeout(110);
		});

		// All scatters confirmed — unleash the storm before transition.
		eventEmitter.broadcast({ type: 'scatterStorm' });
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_superfreespin' });
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
		// QA 05.06.2026: na kraju PRETHODNOG spina odigraj animaciju množenja
		// (sirovo → pomnoženo) pre nego što commit-ujemo dobitak u WIN i pre nego
		// što sledeći `reveal` resetuje panel.
		const didMultiply = await playSpinEndMultiply();
		if (didMultiply) await waitForTimeout(stateBet.isTurbo ? 350 : 700);
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
		// QA 05.06.2026: poslednji free spin nema `updateFreeSpin` posle sebe —
		// odigraj njegovu animaciju množenja ovde, pre outro count-upa.
		if (await playSpinEndMultiply()) {
			await waitForTimeout(stateBet.isTurbo ? 350 : 700);
		}
		const winLevelData = getFreeSpinOutroWinLevelData(bookEvent.amount);

		await eventEmitter.broadcastAsync({ type: 'uiHide' });

		eventEmitter.broadcast({ type: 'freeSpinOutroShow' });
		stateGame.freeSpinOutroActive = true;
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_youwon_panel' });
		// The thunder boom now lands when the money count-up FINISHES (fired from
		// FreeSpinOutro), so the finale strike coincides with the final total.
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
		stateGame.globalMultiplier = 0;
		// Restore STOP button so base-game spins can be interrupted again.
		eventEmitter.broadcast({ type: 'stopButtonEnable' });
		eventEmitter.broadcast({ type: 'freeSpinOutroHide' });
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
		eventEmitter.broadcast({ type: 'globalMultiplierHide' });
		// Base game: tumble sequence finished — reset spot markers for next spin.
		if (stateGame.gameType === 'basegame') {
			eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		}
		// QA 05.06.2026: animacija množenja na KRAJU SPINA (sirovo → pomnoženo).
		// Base game: podaci su zabeleženi u `boardMultiplierInfo`. Free spins:
		// svaki spin je već odigran u `updateFreeSpin`/`freeSpinEnd`, pa je ovde
		// najčešće no-op.
		await playSpinEndMultiply();
		// QA 04.06.2026: Gates-of-Olympus ponašanje — TumbleHistory i
		// TumbleWinAmount paneli ostaju vidljivi sve dok ne krene sledeći spin
		// (reveal handler ih resetuje na početku). Više ih ne sakrivamo
		// eksplicitno na kraju spina, samo malo zadržimo radi audio ritma i
		// count-up animacije.
		const holdMs = stateBet.isTurbo ? 700 : 1200;
		await waitForTimeout(holdMs);
	},

	// ── createBonusSnapshot ───────────────────────────────────────────────────
	// Replays a subset of past events to restore visual state during resume.
	createBonusSnapshot: async (bookEvent: BookEventOfType<'createBonusSnapshot'>) => {
		for (const evt of bookEvent.bookEvents) {
			await playBookEvent(evt, { bookEvents: bookEvent.bookEvents });
		}
	},
};
