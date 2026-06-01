<script lang="ts" module>
	import type { RawSymbol, Position } from '../game/types';

	export type EmitterEventTumbleBoard =
		| { type: 'tumbleBoardShow' }
		| { type: 'tumbleBoardHide' }
		| { type: 'tumbleBoardInit'; addingBoard: RawSymbol[][] }
		| { type: 'tumbleBoardSetAdding'; addingBoard: RawSymbol[][] }
		| { type: 'tumbleBoardReset' }
		| { type: 'tumbleBoardExplode'; explodingPositions: Position[] }
		| { type: 'tumbleBoardRemoveExploded' }
		| { type: 'tumbleBoardSlideDown' }
		| { type: 'tumbleBoardWithAnimateSymbols'; symbolPositions: Position[] };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';

	import { BoardContext } from 'components-shared';
	import { stateBet } from 'state-shared';
	import { waitForResolve, waitForTimeout } from 'utils-shared/wait';

	import TumbleBoardBase from './TumbleBoardBase.svelte';
	import BoardContainer from './BoardContainer.svelte';
	import BoardMask from './BoardMask.svelte';
	import { getSymbolY } from '../game/utils';
	import {
		BOTTOM_ROW_INDEX,
		getCascadingReelFallInDelayMs,
		SPIN_OPTIONS_DEFAULT,
		SPIN_OPTIONS_FAST,
		STOP_SOUND_LEAD_MS,
		SYMBOL_SIZE,
	} from '../game/constants';
	import { getContext } from '../game/context';
	import type { RawSymbol } from '../game/types';
	import type { TumbleSymbol } from '../game/stateGame.svelte';

	const context = getContext();

	let show = $state(false);

	const getFallInStartDelay = (boardRow: number, interval: number) =>
		interval * (BOTTOM_ROW_INDEX - boardRow);

	const getSymbolImpactDelayMs = ({
		oldY,
		targetY,
		boardRow,
		spinOptions,
		isTurbo,
	}: {
		oldY: number;
		targetY: number;
		boardRow?: number;
		spinOptions: typeof SPIN_OPTIONS_DEFAULT;
		isTurbo: boolean;
	}) => {
		const distance = targetY - oldY;
		const bounceDistance = SYMBOL_SIZE * spinOptions.symbolFallInBounceSizeMulti;
		const landDuration = Math.max(1, (distance - bounceDistance) / spinOptions.symbolFallInSpeed);
		const stagger =
			!isTurbo && boardRow !== undefined
				? getFallInStartDelay(boardRow, spinOptions.symbolFallInInterval)
				: 0;
		return stagger + landDuration;
	};

	const fallOneTumbleSymbol = async ({
		tumbleSymbol,
		targetY,
		boardRow,
		spinOptions,
		isTurbo,
	}: {
		tumbleSymbol: TumbleSymbol;
		targetY: number;
		boardRow?: number;
		spinOptions: typeof SPIN_OPTIONS_DEFAULT;
		isTurbo: boolean;
	}) => {
		const oldY = tumbleSymbol.symbolY.current;
		if (targetY === oldY) return;

		const distance = targetY - oldY;
		const bounceDistance = SYMBOL_SIZE * spinOptions.symbolFallInBounceSizeMulti;
		const landDuration = Math.max(1, (distance - bounceDistance) / spinOptions.symbolFallInSpeed);
		const bounceDuration = bounceDistance / spinOptions.symbolFallInBounceSpeed;

		if (!isTurbo && boardRow !== undefined) {
			const delay = getFallInStartDelay(boardRow, spinOptions.symbolFallInInterval);
			if (delay > 0) await waitForTimeout(delay);
		}

		await tumbleSymbol.symbolY.set(targetY - bounceDistance, { duration: landDuration });

		await tumbleSymbol.symbolY.set(targetY, {
			duration: bounceDuration,
			easing: backOut,
		});
	};

	const slideTumbleReel = async ({
		tumbleReel,
		spinOptions,
		reelIndex,
		isTurbo,
	}: {
		tumbleReel: TumbleSymbol[];
		spinOptions: typeof SPIN_OPTIONS_DEFAULT;
		reelIndex: number;
		isTurbo: boolean;
	}) => {
		if (!isTurbo) {
			const reelDelay = getCascadingReelFallInDelayMs(reelIndex, spinOptions);
			if (reelDelay > 0) await waitForTimeout(reelDelay);
		}

		let maxImpactMs = 0;
		for (const [symbolIndex, tumbleSymbol] of tumbleReel.entries()) {
			const targetY = getSymbolY(symbolIndex - 1);
			if (targetY === tumbleSymbol.symbolY.current) continue;

			const isVisible = symbolIndex > 0 && symbolIndex < tumbleReel.length - 1;
			const boardRow = isVisible ? symbolIndex - 1 : undefined;
			maxImpactMs = Math.max(
				maxImpactMs,
				getSymbolImpactDelayMs({
					oldY: tumbleSymbol.symbolY.current,
					targetY,
					boardRow,
					spinOptions,
					isTurbo,
				}),
			);
		}

		if (maxImpactMs > 0) {
			const stopDelay = Math.max(0, maxImpactMs - STOP_SOUND_LEAD_MS);
			setTimeout(() => {
				context.eventEmitter.broadcast({
					type: 'soundReelStop',
					forcePlay: !isTurbo,
				});
			}, stopDelay);
		}

		await Promise.all(
			tumbleReel.map(async (tumbleSymbol, symbolIndex) => {
				const targetY = getSymbolY(symbolIndex - 1);
				if (targetY === tumbleSymbol.symbolY.current) return;

				const isVisible = symbolIndex > 0 && symbolIndex < tumbleReel.length - 1;
				const boardRow = isVisible ? symbolIndex - 1 : undefined;

				await fallOneTumbleSymbol({
					tumbleSymbol,
					targetY,
					boardRow,
					spinOptions,
					isTurbo,
				});
			}),
		);
	};

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
		tumbleBoardSetAdding: ({ addingBoard }) => {
			context.stateGame.tumbleBoardAdding = initTumbleBoardAdding({ addingBoard });
		},
		tumbleBoardWithAnimateSymbols: async ({ symbolPositions }) => {
			const seen = new Set<string>();
			const uniquePositions = symbolPositions.filter((p) => {
				const k = `${p.reel}-${p.row}`;
				if (seen.has(k)) return false;
				seen.add(k);
				return true;
			});
			const getPromises = () =>
				uniquePositions.map(async (position) => {
					const tumbleSymbol =
						context.stateGame.tumbleBoardBase[position.reel]?.[position.row + 1];
					if (!tumbleSymbol) return;
					tumbleSymbol.symbolState = 'win';
					await waitForResolve((resolve) => (tumbleSymbol.oncomplete = resolve));
					tumbleSymbol.symbolState = 'static';
					tumbleSymbol.oncomplete = () => {};
				});

			await Promise.all(getPromises());
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
						context.stateGame.tumbleBoardBase[position.reel]?.[position.row + 1];
					if (!tumbleSymbol) return;
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
			const isTurbo = stateBet.isTurbo;
			const spinOptions = isTurbo ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;
			const tumbleBoard = context.stateGameDerived.tumbleBoardCombined();

			await Promise.all(
				tumbleBoard.map((tumbleReel, reelIndex) =>
					slideTumbleReel({ tumbleReel, spinOptions, reelIndex, isTurbo }),
				),
			);
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
			<BoardMask />
			<TumbleBoardBase />
		</BoardContainer>
	</BoardContext>
{/if}
