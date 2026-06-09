import { createEnhanceBoardPreSpin } from './createEnhanceBoardPreSpin';
import { createEnhanceBoardSpin } from './createEnhanceBoardSpin';
import { stateSlots } from './stateSlots.svelte';
import type { Reel, GetRawSymbolFromReel } from './types';

export function createEnhanceBoard() {
	function enhanceBoard<TReel extends Reel<any, any>>({ board }: { board: TReel[] }) {
		type TRawSymbol = GetRawSymbolFromReel<TReel>;

		const { preSpin } = createEnhanceBoardPreSpin({ board });
		const { spin: spinInner } = createEnhanceBoardSpin({ board });

		let activeSpinBoard: TRawSymbol[][] | undefined;
		let stopHandled = false;

		const settle = (rawBoard?: TRawSymbol[][]) => {
			stateSlots.spinStopSettled = true;
			board.forEach((reel, reelIndex) => {
				reel.reelState.readyToSpin();
				const rawSymbols = rawBoard?.[reelIndex];
				if (!rawSymbols?.length) return;
				reel.setSymbolsWithRawSymbols(rawSymbols);
			});
		};

		const spin: typeof spinInner = async (args) => {
			stopHandled = false;
			stateSlots.spinStopSettled = false;
			activeSpinBoard = args.revealEvent.board as TRawSymbol[][];
			stateSlots.activeRevealBoard = args.revealEvent.board;
			const skip = stateSlots.skipStopRequested;
			stateSlots.skipStopRequested = false;
			try {
			if (skip) {
				stateSlots.isPreSpinning = false;
				stateSlots.skipStopRequested = false;
				stopHandled = true;
				settle(activeSpinBoard);
				return;
			}
			await spinInner(args);
			} finally {
				activeSpinBoard = undefined;
				stateSlots.activeRevealBoard = undefined;
				stateSlots.spinStopSettled = false;
			}
		};

		const stop = () => {
			stateSlots.isPreSpinning = false;
			const boardToSettle =
				activeSpinBoard ?? (stateSlots.activeRevealBoard as TRawSymbol[][] | undefined);
			if (boardToSettle) {
				if (stopHandled) return;
				stopHandled = true;
				stateSlots.skipStopRequested = false;
				settle(boardToSettle);
				return;
			}
			stateSlots.skipStopRequested = true;
		};

		const readyToSpinEffect = () => {
			board.forEach((reel) => reel.readyToSpinEffect());
		};

		return {
			board,
			preSpin,
			spin,
			settle,
			stop,
			readyToSpinEffect,
		};
	}

	return { enhanceBoard };
}
