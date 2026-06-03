<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { GRID_NUDGE_Y, GRID_OFFSET_Y_RATIO } from '../game/constants';
	import { getContext } from '../game/context';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContext();

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
</script>

<Container
	x={boardLayout.x}
	y={boardLayout.y + GRID_NUDGE_Y + boardLayout.height * GRID_OFFSET_Y_RATIO}
	pivot={boardLayout.pivot}
	scale={boardLayout.scale ?? 1}
>
	{@render props.children()}
</Container>
