<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import { UiAssetSprite } from 'components-ui-pixi';
	import type { LayoutUiProps } from 'components-ui-pixi';
	import { getContext } from '../game/context';
	import ButtonOlympusLandscapeAutoSpin from './ButtonOlympusLandscapeAutoSpin.svelte';
	import ButtonOlympusLandscapeSettings from './ButtonOlympusLandscapeSettings.svelte';
	import ButtonOlympusLandscapeSound from './ButtonOlympusLandscapeSound.svelte';
	import ButtonOlympusLandscapeTurbo from './ButtonOlympusLandscapeTurbo.svelte';
	import ButtonOlympusLandscapeIncrease from './ButtonOlympusLandscapeIncrease.svelte';
	import ButtonOlympusLandscapeDecrease from './ButtonOlympusLandscapeDecrease.svelte';
	import { getOlympusLandscapeHudLayout } from '../game/hudLandscapeLayout';
	import LandscapeShelfStatus from './LandscapeShelfStatus.svelte';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const layout = $derived(getOlympusLandscapeHudLayout(context));
	const almostSquare = $derived(
		context.stateLayoutDerived.canvasRatioType() === 'almostSquare',
	);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<!-- Game mainLayout — HUD tracks board frame position/scale -->
<MainContainer>
	<Container x={layout.balanceX} y={layout.yPanels}>
		{@render props.amountBalance({ stacked: true, labelAbove: layout.labelAbove })}
	</Container>

	<Container x={layout.winX} y={layout.yPanels}>
		{@render props.amountWin({ stacked: true, labelAbove: layout.labelAbove })}
	</Container>

	<Container x={layout.betX} y={layout.yPanels}>
		{@render props.amountBet({ stacked: true, labelAbove: layout.labelAbove })}
	</Container>

	<Container x={layout.buyX} y={layout.buyY}>
		<UiAssetSprite
			assetKey="menu_buy_bonus_panel"
			anchor={0.5}
			width={layout.leftColumnWidth}
			height={layout.buyPanelHeight}
		/>
		<Container x={0} y={0} scale={{ x: layout.buyScaleX, y: layout.buyScaleY }}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>
	</Container>

	<Container x={layout.settingsX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeSettings
			anchor={0.5}
			iconSide={layout.bottomBarIconSide}
			hitUiScale={layout.uiScale}
		/>
	</Container>

	<Container x={layout.muteX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeSound
			anchor={0.5}
			iconSide={layout.bottomBarIconSide}
			hitUiScale={layout.uiScale}
		/>
	</Container>

	<LandscapeShelfStatus />

	<Container x={layout.autoX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeAutoSpin
			anchor={0.5}
			iconSide={layout.bottomBarIconSide}
			hitUiScale={layout.uiScale}
		/>
	</Container>

	<Container x={layout.turboX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeTurbo
			anchor={0.5}
			iconSide={layout.bottomBarIconSide}
			hitUiScale={layout.uiScale}
		/>
	</Container>

	{#if almostSquare}
		<Container x={layout.spinStackX} y={layout.increaseY}>
			<ButtonOlympusLandscapeIncrease
				anchor={0.5}
				iconSide={layout.bottomBarIconSide}
				hitUiScale={layout.uiScale}
			/>
		</Container>
	{:else}
		<Container x={layout.spinStackX} y={layout.increaseY} scale={layout.betControlScale}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>
	{/if}

	<Container x={layout.spinStackX} y={layout.spinY} scale={layout.spinScale}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	{#if almostSquare}
		<Container x={layout.spinStackX} y={layout.decreaseY}>
			<ButtonOlympusLandscapeDecrease
				anchor={0.5}
				iconSide={layout.bottomBarIconSide}
				hitUiScale={layout.uiScale}
			/>
		</Container>
	{:else}
		<Container x={layout.spinStackX} y={layout.decreaseY} scale={layout.betControlScale}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>
	{/if}
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

	<MainContainer>
		<Container x={layout.settingsX} y={layout.yBottomBarIcons}>
			<Container y={-190 - 210 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container y={-190 - 210 * 2}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container y={-190 - 210 * 1}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container y={-190}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
