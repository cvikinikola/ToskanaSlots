<script lang="ts">
	import TumbleSymbol from './TumbleSymbol.svelte';
	import { getContext } from '../game/context';
	import { BOARD_DIMENSIONS } from '../game/constants';

	const context = getContext();
</script>

{#each context.stateGameDerived.tumbleBoardCombined() as tumbleSymbols, reelIndex (reelIndex)}
	{#each tumbleSymbols as tumbleSymbol, symbolIndex}
		<!--
			isPadding: simbol čiji `targetY = getSymbolY(symbolIndex - 1)` pada van
			vidljivih 5 redova — to su gornji rezervoar (symbolIndex 0 → y=−50)
			i svaki preostali sufiks ispod reda 4 (symbolIndex > BOARD_DIMENSIONS.y
			→ y >= 550). Ovi su uvek nevidljivi: ne smeju da se prikazuju ni u
			mirovanju ni dok tranzituju kroz vidljivi opseg tokom slideDown-a.
		-->
		<TumbleSymbol
			{reelIndex}
			{tumbleSymbol}
			isPadding={symbolIndex === 0 || symbolIndex > BOARD_DIMENSIONS.y}
		/>
	{/each}
{/each}
