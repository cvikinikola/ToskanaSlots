<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
	import type { TumbleSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		tumbleSymbol: TumbleSymbol;
	};

	const props: Props = $props();

	/** Tumble symbols are always "animating" so they render in the animate pass. */
	const animating = $derived(
		props.tumbleSymbol.symbolState === 'win' || props.tumbleSymbol.symbolState === 'explosion',
	);
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.tumbleSymbol.symbolY.current}
	{animating}
>
	<Symbol
		state={props.tumbleSymbol.symbolState}
		rawSymbol={props.tumbleSymbol.rawSymbol}
		oncomplete={props.tumbleSymbol.oncomplete}
	/>
</SymbolWrap>
