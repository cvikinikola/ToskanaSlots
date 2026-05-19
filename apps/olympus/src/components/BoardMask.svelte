<script lang="ts">
	import { Rectangle } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	const context = getContext();
	// Reference kept so the mask re-renders when the layout changes
	// (e.g. orientation flip) — values themselves are native pixels so
	// the mask geometry is independent of board scale.
	$effect(() => {
		void context.stateGameDerived.boardLayout();
	});
</script>

<!--
	isMask=true makes this Rectangle act as a PixiJS mask.
	Sized in BOARD-NATIVE pixels (same coordinate space as the symbols
	inside `BoardContainer`, which applies the scale itself). The extra
	SYMBOL_SIZE on each side hides the top/bottom padding symbols that
	cascade in from above; without this the bottom padding row would
	bleed into the gold reel frame at scales < 1.
-->
<Rectangle
	isMask
	x={-SYMBOL_SIZE}
	y={0}
	width={BOARD_SIZES.width + SYMBOL_SIZE * 2}
	height={BOARD_SIZES.height}
/>
