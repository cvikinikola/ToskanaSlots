import { stateBet } from 'state-shared';

import type { Reel, GetRawSymbolFromReel } from './types';
import { stateSlots } from './stateSlots.svelte';

export function createEnhanceBoardPreSpin<TReel extends Reel<any, any>>({
	board,
}: {
	board: TReel[];
}) {
	type TRawSymbol = GetRawSymbolFromReel<TReel>;

	const preSpin = async ({ paddingBoard }: { paddingBoard?: TRawSymbol[][] }) => {
		if (stateSlots.skipStopRequested || stateSlots.spinStopSettled) {
			stateSlots.isPreSpinning = false;
			return;
		}

		stateSlots.isPreSpinning = true;

		const isTurboBeforeAll = stateBet.isTurbo;

		await Promise.all(
			board.map((reel, reelIndex) => {
				if (stateSlots.skipStopRequested || stateSlots.spinStopSettled) {
					reel.reelState.readyToSpin();
					return;
				}
				// @ts-expect-error Ignored because paddingReel is not required by createCascadingReel
				return reel.preSpin({ isTurboBeforeAll, preSpinPaddingReel: paddingBoard?.[reelIndex] });
			}),
		);
	};

	return { preSpin };
}
