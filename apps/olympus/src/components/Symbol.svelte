<script lang="ts">
	import { Container, BitmapText, Sprite } from 'pixi-svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, SYMBOL_CELL_WIDTH, SYMBOL_CELL_HEIGHT, SYMBOL_WIN_DURATION_MS, SYMBOL_EXPLOSION_DURATION_MS, SYMBOL_LAND_DURATION_MS } from '../game/constants';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();

	/** Asset key for the symbol sprite (registered in src/game/assets.ts). */
	const spriteKey = $derived(`sym_${props.rawSymbol.name.toLowerCase()}`);

	/**
	 * Visual feedback per state:
	 *  - win:           bright tint + slight scale-up
	 *  - postWinStatic: full colour fallback after win animation
	 *  - explosion:     red flash, fires oncomplete after SYMBOL_EXPLOSION_DURATION_MS
	 *  - default:       full colour
	 */
	const tint = $derived(
		props.state === 'win'
			? 0xffffff
			: props.state === 'postWinStatic'
				? 0xffffff
				: props.state === 'explosion'
					? 0xff5555
					: 0xffffff,
	);

	const scale = $derived(props.state === 'win' ? 1.05 : 1);
	const symbolSpriteSize = Math.min(SYMBOL_CELL_WIDTH, SYMBOL_CELL_HEIGHT) * 0.99;

	// Trigger oncomplete for animation states that have no real spine track yet.
	$effect(() => {
		if (props.state === 'win' || props.state === 'explosion') {
			const ms = props.state === 'win' ? SYMBOL_WIN_DURATION_MS : SYMBOL_EXPLOSION_DURATION_MS;
			const t = setTimeout(() => props.oncomplete?.(), ms);
			return () => clearTimeout(t);
		}
		if (props.state === 'land') {
			// Short bounce/settle delay before the symbol is considered done landing.
			const t = setTimeout(() => props.oncomplete?.(), SYMBOL_LAND_DURATION_MS);
			return () => clearTimeout(t);
		}
	});
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} {scale}>
	<Sprite
		key={spriteKey}
		anchor={0.5}
		width={symbolSpriteSize}
		height={symbolSpriteSize}
		roundPixels
		tint={tint}
	/>

</Container>
