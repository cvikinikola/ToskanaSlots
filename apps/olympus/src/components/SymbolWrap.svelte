<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';

	type Props = {
		x: number;
		y: number;
		animating: boolean;
		children: Snippet;
	};

	const props: Props = $props();
	const boardContext = getContextBoard();

	/**
	 * Each symbol renders in exactly one of the two Board passes:
	 * - static pass (animate=false): renders when NOT animating
	 * - animate pass (animate=true): renders ONLY when animating
	 * This prevents double-rendering.
	 */
	const show = $derived(
		(boardContext.animate && props.animating) || (!boardContext.animate && !props.animating),
	);

	// QA 03.06.2026: NEMA frame culling-a.
	// Ranija `inFrame` provera (y unutar [0, BOARD_SIZES.height]) je sakrivala
	// simbole dok im centar ne stigne na y=0 — pa su tokom fall-in animacije
	// "pop-in" izgledali na vrhu prvog reda i delovalo je kao da reeli preskaču
	// prvi red i zaustavljaju se na drugom. BoardMask već radi clipping za
	// padding redove iznad/ispod board-a, tako da nije potrebno dodatno
	// runtime culling — neka se simboli renderuju kontinuirano dok kaskadiraju.
</script>

{#if show}
	<Container x={props.x} y={props.y}>
		{@render props.children()}
	</Container>
{/if}
