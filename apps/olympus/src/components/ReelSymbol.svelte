<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
	import { BOARD_DIMENSIONS } from '../game/constants';
	import type { ReelSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		reelSymbol: ReelSymbol;
	};

	const props: Props = $props();

	/**
	 * A symbol is 'animating' when it is in a state that requires the animated
	 * render pass (currently: win, explosion).
	 * SymbolWrap uses this to decide which BoardContext pass to render in.
	 */
	const animating = $derived(
		props.reelSymbol.symbolState === 'win' || props.reelSymbol.symbolState === 'explosion',
	);

	/**
	 * Padding (rezervoar) symbol: symbolIndexOfBoard === -1 (top buffer) or
	 * === BOARD_DIMENSIONS.y (bottom buffer). Visible rows are 0..BOARD_DIMENSIONS.y-1.
	 * Padding must NEVER be visible — it only exists so cascading symbols have a
	 * place to fall in from / out to.
	 */
	const isPadding = $derived(
		props.reelSymbol.symbolIndexOfBoard < 0 ||
			props.reelSymbol.symbolIndexOfBoard >= BOARD_DIMENSIONS.y,
	);
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY.current}
	{animating}
	{isPadding}
>
	<Symbol
		state={props.reelSymbol.symbolState}
		rawSymbol={props.reelSymbol.rawSymbol}
		oncomplete={() => {
			if (props.reelSymbol.symbolState === 'win') props.reelSymbol.oncomplete();
			if (props.reelSymbol.symbolState === 'land') props.reelSymbol.symbolState = 'static';
		}}
	/>
</SymbolWrap>
