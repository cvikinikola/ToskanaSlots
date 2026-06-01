<script lang="ts">
	import { Container, Sprite, Graphics } from 'pixi-svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, SYMBOL_CELL_WIDTH, SYMBOL_CELL_HEIGHT, SCATTER_SYMBOL_SIZE_SCALE, SYMBOL_WIN_DURATION_MS, SYMBOL_EXPLOSION_DURATION_MS, SYMBOL_LAND_DURATION_MS } from '../game/constants';

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
	const isScatter = $derived(props.rawSymbol.name === 'S');

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
	const symbolSpriteSize = $derived(
		Math.min(SYMBOL_CELL_WIDTH, SYMBOL_CELL_HEIGHT) *
			0.99 *
			(isScatter ? SCATTER_SYMBOL_SIZE_SCALE : 1),
	);
	const showScatterGlow = $derived(isScatter && props.state !== 'explosion');

	let scatterPulse = $state(0);

	$effect(() => {
		if (!showScatterGlow) {
			scatterPulse = 0;
			return;
		}
		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			scatterPulse = (Math.sin(((t - start) / 650) * Math.PI * 2) + 1) / 2;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

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
	{#if showScatterGlow}
		<Graphics
			draw={(g) => {
				g.clear();
				const r = symbolSpriteSize * 0.56;
				const pulse = scatterPulse;

				g.circle(0, 0, r * 1.42 + pulse * r * 0.1);
				g.fill({ color: 0xff8c00, alpha: 0.14 + pulse * 0.14 });

				g.circle(0, 0, r * 1.12 + pulse * r * 0.06);
				g.fill({ color: 0xffc933, alpha: 0.24 + pulse * 0.2 });

				g.circle(0, 0, r * 0.88);
				g.fill({ color: 0xffe566, alpha: 0.1 + pulse * 0.12 });

				g.circle(0, 0, r * 0.84);
				g.stroke({ color: 0xffe989, width: 3 + pulse * 2, alpha: 0.65 + pulse * 0.3 });

				g.circle(0, 0, r * 0.72);
				g.stroke({ color: 0xfff8c8, width: 1.5, alpha: 0.5 + pulse * 0.35 });
			}}
		/>
	{/if}
	<Sprite
		key={spriteKey}
		anchor={0.5}
		width={symbolSpriteSize}
		height={symbolSpriteSize}
		roundPixels
		tint={tint}
	/>

</Container>
