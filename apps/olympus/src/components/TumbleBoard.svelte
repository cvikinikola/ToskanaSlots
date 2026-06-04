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
	import { backOut } from 'svelte/easing';

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
			// Original Olympus default tempo: brz padding bez per-reel/per-symbol
			// stagger-a (200ms backOut). Stop-button/dedupe logika i sound poziv
			// ostaju netaknuti.
			const FALL_DURATION_MS = 200;
			const getPromises = () =>
				context.stateGameDerived.tumbleBoardCombined().map(async (tumbleReel, reelIndex) => {
					const reelMoved = tumbleReel.some((tumbleSymbol, symbolIndex) => {
						const targetY = getSymbolY(symbolIndex - 1);
						return targetY !== tumbleSymbol.symbolY.current;
					});

					await Promise.all(
						tumbleReel.map(async (tumbleSymbol, symbolIndex) => {
							const targetY = getSymbolY(symbolIndex - 1);
							if (targetY !== tumbleSymbol.symbolY.current) {
								await tumbleSymbol.symbolY.set(targetY, {
									duration: FALL_DURATION_MS,
									easing: backOut,
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
			<!--
				QA 04.06.2026: maska se primenjuje i na animate prolaz tumble board-a
				(explosion simboli). Garantuje da nijedan simbol koji eksplodira ili
				kaskadira NIKAD ne izađe iz zlatnog frame-a kad se igra uspori.
				PixiJS maska je tvrd GPU clip — sve van y∈[0,500] native se ne crta.
			-->
			<BoardMask />
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
