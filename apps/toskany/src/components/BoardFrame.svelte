<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, getBoardCenterFraction } from '../game/constants';

	const context = getContext();

	/**
	 * Ornate gold reel frame overlay (placeholder SVG `frame`).
	 * Sized to wrap the visible 7×7 board with comfortable padding.
	 */
	const FRAME_PADDING_X = 1.18;
	const FRAME_PADDING_Y = 1.5;

	const main = $derived(context.stateLayoutDerived.mainLayout());
	const fraction = $derived(getBoardCenterFraction(context.stateLayoutDerived.layoutType()));
</script>

<Sprite
	key="frame"
	anchor={0.5}
	x={main.width * fraction.x}
	y={main.height * fraction.y}
	width={BOARD_SIZES.width * FRAME_PADDING_X}
	height={BOARD_SIZES.height * FRAME_PADDING_Y}
	zIndex={5}
/>
