<script lang="ts">
	import { onMount } from 'svelte';
	import { stateUi } from 'state-shared';

	import { getContext } from '../game/context';
	import { syncBetControlsUiState } from '../game/betControlsForeground';

	const context = getContext();

	$effect(() => {
		const { betControlsHidden, amountBetInForeground } = syncBetControlsUiState({
			canvasSizes: context.stateLayoutDerived.canvasSizes(),
			mainLayout: context.stateLayoutDerived.mainLayout(),
			layoutType: context.stateLayoutDerived.layoutType(),
			gameType: context.stateGame.gameType,
			suppress: context.stateGame,
			menuOpen: stateUi.menuOpen,
		});
		stateUi.betControlsHidden = betControlsHidden;
		stateUi.amountBetInForeground = amountBetInForeground;
	});

	onMount(() => () => {
		stateUi.betControlsHidden = false;
		stateUi.amountBetInForeground = false;
	});
</script>
