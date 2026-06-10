<script lang="ts">
	import { onMount } from 'svelte';
	import { stateUi } from 'state-shared';

	import { getContext } from '../game/context';
	import { syncBetControlsUiState, applyPanelChromeUiState } from '../game/betControlsForeground';

	const context = getContext();

	$effect(() => {
		const intro = context.stateGame.freeSpinIntroActive;
		const outro = context.stateGame.freeSpinOutroActive;
		const transition = context.stateGame.transitionActive;
		const menuBarVisible = stateUi.pixiMenuBarVisible;
		void menuBarVisible;
		const suppress = { freeSpinIntroActive: intro, freeSpinOutroActive: outro, transitionActive: transition };
		const { betControlsHidden, amountBetInForeground } = syncBetControlsUiState({
			canvasSizes: context.stateLayoutDerived.canvasSizes(),
			mainLayout: context.stateLayoutDerived.mainLayout(),
			layoutType: context.stateLayoutDerived.layoutType(),
			gameType: context.stateGame.gameType,
			suppress,
			menuOpen: stateUi.menuOpen,
		});
		stateUi.betControlsHidden = betControlsHidden;
		stateUi.amountBetInForeground = amountBetInForeground;
		applyPanelChromeUiState();
	});

	onMount(() => () => {
		stateUi.betControlsHidden = false;
		stateUi.amountBetInForeground = false;
	});
</script>
