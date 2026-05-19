<script lang="ts">
	import { Text } from 'pixi-svelte';

	import UiLabelPlate from './UiLabelPlate.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
	};

	const props: Props = $props();

	const labelStyle = {
		fontFamily: 'serif',
		fontWeight: '700',
		letterSpacing: 2,
		fontSize: UI_BASE_FONT_SIZE * 0.92,
		fill: 0xffd147,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const;

	const valueStyle = {
		fontFamily: 'serif',
		fontWeight: '900',
		letterSpacing: 0.5,
		fontSize: UI_BASE_FONT_SIZE * 1.05,
		fill: 0xffe79a,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const;

	// Plate sizing — slightly taller than the original `base_ticker`
	// sprite to comfortably hold the bigger gold label + value text.
	const plateWidth = UI_BASE_FONT_SIZE * 3 * (326 / 73);
	const plateHeight = UI_BASE_FONT_SIZE * 3.1;
</script>

{#if props.stacked}
	{#if props.tiled}
		<UiLabelPlate
			y={-20}
			anchor={{ x: 0.5, y: 0 }}
			width={plateWidth}
			height={plateHeight}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={UI_BASE_FONT_SIZE} />
{:else}
	{#if props.tiled}
		<UiLabelPlate
			x={-90}
			anchor={{ x: 0, y: 0.5 }}
			width={plateWidth}
			height={plateHeight}
		/>
	{/if}
	<Text anchor={{ x: 0, y: 0.5 }} text={props.label} style={labelStyle} />
	<Text
		anchor={{ x: 1, y: 0.5 }}
		text={props.value}
		style={valueStyle}
		x={UI_BASE_FONT_SIZE * 10}
	/>
{/if}
