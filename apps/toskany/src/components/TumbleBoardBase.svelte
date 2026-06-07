<script lang="ts">
	import TumbleSymbol from './TumbleSymbol.svelte';
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS } from '../game/constants';

	const context = getContext();
</script>

{#each context.stateGameDerived.tumbleBoardCombined() as tumbleSymbols, reelIndex (reelIndex)}
	{#each tumbleSymbols as tumbleSymbol, symbolIndex (tumbleSymbol)}
		<!--
			isPadding iz KOMBINOVANOG indeksa (konačni raspored): index 0 = gornji
			rezervoar (cilj y<0), index > BOARD_DIMENSIONS.y = donji rezervoar.
			Vidljivi su tačno index 1..7 (redovi 0..6). Adding simboli se kreiraju
			tek u slideDown, pa kombinovana dužina ostaje 9 i ovo mapiranje je
			ispravno i tokom eksplozije i posle refill-a.
		-->
		<TumbleSymbol
			{reelIndex}
			{tumbleSymbol}
			isPadding={symbolIndex === 0 || symbolIndex > BOARD_DIMENSIONS.y}
		/>
	{/each}
{/each}
