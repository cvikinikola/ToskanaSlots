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
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import TumbleBoardBase from './TumbleBoardBase.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { TUMBLE_OPTIONS, BOARD_DIMENSIONS } from '../game/constants';
	import { getSymbolY } from '../game/utils';
	import { getContext } from '../game/context';
	import type { RawSymbol } from '../game/types';

	const context = getContext();

	let show = $state(false);
	let tumbleStopHandled = $state(false);

	// Refill symbols are held here at init and only materialised at slideDown.
	// Keeping `tumbleBoardAdding` EMPTY during the explosion phase means the
	// combined array length stays 9 (top pad + 7 rows + bottom pad), so the
	// index→row mapping (and the combined-index isPadding in TumbleBoardBase)
	// stays valid. If adding were prepended during the explosion, every base
	// symbol's combined index would shift up and bottom rows would be wrongly
	// treated as padding (the symbols-vanish bug).
	let pendingAddingBoard: RawSymbol[][] = [];

	const createTumbleSymbol = ({
		initY,
		rawSymbol,
		isNewRefill = false,
	}: {
		initY: number;
		rawSymbol: RawSymbol;
		isNewRefill?: boolean;
	}) => {
		const symbolY = new Tween(initY);
		const oncomplete = () => {};
		const tumbleSymbol = $state({
			symbolY,
			rawSymbol,
			symbolState: 'static' as const,
			oncomplete,
			isNewRefill,
		});
		return tumbleSymbol;
	};

	const initTumbleBoardAdding = ({ addingBoard }: { addingBoard: RawSymbol[][] }) => {
		return context.stateGameDerived.boardRaw().map((_, reelIndex) => {
			const addingReel = addingBoard[reelIndex] ?? [];
			const tumbleReelAdding = addingReel.map((rawSymbol, symbolIndex) => {
				const initY = getSymbolY(symbolIndex - 1 - addingReel.length);
				return createTumbleSymbol({ initY, rawSymbol, isNewRefill: true });
			});
			return tumbleReelAdding;
		});
	};

	const initTumbleBoardBase = () => {
		return context.stateGameDerived.boardRaw().map((rawSymbolReel, reelIndex) => {
			const reelSymbols = context.stateGame.board[reelIndex].reelState.symbols;
			const tumbleReelBase = rawSymbolReel.map((rawSymbol, symbolIndex) => {
				// Snapshot live Y from the main board so the overlay matches exactly
				// when boardHide fires — recalculating getSymbolY caused a 1-frame gap.
				const initY = reelSymbols[symbolIndex].symbolY.current;
				return createTumbleSymbol({ initY, rawSymbol });
			});
			return tumbleReelBase;
		});
	};

	context.eventEmitter.subscribeOnMount({
		tumbleBoardShow: () => {
			show = true;
			tumbleStopHandled = false;
		},
		tumbleBoardHide: () => (show = false),
		tumbleBoardInit: ({ addingBoard }) => {
			// Defer refill symbols until slideDown (see pendingAddingBoard above).
			pendingAddingBoard = addingBoard;
			context.stateGame.tumbleBoardAdding = [];
			context.stateGame.tumbleBoardBase = initTumbleBoardBase();
		},
		tumbleBoardReset: () => {
			pendingAddingBoard = [];
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
			// Materialise refill symbols now (deferred from init). After
			// removeExploded the base has shrunk by N per reel, so prepending the
			// N adding symbols restores the combined length back to 9 and the
			// index→row mapping stays correct.
			context.stateGame.tumbleBoardAdding = initTumbleBoardAdding({
				addingBoard: pendingAddingBoard,
			});

			// Constant velocity (like a regular spin): each symbol's fall duration is
			// proportional to how far it drops, so refill symbols coming from the top
			// move at the SAME speed as short-dropping kept symbols.
			const fallTo = async (
				tumbleSymbol: { symbolY: Tween<number> },
				targetY: number,
			) => {
				const distance = Math.abs(targetY - tumbleSymbol.symbolY.current);
				const duration = Math.max(
					TUMBLE_OPTIONS.fallMinDurationMs,
					distance / TUMBLE_OPTIONS.fallSpeedPxPerMs,
				);
				await tumbleSymbol.symbolY.set(targetY, { duration, easing: backOut });
			};

			const getPromises = () =>
				context.stateGameDerived.tumbleBoardCombined().map(async (tumbleReel, reelIndex) => {
					const reelMoved = tumbleReel.some((tumbleSymbol, symbolIndex) => {
						const targetY = getSymbolY(symbolIndex - 1);
						return targetY !== tumbleSymbol.symbolY.current;
					});

					// Column unchanged — snap in place, no fall / land animation.
					if (!reelMoved) {
						tumbleReel.forEach((tumbleSymbol, symbolIndex) => {
							tumbleSymbol.symbolY.set(getSymbolY(symbolIndex - 1), { duration: 0 });
						});
						return;
					}

					// Existing symbols sliding down to fill gaps: just fall, no land
					// bounce — they're not "replaced" fruits, so they only reposition.
					const slidePromises = tumbleReel.map(async (tumbleSymbol, symbolIndex) => {
						if (tumbleSymbol.isNewRefill) return;
						const targetY = getSymbolY(symbolIndex - 1);
						if (targetY === tumbleSymbol.symbolY.current) return;
						await fallTo(tumbleSymbol, targetY);
					});

					// ONLY the replaced (new refill) fruits bounce, IN ORDER from the
					// bottom-most up. The bottom new one starts immediately (no delay)
					// so it lands & bounces FIRST; each one above is offset by
					// `refillStaggerMs` so bounces run strictly bottom→top, never
					// overlapping ("samo one koje su se zamenile, po redu").
					const refills = tumbleReel
						.map((tumbleSymbol, symbolIndex) => ({ tumbleSymbol, symbolIndex }))
						.filter(({ tumbleSymbol, symbolIndex }) => {
							if (!tumbleSymbol.isNewRefill) return false;
							const targetY = getSymbolY(symbolIndex - 1);
							return targetY !== tumbleSymbol.symbolY.current;
						})
						.sort((a, b) => b.symbolIndex - a.symbolIndex);

					const refillPromises = refills.map(async ({ tumbleSymbol, symbolIndex }, rank) => {
						const targetY = getSymbolY(symbolIndex - 1);

						if (rank > 0) await waitForTimeout(rank * TUMBLE_OPTIONS.refillStaggerMs);

						await fallTo(tumbleSymbol, targetY);

						const row = symbolIndex - 1;
						const isVisibleRow = row >= 0 && row < BOARD_DIMENSIONS.y;
						if (!isVisibleRow) return;

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
					});

					await Promise.all([...slidePromises, ...refillPromises]);

					context.eventEmitter.broadcast({
						type: 'soundReelStop',
						forcePlay: true,
						playbackRate: 1.2 + reelIndex * 0.015,
					});
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
			if (!show || tumbleStopHandled) return;
			tumbleStopHandled = true;
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
