<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { stateUi } from 'state-shared';
	import { BLACK } from 'constants-shared/colors';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { Container, Rectangle } from 'pixi-svelte';
	import { waitForResolve } from 'utils-shared/wait';

	import ButtonDrawer from './ButtonDrawer.svelte';
	import type { LayoutUiProps } from '../types';
	import {
		portraitActionAndEdgeCenters,
		portraitBetControlX,
		portraitStackedLayout,
		portraitUiRuntime,
	} from '../constants';
	import { getContext } from '../context';

	const props: LayoutUiProps = $props();
	const context = getContext();

	const ml = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const cx = $derived(ml.width * 0.5);
	const canvasSizeType = $derived(context.stateLayoutDerived.canvasSizeType());
	const { menuLeftX, buyX, autoX, spinX, turboX } = $derived(
		portraitActionAndEdgeCenters(ml.width, canvasSizeType),
	);
	const compactPortrait = $derived.by((): 'almostSquare' | 'nearSquare' | false => {
		const ratioType = context.stateLayoutDerived.canvasRatioType();
		const ratio = context.stateLayoutDerived.canvasRatio();
		if (ratioType === 'almostSquare') return 'almostSquare';
		if (ratioType === 'longHeight' && ratio >= 0.72) return 'nearSquare';
		return false;
	});
	const stacked = $derived(
		portraitStackedLayout(canvasSizeType, ml.height, ml.width, compactPortrait),
	);
	const Y_BUTTONS = $derived(stacked.yButtons);
	const Y_WIN = $derived(stacked.yWin);
	const Y_BALANCE = $derived(stacked.yBalance);
	const Y_BET_ROW = $derived(stacked.yBetRow);
	const betControlX = $derived(portraitBetControlX(ml.width, canvasSizeType));

	const DRAWER_Y = {
		unfold: 0,
		fold: 550,
	};
	const drawerTween = new Tween(stateUi.drawerFold ? DRAWER_Y.fold : DRAWER_Y.unfold, {
		easing: cubicInOut,
	});

	const DRAWER_BUTTON_Y = {
		unfold: 0,
		fold: 50,
	};
	const drawerButtonTween = new Tween(
		stateUi.drawerFold ? DRAWER_BUTTON_Y.fold : DRAWER_BUTTON_Y.unfold,
		{
			easing: cubicInOut,
		},
	);

	let drawerButtonFadeComplete = $state(() => {});

	/** Drawer fold must not shift the menu/spin row (it was pushing the bar off-screen). */
	const ensureDrawerUnfolded = async () => {
		if (!stateUi.drawerFold && drawerTween.current === DRAWER_Y.unfold) return;
		stateUi.drawerFold = false;
		drawerButtonTween.set(DRAWER_BUTTON_Y.unfold, { duration: 0 });
		await drawerTween.set(DRAWER_Y.unfold, { duration: 0 });
	};

	onMount(() => {
		void ensureDrawerUnfolded();
	});

	context.eventEmitter.subscribeOnMount({
		uiShow: async () => {
			await ensureDrawerUnfolded();
		},
		drawerButtonShow: async () => {
			if (!stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = true;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerButtonHide: async () => {
			if (stateUi.drawerButtonShow) {
				stateUi.drawerButtonShow = false;
				await waitForResolve((resolve) => (drawerButtonFadeComplete = resolve));
			}
		},
		drawerUnfold: async () => {
			if (stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.unfold);
				await drawerTween.set(DRAWER_Y.unfold);
			}
		},
		drawerFold: async () => {
			if (!stateUi.drawerFold) {
				drawerButtonTween.set(DRAWER_BUTTON_Y.fold);
				await drawerTween.set(DRAWER_Y.fold);
			}
		},
	});
</script>

<Container x={20}>
	{@render props.gameName()}
</Container>

<Container x={context.stateLayoutDerived.canvasSizes().width - 20}>
	{@render props.logo()}
</Container>

<MainContainer standard alignVertical="bottom">
	<Container x={menuLeftX} y={Y_BUTTONS}>
		{@render props.buttonMenu({ anchor: 0.5 })}
	</Container>

	<Container x={autoX} y={Y_BUTTONS}>
		{@render props.buttonAutoSpin({ anchor: 0.5 })}
	</Container>

	<Container x={spinX} y={Y_BUTTONS}>
		{@render props.buttonBet({ anchor: 0.5 })}
	</Container>

	<Container x={turboX} y={Y_BUTTONS}>
		{@render props.buttonTurbo({ anchor: 0.5 })}
	</Container>

	<Container x={buyX} y={Y_BUTTONS}>
		{@render props.buttonBuyBonus({ anchor: 0.5 })}
	</Container>

	<Container x={cx} y={Y_WIN}>
		{@render props.amountWin({ stacked: true })}
	</Container>
</MainContainer>

<MainContainer standard alignVertical="bottom">
	<Container x={cx} y={Y_BALANCE}>
		{@render props.amountBalance({ stacked: true })}
	</Container>

	<Container x={cx} y={Y_BET_ROW}>
		<Container x={-betControlX}>
			{@render props.buttonDecrease({ anchor: 0.5 })}
		</Container>
		<Container>
			{@render props.amountBet({ stacked: true })}
		</Container>
		<Container x={betControlX}>
			{@render props.buttonIncrease({ anchor: 0.5 })}
		</Container>
	</Container>

	<FadeContainer
		persistent
		show={stateUi.drawerButtonShow}
		oncomplete={drawerButtonFadeComplete}
		y={drawerButtonTween.current}
	>
		<Container x={buyX} y={Y_BET_ROW + 20}>
			<ButtonDrawer disabled={!stateUi.drawerButtonShow} anchor={0.5} />
		</Container>
	</FadeContainer>
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
		<Container x={menuLeftX} y={Y_BUTTONS}>
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
