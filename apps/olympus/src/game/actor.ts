import _ from 'lodash';

import { stateBet, stateBetDerived } from 'state-shared';
import { checkIsMultipleRevealEvents } from 'utils-book';
import { createPrimaryMachines, createIntermediateMachines, createGameActor } from 'utils-xstate';

import type { Bet } from './typesBookEvent';
import { stateXstateDerived } from './stateXstate';
import { playBet, convertTorResumableBet } from './utils';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import config from './config';

const primaryMachines = createPrimaryMachines<Bet>({
	onResumeGameActive: (betToResume) => convertTorResumableBet(betToResume),

	onResumeGameInactive: (betToResume) => {
		const lastRevealEvent = _.findLast(
			betToResume.state,
			(bookEvent) => bookEvent?.type === 'reveal',
		);
		if (lastRevealEvent) stateGameDerived.enhancedBoard.settle(lastRevealEvent.board);
	},

	onNewGameStart: async () => {
		stateBet.winBookEventAmount = 0;
		// Skip pre-spin animation while auto-betting (or when spacebar is held / turbo on).
		// Using `autoSpinsCounter` as the auto-bet signal is reliable on the very first
		// spin too — it is set synchronously before the AUTO_BET event is broadcast,
		// whereas the xstate-derived `isAutoBetting()` flag may lag a tick on the first
		// transition out of `idle`, causing a noticeable freeze on the first auto-spin.
		const isAutoBetting =
			stateBet.autoSpinsCounter > 0 || stateXstateDerived.isAutoBetting();
		if (isAutoBetting || stateBet.isTurbo || stateBet.isSpaceHold) return;
		await stateGameDerived.enhancedBoard.preSpin({
			paddingBoard: config.paddingReels[stateGame.gameType],
		});
	},

	onNewGameError: () => stateGameDerived.enhancedBoard.settle(),

	onPlayGame: async (bet) => {
		await playBet(bet);
		// After a buy-bonus spin completes, reset back to BASE so the next
		// manual spin (or auto-spin) doesn't place another buy-bonus bet.
		if (stateBetDerived.activeBetMode()?.type === 'buy') {
			stateBet.activeBetModeKey = 'BASE';
		}
	},

	checkIsBonusGame: (bet) => checkIsMultipleRevealEvents({ bookEvents: bet.state }),
});

const intermediateMachines = createIntermediateMachines(primaryMachines);

export const gameActor = createGameActor(intermediateMachines);
