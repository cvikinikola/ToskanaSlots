<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
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
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.reelSymbol.symbolY.current}
	{animating}
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
