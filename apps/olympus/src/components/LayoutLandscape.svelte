<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import type { LayoutUiProps } from 'components-ui-pixi';
	import { getContext } from '../game/context';
	import ButtonOlympusLandscapeAutoSpin from './ButtonOlympusLandscapeAutoSpin.svelte';
	import ButtonOlympusLandscapeSettings from './ButtonOlympusLandscapeSettings.svelte';
	import ButtonOlympusLandscapeSound from './ButtonOlympusLandscapeSound.svelte';
	import ButtonOlympusLandscapeTurbo from './ButtonOlympusLandscapeTurbo.svelte';
	import { getOlympusLandscapeHudLayout } from '../game/hudLandscapeLayout';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const layout = $derived(getOlympusLandscapeHudLayout(context));
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
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<Container x={layout.settingsX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeSettings anchor={0.5} iconSide={layout.bottomBarIconSide} />
	</Container>

	<Container x={layout.muteX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeSound anchor={0.5} iconSide={layout.bottomBarIconSide} />
	</Container>

	<Container x={layout.autoX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeAutoSpin anchor={0.5} iconSide={layout.bottomBarIconSide} />
	</Container>

	<Container x={layout.turboX} y={layout.yBottomBarIcons}>
		<ButtonOlympusLandscapeTurbo anchor={0.5} iconSide={layout.bottomBarIconSide} />
	</Container>

	<Container x={layout.spinStackX} y={layout.increaseY} scale={layout.betControlScale}>
		{@render props.buttonIncrease({ anchor: 0.5 })}
	</Container>

	<Container x={layout.spinStackX} y={layout.spinY} scale={layout.spinScale}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={layout.spinStackX} y={layout.decreaseY} scale={layout.betControlScale}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
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
