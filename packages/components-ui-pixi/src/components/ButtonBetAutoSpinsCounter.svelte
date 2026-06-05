<script lang="ts">
	import { Rectangle, Text } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { UI_BAR_ICON_SIZE } from '../constants';

	const counterText = $derived(
		stateBet.autoSpinsCounter === Infinity ? '∞' : `${stateBet.autoSpinsCounter}`,
	);
	const fontSize = $derived.by(() => {
		if (stateBet.autoSpinsCounter === Infinity) return UI_BAR_ICON_SIZE * 0.42;
		if (stateBet.autoSpinsCounter > 99) return UI_BAR_ICON_SIZE * 0.28;
		if (stateBet.autoSpinsCounter > 9) return UI_BAR_ICON_SIZE * 0.32;
		return UI_BAR_ICON_SIZE * 0.4;
	});
</script>

{#if stateBet.autoSpinsCounter > 0}
	<Rectangle
		anchor={0.5}
		width={UI_BAR_ICON_SIZE}
		height={UI_BAR_ICON_SIZE}
		borderRadius={UI_BAR_ICON_SIZE * 0.12}
		backgroundColor={0x02040a}
		alpha={1}
	/>
	<Text
		anchor={0.5}
		text={counterText}
		style={{
			fontFamily: 'proxima-nova',
			fill: 0xffd147,
			fontWeight: 'bold',
			fontSize,
			letterSpacing: 0,
			stroke: { color: 0x071226, width: Math.max(2, UI_BAR_ICON_SIZE * 0.04) },
			dropShadow: { color: 0x000000, alpha: 0.85, blur: 4, distance: 1, angle: Math.PI / 2 },
		}}
	/>
{/if}
