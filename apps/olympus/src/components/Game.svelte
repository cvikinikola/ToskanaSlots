<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App, Text, REM } from 'pixi-svelte';
	import { stateModal } from 'state-shared';

	import { UI } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableSound from './EnableSound.svelte';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import Background from './Background.svelte';
	import BottomUiBackdrop from './BottomUiBackdrop.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import MipmapEnabler from './MipmapEnabler.svelte';
	import Board from './Board.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import GlobalMultiplier from './GlobalMultiplier.svelte';
	import ReelFramePanel from './ReelFramePanel.svelte';
	import Win from './Win.svelte';
	import WinSparks from './WinSparks.svelte';
	import LightningCrackle from './LightningCrackle.svelte';
	import AmbientLightning from './AmbientLightning.svelte';
	import SkyLightning from './SkyLightning.svelte';
	import WinGlow from './WinGlow.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	// Shrink the painted-text titles on stacked (portrait/tablet) layouts so
	// they don't crowd the centred reels.
	const titleScale = $derived(
		context.stateLayoutDerived.isStacked() ? 0.7 : 1,
	);
	// On portrait/tablet Thor is rendered above the frame — hide the text title
	// to avoid clashing with the 3-D character in the same area.
	const isStacked = $derived(context.stateLayoutDerived.isStacked());
</script>

<App>
	<EnableSound />
	<EnableHotkey />
	<EnableGameActor />
	<EnablePixiExtension />

	<MipmapEnabler />

	<Background />

	{#if context.stateLayout.showLoadingScreen}
		<LoadingScreen onloaded={() => (context.stateLayout.showLoadingScreen = false)} />
	{:else}
		<ResumeBet />
		<Sound />

		<BottomUiBackdrop />

		<MainContainer>
			<ReelFramePanel />
			<Board />
			<TumbleWinAmount />
			<GlobalMultiplier />
		</MainContainer>

		<MainContainer>
			<TumbleBoard />
		</MainContainer>

		<WinSparks />
		<LightningCrackle />
		<AmbientLightning />
		<SkyLightning />
		<WinGlow />

		<UI>
			{#snippet gameName()}
				<!-- Single title used (logo snippet renders 'HAMMER OF THOR' top-right) -->
			{/snippet}
			{#snippet logo()}
				{#if !isStacked}
					<Text
						anchor={{ x: 1, y: 0 }}
						text="HAMMER OF THOR"
						style={{
							fontFamily: 'serif',
							fontSize: REM * 1.7 * titleScale,
							fontWeight: '900',
							lineHeight: REM * 2 * titleScale,
							fill: 0xffd147,
							stroke: { color: 0x2a0d0d, width: 4 },
							letterSpacing: 4,
							dropShadow: {
								color: 0x7df0ff,
								alpha: 0.55,
								blur: 6,
								distance: 0,
								angle: 0,
							},
						}}
					/>
				{/if}
			{/snippet}
		</UI>

		<Win />
		<FreeSpinIntro />

		{#if ['desktop', 'landscape'].includes(context.stateLayoutDerived.layoutType())}
			<FreeSpinCounter />
		{/if}

		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
