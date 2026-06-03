<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { getContext } from '../game/context';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContext();

	const boardLayout = $derived(context.stateGameDerived.boardLayout());
</script>

<Container
	x={boardLayout.x}
	y={boardLayout.y}
	pivot={boardLayout.pivot}
	scale={boardLayout.scale ?? 1}
>
	{@render props.children()}
</Container>
