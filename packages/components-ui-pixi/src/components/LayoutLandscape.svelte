<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';

	import { landscapeStackedLayout } from '../constants';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const ml = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const canvasSizeType = $derived(context.stateLayoutDerived.canvasSizeType());
	const almostSquare = $derived(
		context.stateLayoutDerived.canvasRatioType() === 'almostSquare',
	);
	const layout = $derived(
		landscapeStackedLayout(canvasSizeType, ml.height, ml.width, almostSquare),
	);
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container x={layout.balanceX} y={layout.yPanels}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<Container x={layout.winX} y={layout.yPanels}>
		{@render props.amountWin({ stacked: true })}
	</Container>

	<Container x={layout.betX} y={layout.yPanels}>
		{@render props.amountBet({ stacked: true })}
	</Container>

	<Container x={layout.menuLeftX} y={layout.yButtons}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<Container x={layout.buyX} y={layout.yButtons}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<Container x={layout.autoX} y={layout.yButtons}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<Container x={layout.spinX} y={layout.yButtons}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={layout.turboX} y={layout.yButtons}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>

	<Container x={layout.decreaseX} y={layout.yButtons}>
		{@render props.buttonDecrease({ anchor: 0.5 })}
	</Container>

	<Container x={layout.increaseX} y={layout.yButtons}>
		{@render props.buttonIncrease({ anchor: 0.5 })}
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
		<Container x={layout.menuLeftX} y={layout.yButtons}>
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
