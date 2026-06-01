<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import {
		actionClusterCenters,
		DESKTOP_BASE_SIZE,
		DESKTOP_BACKGROUND_WIDTH_LIST,
		menuBuyCenters,
		menuFarLeftX,
		menuIconHalfWidth,
		MENU_ICON_ASPECT,
		MENU_ICON_GAP,
		PANEL_DISPLAY_SCALE,
		PANEL_ROW_HALF_GAP,
	} from '../constants';
	import { getContext } from '../context';
	import type { LayoutUiProps } from '../types';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const ml = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const BAR_CENTER_X = 880;
	const BUTTON_Y = DESKTOP_BASE_SIZE * 0.5;
	const { autoX, spinX, turboX } = actionClusterCenters(BAR_CENTER_X);
	const menuLeftX = menuFarLeftX();
	const { buyX } = menuBuyCenters(autoX);
	const betControlGap = menuIconHalfWidth(MENU_ICON_ASPECT.square) + MENU_ICON_GAP;
	const barY = $derived(ml.height - DESKTOP_BASE_SIZE - 30);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container
		x={ml.width * 0.5}
		y={barY}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: DESKTOP_BASE_SIZE,
				width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={BAR_CENTER_X - PANEL_ROW_HALF_GAP} scale={PANEL_DISPLAY_SCALE}>
			{@render props.amountBalance({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={BAR_CENTER_X} scale={PANEL_DISPLAY_SCALE}>
			{@render props.amountWin({ stacked: true })}
		</Container>

		<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={BAR_CENTER_X + PANEL_ROW_HALF_GAP} scale={PANEL_DISPLAY_SCALE}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<Container y={BUTTON_Y} x={menuLeftX}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={buyX}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={autoX}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={spinX}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={turboX}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={BAR_CENTER_X + PANEL_ROW_HALF_GAP + 60}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container y={BUTTON_Y} x={BAR_CENTER_X + PANEL_ROW_HALF_GAP + 60 + betControlGap * 2}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>
	</Container>
</MainContainer>

{#if stateUi.menuOpen}
	<Rectangle
		eventMode="static"
		cursor="pointer"
		alpha={0.5}
		anchor={0.5}
		backgroundColor={BLACK}
		width={context.stateLayoutDerived.canvasSizes().width}
		height={context.stateLayoutDerived.canvasSizes().height}
		x={context.stateLayoutDerived.canvasSizes().width * 0.5}
		y={context.stateLayoutDerived.canvasSizes().height * 0.5}
		onpointerup={() => (stateUi.menuOpen = false)}
	/>

	<MainContainer standard alignVertical="bottom">
		<Container x={menuLeftX} y={barY}>
			<Container y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 2}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={DESKTOP_BASE_SIZE * 0.5 - 150 - 170 * 1}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={DESKTOP_BASE_SIZE * 0.5 - 150}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container y={DESKTOP_BASE_SIZE * 0.5}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
