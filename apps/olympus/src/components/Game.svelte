<script lang="ts">
	import { onMount } from 'svelte';

	import { EnablePixiExtension } from 'components-pixi';
	import { EnableHotkey } from 'components-shared';
	import { MainContainer } from 'components-layout';
	import { App } from 'pixi-svelte';

	import { UI } from 'components-ui-pixi';
	import { GameVersion, Modals } from 'components-ui-html';

	import { getContext } from '../game/context';
	import EnableGameActor from './EnableGameActor.svelte';
	import ResumeBet from './ResumeBet.svelte';
	import Sound from './Sound.svelte';
	import NatureAmbience from './NatureAmbience.svelte';
	import Background from './Background.svelte';
	import LoadingScreen from './LoadingScreen.svelte';
	import MipmapEnabler from './MipmapEnabler.svelte';
	import Board from './Board.svelte';
	import TumbleBoard from './TumbleBoard.svelte';
	import TumbleWinAmount from './TumbleWinAmount.svelte';
	import TumbleHistory from './TumbleHistory.svelte';
	import SpotMultipliers from './SpotMultipliers.svelte';
	import ReelFramePanel from './ReelFramePanel.svelte';
	import Win from './Win.svelte';
	import WinSparks from './WinSparks.svelte';
	import AmbientNature from './AmbientNature.svelte';
	import NatureBurst from './NatureBurst.svelte';
	import WinGlow from './WinGlow.svelte';
	import FreeSpinIntro from './FreeSpinIntro.svelte';
	import FreeSpinCounter from './FreeSpinCounter.svelte';
	import FreeSpinOutro from './FreeSpinOutro.svelte';
	import Transition from './Transition.svelte';

	const context = getContext();

	onMount(() => (context.stateLayout.showLoadingScreen = true));

	const gameAlignBottom = $derived(
		context.stateLayoutDerived.layoutType() === 'landscape',
	);
</script>

<App>
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
		<NatureAmbience />

		<MainContainer
			standard={gameAlignBottom}
			alignVertical={gameAlignBottom ? 'bottom' : undefined}
		>
			<ReelFramePanel />
			<Board />
			<SpotMultipliers />
			<WinGlow />
			<WinSparks />
		</MainContainer>

		<MainContainer
			standard={gameAlignBottom}
			alignVertical={gameAlignBottom ? 'bottom' : undefined}
		>
			<TumbleBoard />
			<TumbleHistory />
			<TumbleWinAmount />
			<FreeSpinCounter />
		</MainContainer>

		<AmbientNature />
		<NatureBurst />

		<UI>
			{#snippet gameName()}{/snippet}
			{#snippet logo()}{/snippet}
		</UI>

		<Win />
		<FreeSpinIntro />

		<FreeSpinOutro />
		<Transition />
	{/if}
</App>

<Modals>
	{#snippet version()}
		<GameVersion version="0.0.0" />
	{/snippet}
</Modals>
