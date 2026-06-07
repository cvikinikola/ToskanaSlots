<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { getContext } from '../game/context';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContext();
</script>

<!--
	Positions everything relative to the board's centre.
	boardLayout() returns x/y at the canvas centre, with pivot at the board's own centre.
-->
<Container
	x={context.stateGameDerived.boardLayout().x}
	y={context.stateGameDerived.boardLayout().y}
	pivot={context.stateGameDerived.boardLayout().pivot}
	scale={context.stateGameDerived.boardLayout().scale}
>
	{@render props.children()}
</Container>
