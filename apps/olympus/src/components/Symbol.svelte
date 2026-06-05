<script lang="ts">
	import { Container, BitmapText, Sprite } from 'pixi-svelte';
	import { stateBet } from 'state-shared';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolAssetKey, getSymbolSpriteSize } from '../game/utils';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();

	const spriteKey = $derived(getSymbolAssetKey(props.rawSymbol.name));

	/**
	 * Visual feedback per state:
	 *  - win:           bright tint + slight scale-up
	 *  - postWinStatic: full colour fallback after win animation
	 *  - explosion:     red flash, fires oncomplete after 400ms
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
	const symbolSpriteSize = $derived(getSymbolSpriteSize(props.rawSymbol.name));

	// Trigger oncomplete for animation states that have no real spine track yet.
	// Turbo mode (QA 02.06.2026): shorten the win/explosion glow so the
	// multiplier animation (which now plays one M-symbol at a time, see
	// boardMultiplierInfo) finishes well before the next round starts —
	// otherwise the gold animation leaked into the next spin's symbols.
	// QA 03.06.2026: dodatno produženo turbo trajanje uništenja jer je 140ms
	// bilo prekratko — animacija se "razlivala" na sledeći cascade.
	$effect(() => {
		if (props.state === 'win' || props.state === 'explosion') {
			const duration = stateBet.isTurbo ? 360 : 400;
			const t = setTimeout(() => props.oncomplete?.(), duration);
			return () => clearTimeout(t);
		}
		if (props.state === 'land') {
			// Short bounce/settle delay before the symbol is considered done landing.
			const t = setTimeout(() => props.oncomplete?.(), 120);
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

	<!-- Multiplier badge – shown on M symbols -->
	{#if props.rawSymbol.multiplier}
		<BitmapText
			anchor={{ x: 0.5, y: 1 }}
			y={SYMBOL_SIZE * 0.42}
			text={`×${props.rawSymbol.multiplier}`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: SYMBOL_SIZE * 0.28,
				fill: 0xffd700,
				fontWeight: '800',
				stroke: { color: 0x1a0608, width: 4 },
			}}
		/>
	{/if}
</Container>
