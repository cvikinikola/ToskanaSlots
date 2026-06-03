<script lang="ts">
	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle, anchorToPivot } from 'pixi-svelte';

	import { LANDSCAPE_BASE_SIZE, LANDSCAPE_BACKGROUND_WIDTH_LIST } from '../constants';
	import type { LayoutUiProps } from '../types';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width * 0.5}
		y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 40}
		pivot={anchorToPivot({
			anchor: { x: 0.5, y: 0 },
			sizes: {
				height: LANDSCAPE_BASE_SIZE,
				width: LANDSCAPE_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
			},
		})}
	>
		<!--
			QA (phone landscape): pull side buttons inward so they sit close to
			the centred Balance / Win / Bet strip instead of hugging the screen
			edges. Bottom info amounts (balance/win/bet) stay in place.
				• menu left edge aligns with balance plate left edge
				  (balance center 420, plate half-width 241 → plate left 179;
				   button half-width 60 → menu center 239)
				• buy bonus keeps same spacing from menu (was 175 gap)
				• decrease / increase: shifted left (was 1580 / 1715)
		-->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={239} scale={0.8}>
			{@render props.buttonMenu({ anchor: 0.5 })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={414} scale={0.8}>
			{@render props.buttonBuyBonus({ anchor: 0.5 })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={420} scale={0.8}>
			{@render props.amountBalance({ stacked: true })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={910} scale={0.8}>
			{@render props.amountWin({ stacked: true })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={1400} scale={0.8}>
			{@render props.amountBet({ stacked: true })}
		</Container>

		<!--
			QA 03.06.2026: nudge auto-spin / turbo left and add more spacing
			between them. Turbo's right edge aligns with the BET plate right
			edge (bet center 1400, plate half-width ~241 × scale 0.8 ≈ 193 →
			right edge ≈ 1593; button half-width 60 × 0.8 ≈ 48 → turbo center
			≈ 1545). Auto-spin sits ~150 px to its left.
		-->
		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={1395} scale={0.8}>
			{@render props.buttonAutoSpin({ anchor: 0.5 })}
		</Container>

		<Container y={LANDSCAPE_BASE_SIZE * 0.5 - 90} x={1545} scale={0.8}>
			{@render props.buttonTurbo({ anchor: 0.5 })}
		</Container>
	</Container>

	<!--
		QA (phone landscape): pull the right-side action column inward from the
		screen edge so it sits vertically above the bottom row, aligned with
		their midpoint. Lifted the column ~80 px so the bottom button clears
		the bottom info bar.
		QA 02.06.2026: on phone landscape, swap the +/- (decrease/increase)
		buttons with the auto-spin / turbo buttons. Auto-spin + turbo now live
		on the bottom row (next to the bet amount), while +/- moved into this
		right column above/below the spin button.
	-->
	<Container
		x={context.stateLayoutDerived.mainLayoutStandard().width - 318}
		y={context.stateLayoutDerived.mainLayoutStandard().height * 0.5 - 80}
		pivot={anchorToPivot({
			anchor: { x: 1, y: 0.5 },
			sizes: {
				height: LANDSCAPE_BASE_SIZE,
				width: LANDSCAPE_BASE_SIZE,
			},
		})}
	>
		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 - 140} scale={0.8}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>

		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5} scale={0.8}>
			{@render props.buttonBet({ anchor: 0.5 })}
		</Container>

		<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 + 140} scale={0.8}>
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
		<Container
			x={165}
			y={context.stateLayoutDerived.mainLayoutStandard().height - LANDSCAPE_BASE_SIZE - 130}
		>
			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 3}>
				{@render props.buttonPayTable({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 2}>
				{@render props.buttonSettings({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150 - 170 * 1}>
				{@render props.buttonGameRules({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5 - 150}>
				{@render props.buttonSoundSwitch({ anchor: 0.5 })}
			</Container>

			<Container scale={0.8} y={LANDSCAPE_BASE_SIZE * 0.5}>
				{@render props.buttonMenuClose({ anchor: 0.5 })}
			</Container>
		</Container>
	</MainContainer>
{/if}
