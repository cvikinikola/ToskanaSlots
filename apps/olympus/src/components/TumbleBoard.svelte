<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventTumbleBoard =
		| { type: 'tumbleBoardShow' }
		| { type: 'tumbleBoardHide' }
		| { type: 'tumbleBoardInit'; addingBoard: RawSymbol[][] }
		| { type: 'tumbleBoardReset' }
		| { type: 'tumbleBoardExplode'; explodingPositions: Position[] }
		| { type: 'tumbleBoardRemoveExploded' }
		| { type: 'tumbleBoardSlideDown' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	import { stateBet } from 'state-shared';
	import { BoardContext } from 'components-shared';
	import { waitForResolve } from 'utils-shared/wait';

	import TumbleBoardBase from './TumbleBoardBase.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import type { RawSymbol } from '../game/types';

	const context = getContext();

	let show = $state(false);

	const createTumbleSymbol = ({ initY, rawSymbol }: { initY: number; rawSymbol: RawSymbol }) => {
		const symbolY = new Tween(initY);
		const oncomplete = () => {};
		const tumbleSymbol = $state({
			symbolY,
			rawSymbol,
			symbolState: 'static' as const,
			oncomplete,
		});
		return tumbleSymbol;
	};

	const initTumbleBoardAdding = ({ addingBoard }: { addingBoard: RawSymbol[][] }) => {
		return context.stateGameDerived.boardRaw().map((_, reelIndex) => {
			const addingReel = addingBoard[reelIndex] ?? [];
			const tumbleReelAdding = addingReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1 - addingReel.length);
				return createTumbleSymbol({ initY, rawSymbol });
			});
			return tumbleReelAdding;
		});
	};

	const initTumbleBoardBase = () => {
		return context.stateGameDerived.boardRaw().map((rawSymbolReel) => {
			const tumbleReelBase = rawSymbolReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1);
				return createTumbleSymbol({ initY, rawSymbol });
			});
			return tumbleReelBase;
		});
	};

	context.eventEmitter.subscribeOnMount({
		tumbleBoardShow: () => (show = true),
		tumbleBoardHide: () => (show = false),
		tumbleBoardInit: ({ addingBoard }) => {
			context.stateGame.tumbleBoardAdding = initTumbleBoardAdding({ addingBoard });
			context.stateGame.tumbleBoardBase = initTumbleBoardBase();
		},
		tumbleBoardReset: () => {
			context.stateGame.tumbleBoardAdding = [];
			context.stateGame.tumbleBoardBase = [];
		},
		tumbleBoardExplode: async ({ explodingPositions }) => {
			// Dedupe positions — same cell can appear in multiple winning lines;
			// duplicate awaits on the same oncomplete cause Promise.all to hang.
			const seen = new Set<string>();
			const uniquePositions = explodingPositions.filter((p) => {
				const k = `${p.reel}-${p.row}`;
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
			const getPromises = () =>
				uniquePositions.map(async (position) => {
					// +1 because tumbleBoardBase[r][0] is the top padding symbol;
					// visible row 0 is at array index 1.
					const tumbleSymbol =
						context.stateGame.tumbleBoardBase[position.reel][position.row + 1];
					tumbleSymbol.symbolState = 'explosion';
					await waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve));
				});
			if (uniquePositions.length > 0) {
				context.eventEmitter.broadcast({ type: 'soundSymbolDestroy' });
			}
			await Promise.all(getPromises());
		},
		tumbleBoardRemoveExploded: () => {
			context.stateGame.tumbleBoardBase.forEach((tumbleReel, reelIndex) => {
				context.stateGame.tumbleBoardBase[reelIndex] = tumbleReel.filter(
					(tumbleSymbol) => tumbleSymbol.symbolState !== 'explosion',
				);
			});
		},
		tumbleBoardSlideDown: async () => {
			// Gates-of-Olympus cascade pacing:
			//  • each reel starts dropping slightly after the previous one
			//    (per-reel stagger), so the player reads the cascade left → right
			//  • inside a reel each symbol is offset by a small delay too, giving
			//    the classic "stream" of symbols falling in instead of a single
			//    rigid block dropping at once.
			// Turbo mode (QA 03.06.2026): ranije je turbo skidao oba stagger-a
			// i koristio 120ms pad — pa su simboli padali odjednom i animacija
			// uništenja iz prethodnog cascade-a se "razlila" na sledeći niz.
			// Sada turbo zadržava manji stagger + kraći ali ne instant pad,
			// tako da svaki cascade ima jasan ritam i prethodni explosion stigne
			// da se završi pre nego što novi simboli krenu da padaju.
			// We RE-READ stateBet.isTurbo on every reel/symbol so that pressing
			// STOP mid-cascade (which flips isTurbo on via ButtonTurbo's
			// stopButtonClick subscriber) instantly fast-forwards the rest of
			// the cascade — otherwise STOP in free spins appeared to do nothing
			// (QA report).
			// QA 03.06.2026: usklađeno sa Gates of Olympus ritmom — turbo zadržava
			// jasne per-reel i per-symbol stagger vrednosti tako da svaki simbol
			// vidno padne i explosion iz prethodnog cascade-a uvek stigne da se
			// završi pre nego što novi simboli krenu.
			const getTimings = () => {
				const isTurbo = stateBet.isTurbo;
				return {
					REEL_STAGGER_MS: isTurbo ? 45 : 55,
					SYMBOL_STAGGER_MS: isTurbo ? 30 : 35,
					FALL_DURATION_MS: isTurbo ? 300 : 360,
				};
			};
			const getPromises = () =>
				context.stateGameDerived.tumbleBoardCombined().map(async (tumbleReel, reelIndex) => {
					const reelMoved = tumbleReel.some((tumbleSymbol, symbolIndex) => {
						const targetY = getSymbolY(symbolIndex - 1);
						return targetY !== tumbleSymbol.symbolY.current;
					});

					if (reelMoved) {
						await waitForResolve((resolve) =>
							setTimeout(resolve, reelIndex * getTimings().REEL_STAGGER_MS),
						);
					}

					await Promise.all(
						tumbleReel.map(async (tumbleSymbol, symbolIndex) => {
							const targetY = getSymbolY(symbolIndex - 1);
							if (targetY !== tumbleSymbol.symbolY.current) {
								// Top-most symbols arrive first; bottom symbols a tick later.
								const symbolDelay =
									(tumbleReel.length - 1 - symbolIndex) *
									getTimings().SYMBOL_STAGGER_MS;
								await waitForResolve((resolve) => setTimeout(resolve, symbolDelay));
								await tumbleSymbol.symbolY.set(targetY, {
									duration: getTimings().FALL_DURATION_MS,
									easing: cubicOut,
								});
								if (symbolIndex > 0 && symbolIndex < tumbleReel.length - 1) {
									tumbleSymbol.symbolState = 'land';
									context.stateGameDerived.onSymbolLand({
										rawSymbol: tumbleSymbol.rawSymbol,
									});
									await waitForResolve((resolve) => {
										tumbleSymbol.oncomplete = () => {
											tumbleSymbol.symbolState = 'static';
											resolve();
										};
									});
								}
							}
						}),
					);

					if (reelMoved) {
						context.eventEmitter.broadcast({
							type: 'soundReelStop',
							forcePlay: true,
							playbackRate: 1.2 + reelIndex * 0.015,
						});
					}
				});
			await Promise.all(getPromises());
		},

		// QA: pressing STOP during free-spin cascades must INSTANTLY settle the
		// board. The ButtonTurbo subscriber flips stateBet.isTurbo on stop, but
		// any symbol Tween that's already mid-flight keeps running for its
		// original duration. Force every tumbleSymbol to its final Y with
		// duration:0 and resolve any pending oncomplete awaits so the cascade
		// chain advances immediately.
		stopButtonClick: () => {
			const settleReel = (reel: typeof context.stateGame.tumbleBoardBase[number]) =>
				reel.forEach((tumbleSymbol, symbolIndex) => {
					const targetY = getSymbolY(symbolIndex - 1);
					if (tumbleSymbol.symbolY.current !== targetY) {
						tumbleSymbol.symbolY.set(targetY, { duration: 0 });
					}
					tumbleSymbol.symbolState = 'static';
					const resolve = tumbleSymbol.oncomplete;
					tumbleSymbol.oncomplete = () => {};
					resolve();
				});
			context.stateGame.tumbleBoardBase.forEach(settleReel);
			context.stateGame.tumbleBoardAdding.forEach(settleReel);
		},
	});
</script>

{#if show}
	<BoardContext animate={false}>
		<BoardContainer>
			<BoardMask />
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>

	<BoardContext animate={true}>
		<BoardContainer>
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
