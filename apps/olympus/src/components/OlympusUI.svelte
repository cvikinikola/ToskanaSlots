<script lang="ts">
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';

	import { applyPortraitUiRuntime, isCompactPortraitHud } from 'components-ui-pixi';
	import { EnableSpaceHold } from 'components-shared';
	import UiFadeContainer from 'components-ui-pixi/src/components/UiFadeContainer.svelte';
	import LayoutDesktop from 'components-ui-pixi/src/components/LayoutDesktop.svelte';
	import LayoutPortrait from './LayoutPortrait.svelte';
	import LayoutTablet from 'components-ui-pixi/src/components/LayoutTablet.svelte';
	import LabelBalance from 'components-ui-pixi/src/components/LabelBalance.svelte';
	import LabelWin from 'components-ui-pixi/src/components/LabelWin.svelte';
	import LabelBet from 'components-ui-pixi/src/components/LabelBet.svelte';
	import ButtonPayTable from 'components-ui-pixi/src/components/ButtonPayTable.svelte';
	import ButtonGameRules from 'components-ui-pixi/src/components/ButtonGameRules.svelte';
	import ButtonSettings from 'components-ui-pixi/src/components/ButtonSettings.svelte';
	import ButtonBuyBonus from 'components-ui-pixi/src/components/ButtonBuyBonus.svelte';
	import ButtonBet from 'components-ui-pixi/src/components/ButtonBet.svelte';
	import ButtonTurbo from 'components-ui-pixi/src/components/ButtonTurbo.svelte';
	import ButtonAutoSpin from 'components-ui-pixi/src/components/ButtonAutoSpin.svelte';
	import ButtonIncrease from 'components-ui-pixi/src/components/ButtonIncrease.svelte';
	import ButtonDecrease from 'components-ui-pixi/src/components/ButtonDecrease.svelte';
	import ButtonMenu from 'components-ui-pixi/src/components/ButtonMenu.svelte';
	import ButtonMenuClose from 'components-ui-pixi/src/components/ButtonMenuClose.svelte';
	import ButtonSoundSwitch from 'components-ui-pixi/src/components/ButtonSoundSwitch.svelte';

	import LayoutLandscape from './LayoutLandscape.svelte';
	import { getOlympusLandscapeHudLayout } from '../game/hudLandscapeLayout';
	import { getOlympusPortraitHudLayout } from '../game/hudPortraitLayout';
	import { getContext } from '../game/context';

	type Props = {
		gameName: Snippet;
		logo: Snippet;
	};

	const props: Props = $props();
	const context = getContext();

	const LAYOUT_COMPONENT_MAP = {
		desktop: LayoutDesktop,
		portrait: LayoutPortrait,
		landscape: LayoutLandscape,
		tablet: LayoutTablet,
	};

	const LayoutComponent = $derived(
		LAYOUT_COMPONENT_MAP[context.stateLayoutDerived.layoutType()],
	);

	/** Sync bar scale + plates when orientation changes (not every HUD layout pass). */
	$effect(() => {
		const layoutType = context.stateLayoutDerived.layoutType();
		const stdMain = context.stateLayoutDerived.mainLayoutStandard();
		const sizeType = context.stateLayoutDerived.canvasSizeType();
		const ratioType = context.stateLayoutDerived.canvasRatioType();
		const ratio = context.stateLayoutDerived.canvasRatio();

		untrack(() => {
			const hudContext = {
				stateLayoutDerived: context.stateLayoutDerived,
				stateGameDerived: context.stateGameDerived,
			};

			if (layoutType === 'landscape') {
				getOlympusLandscapeHudLayout(hudContext);
			} else if (layoutType === 'portrait') {
				getOlympusPortraitHudLayout(hudContext);
			} else {
				const compact = isCompactPortraitHud(ratioType, ratio)
					? ratioType === 'almostSquare'
						? ('almostSquare' as const)
						: ('nearSquare' as const)
					: false;
				applyPortraitUiRuntime(sizeType, stdMain.width, compact);
			}
		});
	});
</script>

<EnableSpaceHold />

<UiFadeContainer>
	<LayoutComponent>
		{#snippet gameName()}
			{@render props.gameName()}
		{/snippet}

		{#snippet logo()}
			{@render props.logo()}
		{/snippet}

		{#snippet amountBalance(labelProps)}
			<LabelBalance {...labelProps} />
		{/snippet}

		{#snippet amountWin(labelProps)}
			<LabelWin {...labelProps} />
		{/snippet}

		{#snippet amountBet(labelProps)}
			<LabelBet {...labelProps} />
		{/snippet}

		{#snippet buttonBuyBonus(buttonProps)}
			<ButtonBuyBonus {...buttonProps} />
		{/snippet}

		{#snippet buttonBet(buttonProps)}
			<ButtonBet {...buttonProps} />
		{/snippet}

		{#snippet buttonTurbo(buttonProps)}
			<ButtonTurbo {...buttonProps} />
		{/snippet}

		{#snippet buttonAutoSpin(buttonProps)}
			<ButtonAutoSpin {...buttonProps} />
		{/snippet}

		{#snippet buttonIncrease(buttonProps)}
			<ButtonIncrease {...buttonProps} />
		{/snippet}

		{#snippet buttonDecrease(buttonProps)}
			<ButtonDecrease {...buttonProps} />
		{/snippet}

		{#snippet buttonMenu(buttonProps)}
			<ButtonMenu {...buttonProps} />
		{/snippet}

		{#snippet buttonMenuClose(buttonProps)}
			<ButtonMenuClose {...buttonProps} />
		{/snippet}

		{#snippet buttonPayTable(buttonProps)}
			<ButtonPayTable {...buttonProps} />
		{/snippet}

		{#snippet buttonGameRules(buttonProps)}
			<ButtonGameRules {...buttonProps} />
		{/snippet}

		{#snippet buttonSettings(buttonProps)}
			<ButtonSettings {...buttonProps} />
		{/snippet}

		{#snippet buttonSoundSwitch(buttonProps)}
			<ButtonSoundSwitch {...buttonProps} />
		{/snippet}
	</LayoutComponent>
</UiFadeContainer>
