<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateUi } from 'state-shared';
	import { FadeContainer } from 'components-pixi';

	import { stateGame } from '../game/stateGame.svelte';

	type Props = {
		children: Snippet;
	};

	const { children }: Props = $props();

	/** Same visibility as menu bar (uiHide fade) + intro/outro/transition panels. */
	const show = $derived(
		stateUi.pixiMenuBarVisible &&
			!stateGame.freeSpinIntroActive &&
			!stateGame.freeSpinOutroActive &&
			!stateGame.transitionActive,
	);
</script>

<FadeContainer persistent {show}>
	{@render children()}
</FadeContainer>
