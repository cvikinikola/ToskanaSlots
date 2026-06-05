<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, REM } from 'pixi-svelte';

	import { UI, UiAssetSprite } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import BackgroundVideo from './BackgroundVideo.svelte';
	import BottomUiBackdrop from './BottomUiBackdrop.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import MipmapEnabler from './MipmapEnabler.svelte';
	import Board from './Board.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import TumbleHistory from './TumbleHistory.svelte';
	import GlobalMultiplier from './GlobalMultiplier.svelte';
	import SpotMultipliers from './SpotMultipliers.svelte';
	import MultiplierFly from './MultiplierFly.svelte';
	import ReelFramePanel from './ReelFramePanel.svelte';
	import Win from './Win.svelte';
	import WinSparks from './WinSparks.svelte';
	import WinGlow from './WinGlow.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';
	import PayTableContent from './PayTableContent.svelte';
	import GameRulesContent from './GameRulesContent.svelte';

	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// Shrink the painted-text titles on stacked (portrait/tablet) layouts so
	// they don't crowd the centred reels.
	// QA 03.06.2026: the HAMMER OF THOR logo overlapped the MULTIPLIER panel
	// in the top-right corner on the SQUARE / "kockasti" screen, which is the
	// `tablet` layout type (NOT covered by isStacked(), which only matches
	// portrait). Scale it down there specifically, while keeping the existing
	// portrait/mobile size.
	const titleScale = $derived.by(() => {
		const layoutType = context.stateLayoutDerived.layoutType();
		if (layoutType === 'tablet') return 0.5; // square / kockasti screen
		if (layoutType === 'portrait') return 0.7; // mobile portrait
		if (layoutType === 'landscape') return 0.6; // mobile landscape
		return 1;
	});
</script>

<style lang="scss">
	.game-pixi {
		position: relative;
		z-index: 1;
	}
</style>

<BackgroundVideo />

<div class="game-pixi">
<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<MipmapEnabler />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<Sound />

		<BottomUiBackdrop />

		<MainContainer>
			<ReelFramePanel />
			<Board />
			<SpotMultipliers />
			<GlobalMultiplier />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
			<TumbleHistory />
			<TumbleWinAmount />
			<FreeSpinCounter />
			<MultiplierFly />
		</MainContainer>

		<WinSparks />
		<WinGlow />

		<UI>
			{#snippet gameName()}
				<!-- Single title used (logo snippet renders 'HAMMER OF THOR' top-right) -->
			{/snippet}
			{#snippet logo()}
				<UiAssetSprite
					assetKey="menu_logo"
					anchor={{ x: 1, y: 0 }}
					y={context.stateLayoutDerived.isStacked() ? REM * 0.5 : 0}
					width={REM * 13.8 * titleScale}
					height={REM * 2.95 * titleScale}
				/>
			{/snippet}
		</UI>

		<Win />
		<FreeSpinIntro />

		<FreeSpinOutro />
		<Transition />
	{/if}
</App>
</div>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
	{#snippet payTable()}
		<PayTableContent />
	{/snippet}
	{#snippet gameRules()}
		<GameRulesContent />
	{/snippet}
</Modals>
