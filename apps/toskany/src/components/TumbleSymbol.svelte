<script lang="ts">
	import Symbol from './Symbol.svelte';
	import SymbolWrap from './SymbolWrap.svelte';
	import { getSymbolX } from '../game/utils';
	import type { TumbleSymbol } from '../game/stateGame.svelte';

	type Props = {
		reelIndex: number;
		tumbleSymbol: TumbleSymbol;
		isPadding: boolean;
	};

	const props: Props = $props();

	// Tumble overlay: always the animate pass — avoids static↔animate pass switches
	// when a symbol enters 'explosion', which briefly unmounted neighbours in QA.
	const animating = true;
</script>

<SymbolWrap
	x={getSymbolX(props.reelIndex)}
	y={props.tumbleSymbol.symbolY.current}
	{animating}
	isPadding={props.isPadding}
>
	<Symbol
		state={props.tumbleSymbol.symbolState}
		rawSymbol={props.tumbleSymbol.rawSymbol}
		oncomplete={() => {
			if (props.tumbleSymbol.symbolState === 'land') {
				props.tumbleSymbol.symbolState = 'static';
			}
			props.tumbleSymbol.oncomplete();
		}}
	/>
</SymbolWrap>
