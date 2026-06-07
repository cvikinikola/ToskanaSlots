<script lang="ts">
	import _ from 'lodash';

	import { stateBet, stateUi, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';
	import { stateGame, stateGameDerived } from '../game/stateGame.svelte';
	import { INITIAL_BOARD } from '../game/constants';
	import type { Bet } from '../game/typesBookEvent';

	const context = getContext();

	const showPlay = $derived(
		stateUrlDerived.replay() && stateUi.replay.phase === 'ready' && stateUi.replay.snapshot,
	);
	const showPlayAgain = $derived(stateUrlDerived.replay() && stateUi.replay.phase === 'finished');

	const startReplay = () => {
		const snapshot = stateUi.replay.snapshot;
		if (!snapshot) return;

		stateBet.activeBetModeKey = stateUrlDerived.mode() || stateBet.activeBetModeKey;
		stateBet.betToResume = {
			...snapshot,
			event: '0',
			active: true,
			mode: stateUrlDerived.mode() || stateBet.activeBetModeKey,
		} as Bet;
		stateUi.replay.phase = 'playing';
		context.eventEmitter.broadcast({ type: 'resumeBet' });
	};

	const resetBoardForReplay = () => {
		const snapshot = stateUi.replay.snapshot as Bet | null;
		const lastReveal = snapshot?.state
			? _.findLast(snapshot.state, (bookEvent) => bookEvent?.type === 'reveal')
			: undefined;

		stateBet.betToResume = null;
		stateBet.winBookEventAmount = 0;
		stateGame.gameType = 'basegame';
		stateGameDerived.enhancedBoard.settle(lastReveal?.board ?? INITIAL_BOARD);
		context.eventEmitter.broadcast({ type: 'spotMultipliersClear' });
		context.eventEmitter.broadcast({ type: 'tumbleBoardHide' });
		context.eventEmitter.broadcast({ type: 'boardShow' });
	};

	const playAgain = () => {
		resetBoardForReplay();
		stateUi.replay.phase = 'ready';
	};
</script>

{#if showPlay || showPlayAgain}
	<div class="replay-controls" aria-live="polite">
		{#if showPlay}
			<button type="button" class="replay-controls__btn" onclick={startReplay}>Play</button>
		{:else if showPlayAgain}
			<button type="button" class="replay-controls__btn" onclick={playAgain}>Play Again</button>
		{/if}
	</div>
{/if}

<style lang="scss">
	.replay-controls {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 9997;

		&__btn {
			pointer-events: auto;
			padding: 14px 36px;
			border: 2px solid #d4af37;
			border-radius: 8px;
			background: linear-gradient(180deg, #4a2a18 0%, #3b2116 100%);
			color: #ffefb0;
			font-family: system-ui, Georgia, serif;
			font-size: 1.1rem;
			font-weight: 700;
			letter-spacing: 0.14em;
			text-transform: uppercase;
			cursor: pointer;
			box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);

			&:hover {
				filter: brightness(1.08);
			}
		}
	}
</style>
