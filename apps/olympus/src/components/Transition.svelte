<script lang="ts" module>
	export type EmitterEventTransition = { type: 'transition' };
</script>

<script lang="ts">
	import { waitForTimeout } from 'utils-shared/wait';
	import { CanvasSizeRectangle } from 'components-layout';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	/**
	 * Transition overlay: placeholder flash-to-black-and-back.
	 * Replace with a SpineProvider animation when transition artwork is ready.
	 */
	let visible = $state(false);
	let alpha = $state(0);
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		transition: async () => {
			visible = true;
			stateGame.transitionActive = true;
			// Fade to black
			alpha = 1;
			await waitForTimeout(300);
			// Halfway: resolve for the handler (game switches mode here)
			oncomplete();
			// Fade back
			await waitForTimeout(300);
			alpha = 0;
			await waitForTimeout(300);
			visible = false;
			stateGame.transitionActive = false;
		},
	});
</script>

{#if visible}
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={alpha} zIndex={100} />
{/if}
