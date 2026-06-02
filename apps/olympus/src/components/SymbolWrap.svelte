<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Container } from 'pixi-svelte';
	import { getContextBoard } from 'components-shared';
	import { SYMBOL_SIZE, BOARD_DIMENSIONS } from '../game/constants';

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

	// Symbol `y` is the sprite CENTRE (anchor 0.5), so the visible range
	// must cover the full board height — from the top edge (y = 0) to the
	// bottom edge (y = SYMBOL_SIZE * BOARD_DIMENSIONS.y). Using the row
	// centres here (50 … 450) caused cascading symbols to stay hidden until
	// their centre reached row 0, then "pop in" at row 0 and slide downward
	// to the real target row — visually the first row was skipped and the
	// reels appeared to stop one row lower than the spin result (QA bug
	// "prvi red preleće, zaustavljanje na drugom redu").
	const top = 0;
	const bottom = SYMBOL_SIZE * BOARD_DIMENSIONS.y;
	const inFrame = $derived(props.y >= top && props.y <= bottom);
</script>

{#if show && inFrame}
	<Container x={props.x} y={props.y}>
		{@render props.children()}
	</Container>
{/if}
