<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, BitmapText, REM } from 'pixi-svelte';

	import { UI } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import ReplayControls from './ReplayControls.svelte';
	import ReplayPhaseTracker from './ReplayPhaseTracker.svelte';
	import Sound from './Sound.svelte';
	import BackgroundVideo from './BackgroundVideo.svelte';
	import BackgroundCharacter from './BackgroundCharacter.svelte';
	import DekaSaluteOverlay from './DekaSaluteOverlay.svelte';
	import BetAmountForeground from './BetAmountForeground.svelte';
	import BetControlsMenuSync from './BetControlsMenuSync.svelte';
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
	import FreeSpinOutroCoins from './FreeSpinOutroCoins.svelte';
	import Transition from './Transition.svelte';
	import PayTableContent from './PayTableContent.svelte';
	import GameRulesContent from './GameRulesContent.svelte';

	const context = getContext();

	$effect(() => {
		const stage = context.stateApp.pixiApplication?.stage;
		if (!stage) return;
		stage.sortableChildren = true;
		stage.sortChildren();
	});

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// Global multiplier for top-right "Toskany Harvest" title (all layouts).
	const TITLE_FONT_GLOBAL_SCALE = 1.22;

	// Shrink the painted-text titles on stacked (portrait/tablet) layouts so
	// they don't crowd the centred reels.
	// QA 03.06.2026: the Toskany Harvest title overlapped the MULTIPLIER panel
	// in the top-right corner on the SQUARE / "kockasti" screen, which is the
	// `tablet` layout type (NOT covered by isStacked(), which only matches
	// portrait). Scale it down there specifically, while keeping the existing
	// portrait/mobile size.
	const titleScale = $derived.by(() => {
		const layoutType = context.stateLayoutDerived.layoutType();
		if (layoutType === 'tablet') return 0.68; // square / kockasti screen
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
		<ReplayControls />
		<ReplayPhaseTracker />
		<Sound />

		<BetControlsMenuSync />
		<BackgroundCharacter layer="background" />
		<!-- Portrait deka — iza okvira grida (ispod MainContainer). -->
		<BackgroundCharacter layer="portrait" />

		<MainContainer>
			<ReelFramePanel />
			<Board />
			<GlobalMultiplier />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
			<TumbleHistory />
			<TumbleWinAmount />
			<FreeSpinCounter />
			<MultiplierFly />
		</MainContainer>

		<!--
			Spot multipliers (Sugar Rush) su POZICIONI overlay i moraju ostati
			vidljivi PREKO ćelije i tokom eksplozije/refill-a. Zato se crtaju POSLE
			TumbleBoard grupe (koja prekriva prvi MainContainer), inače bi novi
			refill simbol prekrio marker i delovalo bi da se spot „izgubi".
		-->
		<MainContainer>
			<SpotMultipliers />
		</MainContainer>

		<!-- Beside deka always in foreground layer (arm over frame). Portrait salute too. -->
		<DekaSaluteOverlay />

		<WinSparks />
		<WinGlow />

		<UI>
			{#snippet gameName()}
				<!-- Single title used (logo snippet renders 'Toskany Harvest' top-right) -->
			{/snippet}
			{#snippet logo()}
				<BitmapText
					text="Toskany Harvest"
					anchor={{ x: 1, y: 0 }}
					x={0}
					y={context.stateLayoutDerived.isStacked() ? REM * 0.5 : 0}
					style={{
						fontFamily: 'system-ui',
						fontSize: REM * 1.15 * titleScale * TITLE_FONT_GLOBAL_SCALE,
						fill: 0xf5d78e,
						fontWeight: '700',
						stroke: {
							color: 0x3d2817,
							width: 5 * titleScale * TITLE_FONT_GLOBAL_SCALE,
						},
						letterSpacing: 1 * titleScale * TITLE_FONT_GLOBAL_SCALE,
					}}
				/>
			{/snippet}
		</UI>

		<Win />
		<FreeSpinIntro />

		<FreeSpinOutroCoins />
		<FreeSpinOutro />

		<!-- Last HUD layer: BET + +/- must stay above deka even if overlay mounts later. -->
		<BetAmountForeground />

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
