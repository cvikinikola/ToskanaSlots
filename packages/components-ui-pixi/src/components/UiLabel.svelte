<script lang="ts">
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import UiLabelPlate from './UiLabelPlate.svelte';
	import {
		PANEL_PLATE_HEIGHT,
		PANEL_PLATE_WIDTH,
		UI_BASE_FONT_SIZE,
		WOODEN_PANEL_LABEL_FONT_MUL,
		WOODEN_PANEL_LABEL_Y_RATIO,
		WOODEN_PANEL_VALUE_FONT_MUL,
		WOODEN_PANEL_VALUE_Y_RATIO,
		fitWoodenPanelValueFontSize,
		portraitUiRuntime,
	} from '../constants';

	type Props = {
		label: string;
		value: string;
		tiled?: boolean;
		stacked?: boolean;
		/** Stacked shelf: title above the amount inside the wooden plate (BALANCE | WIN | BET). */
		labelAbove?: boolean;
		labelFill?: number;
		valueFill?: number;
	};

	const props: Props = $props();

	const panelAssetKey = 'menu_panel_balance';

	const stackedPlate = $derived(Boolean(props.stacked && props.tiled));

	/** Fixed size — identical for BALANCE / WIN / BET. */
	const plateWidth = $derived(
		Math.round(props.stacked ? portraitUiRuntime.plateWidth : PANEL_PLATE_WIDTH),
	);
	const plateHeight = $derived(
		Math.round(props.stacked ? portraitUiRuntime.plateHeight : PANEL_PLATE_HEIGHT),
	);

	const baseLabelFontSize = $derived(
		stackedPlate && portraitUiRuntime.plateLabelFontSize != null
			? portraitUiRuntime.plateLabelFontSize
			: stackedPlate
				? portraitUiRuntime.scale * UI_BASE_FONT_SIZE * WOODEN_PANEL_LABEL_FONT_MUL
				: UI_BASE_FONT_SIZE * 0.74,
	);
	const baseValueFontSize = $derived(
		stackedPlate
			? portraitUiRuntime.plateValueFontSize
			: UI_BASE_FONT_SIZE * 0.82,
	);

	const labelAbovePlate = $derived(Boolean(props.labelAbove && stackedPlate));

	const labelFontSize = $derived.by(() => {
		let size = baseLabelFontSize;
		if (labelAbovePlate) size *= 0.78;
		else if (stackedPlate && props.label.length > 7) size *= 0.88;
		return size;
	});
	const valueFontSize = $derived(
		stackedPlate
			? fitWoodenPanelValueFontSize(props.value, plateWidth, baseValueFontSize)
			: baseValueFontSize,
	);

	const labelY = $derived(
		labelAbovePlate
			? -plateHeight * 0.34
			: stackedPlate
				? plateHeight * WOODEN_PANEL_LABEL_Y_RATIO
				: UI_BASE_FONT_SIZE * 0.22,
	);
	const valueY = $derived(
		labelAbovePlate
			? plateHeight * 0.14
			: stackedPlate
				? plateHeight * WOODEN_PANEL_VALUE_Y_RATIO
				: UI_BASE_FONT_SIZE * 1.05,
	);

	const labelStyle = $derived({
		fontFamily: 'serif',
		fontWeight: '700',
		letterSpacing: stackedPlate ? 1 : 2,
		fontSize: labelFontSize,
		fill: props.labelFill ?? 0xffd147,
		stroke: { color: 0x2a0d0d, width: stackedPlate ? 1.5 : 2 },
		dropShadow: {
			color: 0x000000,
			alpha: stackedPlate ? 0.65 : 0.8,
			blur: 3,
			distance: 1,
			angle: Math.PI / 2,
		},
	} as const);

	const valueStyle = $derived({
		fontFamily: 'serif',
		fontWeight: '900',
		letterSpacing: 0,
		fontSize: valueFontSize,
		fill: props.valueFill ?? 0xffe79a,
		stroke: { color: 0x2a0d0d, width: stackedPlate ? 1.5 : 2 },
		align: 'center' as const,
		dropShadow: stackedPlate
			? { color: 0x000000, alpha: 0.45, blur: 1, distance: 0, angle: 0 }
			: { color: 0x000000, alpha: 0.8, blur: 3, distance: 1, angle: Math.PI / 2 },
	});
</script>

{#if props.stacked}
	<Container>
		{#if props.tiled}
			<UiLabelPlate
				anchor={{ x: 0.5, y: 0.5 }}
				width={plateWidth}
				height={plateHeight}
				assetKey={panelAssetKey}
			/>
			<Rectangle
				isMask
				x={-plateWidth / 2}
				y={-plateHeight / 2}
				width={plateWidth}
				height={plateHeight}
			/>
		{/if}
		<Text anchor={{ x: 0.5, y: 0.5 }} text={props.label} style={labelStyle} y={labelY} />
		<Text anchor={{ x: 0.5, y: 0.5 }} text={props.value} style={valueStyle} y={valueY} />
	</Container>
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
