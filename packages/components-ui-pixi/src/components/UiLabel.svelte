<script lang="ts">
	import { Text } from 'pixi-svelte';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import UiLabelPlate from './UiLabelPlate.svelte';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		labelFill?: number;
		valueFill?: number;
	};

	const props: Props = $props();
	const labelAssetKey = $derived.by(() => {
		const label = props.label.toUpperCase();
		if (label.includes('BALANCE')) return 'menu_balance';
		if (label.includes('WIN')) return 'menu_win';
		if (label.includes('BET') || label.includes('SPIN')) return 'menu_bet';
		return undefined;
	});

	const labelStyle = {
		fontFamily: 'serif',
		fontWeight: '700',
		letterSpacing: 2,
		fontSize: UI_BASE_FONT_SIZE * 0.74,
		fill: props.labelFill ?? 0xffd147,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const;

	const valueStyle = {
		fontFamily: 'serif',
		fontWeight: '900',
		letterSpacing: 0.5,
		fontSize: UI_BASE_FONT_SIZE * 0.82,
		fill: props.valueFill ?? 0xffe79a,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const;

	// Plate sizing — slightly taller than the original `base_ticker`
	// sprite to comfortably hold the bigger gold label + value text.
	const plateWidth = UI_BASE_FONT_SIZE * 3 * (326 / 73);
	const plateHeight = UI_BASE_FONT_SIZE * 3.1;
	const labelY = UI_BASE_FONT_SIZE * 0.14;
	const valueY = UI_BASE_FONT_SIZE * 0.92;
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
	{#if labelAssetKey}
		<UiAssetSprite
			assetKey={labelAssetKey}
			anchor={0.5}
			x={-plateWidth * 0.36}
			y={plateHeight * 0.5 - 20}
			width={plateHeight * 0.54}
			height={plateHeight * 0.54}
		/>
	{/if}
	<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} y={labelY} />
	<Text anchor={{ x: 0.5, y: 0 }} text={props.value} style={valueStyle} y={valueY} />
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
