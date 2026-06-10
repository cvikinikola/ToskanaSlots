<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, REM, Sprite } from 'pixi-svelte';

	import { UI } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';
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
	import MenuBarChromeFade from './MenuBarChromeFade.svelte';
	import BetControlsMenuSync from './BetControlsMenuSync.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import LogoTexturePrep from './LogoTexturePrep.svelte';
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
	import WinCelebration from './WinCelebration.svelte';
	import WinSparks from './WinSparks.svelte';
	import WinGlow from './WinGlow.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import FreeSpinOutroCoins from './FreeSpinOutroCoins.svelte';
	import Transition from './Transition.svelte';
	import PayTableContent from './PayTableContent.svelte';
	import GameRulesContent from './GameRulesContent.svelte';
	import PhoneLandscapeLogo from './PhoneLandscapeLogo.svelte';

	const context = getContext();

	$effect(() => {
		const stage = context.stateApp.pixiApplication?.stage;
		if (!stage) return;
		stage.sortableChildren = true;
		stage.sortChildren();
	});

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	/** logo_tuscany_harvest*.png aspect (height / width), 760×507. */
	const LOGO_ASPECT = 507 / 760;

	/** Logo width as fraction of canvas width — scales with viewport per layout. */
	const LOGO_WIDTH_FRAC = {
		desktop: 0.19 * 0.85 * 0.85,
		landscape: 0.28, // phone landscape uses PhoneLandscapeLogo (frame-anchored)
		portrait: 0.38 * 0.7, // 30% smaller than default portrait frac
		tablet: 0.24 * 0.85 * 0.85, // square / kockasti tablet
	} as const;

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isFreeSpins = $derived(stateGame.gameType === 'freeSpins');
	const logoWidth = $derived(canvas.width * LOGO_WIDTH_FRAC[layoutType]);
	const logoHeight = $derived(logoWidth * LOGO_ASPECT);
	const logoY = $derived(context.stateLayoutDerived.isStacked() ? REM * 0.5 : 0);
	const logoOnRight = $derived(layoutType !== 'portrait');
	const logoInUi = $derived(logoOnRight && layoutType !== 'landscape');
	const logoKey = $derived(isFreeSpins ? 'logo_day' : 'logo');
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

	<LogoTexturePrep />
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

		<!-- BET + +/- and beside deka — same fade as menu bar (uiHide + intro/outro). -->
		<MenuBarChromeFade>
			<DekaSaluteOverlay />
			<BetAmountForeground />
		</MenuBarChromeFade>

		<WinSparks />
		<WinGlow />

		<PhoneLandscapeLogo />

		<UI>
			{#snippet gameName()}
				{#if !logoOnRight}
					<Sprite
						key={logoKey}
						anchor={{ x: 0, y: 0 }}
						y={logoY}
						width={logoWidth}
						height={logoHeight}
					/>
				{/if}
			{/snippet}
			{#snippet logo()}
				{#if logoInUi}
					<Sprite
						key={logoKey}
						anchor={{ x: 1, y: 0 }}
						x={0}
						y={logoY}
						width={logoWidth}
						height={logoHeight}
					/>
				{/if}
			{/snippet}
		</UI>

		<Win />
		<WinCelebration />
		<FreeSpinIntro />

		<FreeSpinOutroCoins />
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
