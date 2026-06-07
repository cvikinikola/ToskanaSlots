<script lang="ts">
	import { stateUi, stateUrlDerived } from 'state-shared';
	import { getContext } from '../game/context';

	const context = getContext();

	let wasPlaying = $state(false);

	$effect(() => {
		if (!stateUrlDerived.replay()) return;

		// Track xstate transitions for replay completion.
		const _xstateValue = context.stateXstate.value;
		void _xstateValue;

		if (stateUi.replay.phase === 'playing') {
			wasPlaying = true;
		}

		if (
			wasPlaying &&
			stateUi.replay.phase === 'playing' &&
			context.stateXstateDerived.isIdle()
		) {
			stateUi.replay.phase = 'finished';
			wasPlaying = false;
		}
	});
</script>
