<script lang="ts">
	import { Text } from 'pixi-svelte';

	import UiLabelPlate from './UiLabelPlate.svelte';
	import {
		PANEL_PLATE_HEIGHT,
		PANEL_PLATE_TOP,
		PANEL_PLATE_WIDTH,
		UI_BASE_FONT_SIZE,
		portraitUiRuntime,
	} from '../constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		labelFill?: number;
		valueFill?: number;
	};

	const props: Props = $props();

	const panelAssetKey = $derived.by(() => {
		const label = props.label.toUpperCase();
		if (label.includes('BALANCE')) return 'menu_panel_balance';
		if (label.includes('WIN')) return 'menu_panel_win';
		if (label.includes('BET') || label.includes('SPIN')) return 'menu_panel_bet';
		return 'menu_panel_balance';
	});

	const panelOnly = $derived(Boolean(props.stacked && props.tiled));

	const plateWidth = $derived(
		panelOnly ? portraitUiRuntime.plateWidth : PANEL_PLATE_WIDTH,
	);
	const plateHeight = $derived(
		panelOnly ? portraitUiRuntime.plateHeight : PANEL_PLATE_HEIGHT,
	);
	const plateTop = $derived(panelOnly ? portraitUiRuntime.plateTop : PANEL_PLATE_TOP);
	const valueY = $derived(
		panelOnly ? portraitUiRuntime.plateValueY : UI_BASE_FONT_SIZE * 1.05,
	);
	const valueFontSize = $derived(
		panelOnly ? portraitUiRuntime.plateValueFontSize : UI_BASE_FONT_SIZE * 0.82,
	);

	const labelStyle = {
		fontFamily: 'serif',
		fontWeight: '700',
		letterSpacing: 2,
		fontSize: UI_BASE_FONT_SIZE * 0.74,
		fill: props.labelFill ?? 0xffd147,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const;

	const valueStyle = $derived({
		fontFamily: 'serif',
		fontWeight: '900',
		letterSpacing: panelOnly ? 0 : 0.5,
		fontSize: valueFontSize,
		fill: props.valueFill ?? 0xffe79a,
		stroke: { color: 0x2a0d0d, width: 2 },
		dropShadow: panelOnly
			? { color: 0x000000, alpha: 0.45, blur: 1, distance: 0, angle: 0 }
			: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	} as const);

	const labelY = UI_BASE_FONT_SIZE * 0.22;
</script>

{#if props.stacked}
	{#if props.tiled}
		<UiLabelPlate
			y={panelOnly ? 0 : -plateTop}
			anchor={{ x: 0.5, y: panelOnly ? 0.5 : 0 }}
			width={plateWidth}
			height={plateHeight}
			assetKey={panelAssetKey}
		/>
	{/if}
	{#if !panelOnly}
		<Text anchor={{ x: 0.5, y: 0 }} text={props.label} style={labelStyle} y={labelY} />
	{/if}
	<Text
		anchor={{ x: 0.5, y: panelOnly ? 0.5 : 0 }}
		text={props.value}
		style={valueStyle}
		y={valueY}
	/>
{:else}
	{#if props.tiled}
		<UiLabelPlate
			x={-90}
			anchor={{ x: 0, y: 0.5 }}
			width={PANEL_PLATE_WIDTH}
			height={PANEL_PLATE_HEIGHT}
			assetKey={panelAssetKey}
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
