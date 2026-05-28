<script lang="ts">
	import { Rectangle, Text } from 'pixi-svelte';
	import { stateBet } from 'state-shared';

	import { UI_BASE_SIZE } from '../constants';

	const counterText = $derived(
		stateBet.autoSpinsCounter === Infinity ? '∞' : `${stateBet.autoSpinsCounter}`,
	);
	const fontSize = $derived.by(() => {
		if (stateBet.autoSpinsCounter === Infinity) return UI_BASE_SIZE * 0.42;
		if (stateBet.autoSpinsCounter > 99) return UI_BASE_SIZE * 0.28;
		if (stateBet.autoSpinsCounter > 9) return UI_BASE_SIZE * 0.32;
		return UI_BASE_SIZE * 0.4;
	});
	const counterY = -UI_BASE_SIZE * 0.03;
</script>

{#if stateBet.autoSpinsCounter > 0}
	<Rectangle
		anchor={0.5}
		y={counterY}
		width={UI_BASE_SIZE * 0.92}
		height={UI_BASE_SIZE * 0.58}
		borderRadius={UI_BASE_SIZE * 0.1}
		backgroundColor={0x02040a}
		alpha={1}
	/>
	<Text
		anchor={0.5}
		y={counterY}
		text={counterText}
		style={{
			fontFamily: 'proxima-nova',
			fill: 0xffd147,
			fontWeight: 'bold',
			fontSize,
			letterSpacing: 0,
			stroke: { color: 0x071226, width: 5 },
			dropShadow: { color: 0x000000, alpha: 0.85, blur: 4, distance: 1, angle: Math.PI / 2 },
		}}
	/>
{/if}
