<script lang="ts" module>
	import type { Position } from '../game/types';
	export type EmitterEventWinGlow =
		| { type: 'winGlowShow'; positions: Position[] }
		| { type: 'winGlowHide' };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import type { Position } from '../game/types';
	import { SYMBOL_SIZE } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	let positions = $state<Position[]>([]);
	let pulse = $state(0);

	const dedupePositions = (input: Position[]): Position[] => {
		const seen = new Set<string>();
		const out: Position[] = [];
		for (const p of input) {
			const k = `${p.reel}-${p.row}`;
			if (seen.has(k)) continue;
			seen.add(k);
			out.push(p);
		}
		return out;
	};

	context.eventEmitter.subscribeOnMount({
		winGlowShow: (e) => (positions = dedupePositions(e.positions)),
		winGlowHide: () => (positions = []),
		boardWithAnimateSymbols: ({ symbolPositions }) => {
			positions = dedupePositions(symbolPositions);
			setTimeout(() => (positions = []), 1400);
		},
	});

	$effect(() => {
		if (positions.length === 0) {
			pulse = 0;
			return;
		}
		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			pulse = (Math.sin(((t - start) / 600) * Math.PI * 2) + 1) / 2; // 0..1
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	function symCenter(reel: number, row: number) {
		return {
			x: getSymbolX(reel),
			y: getSymbolY(row),
		};
	}
</script>

<BoardContainer>
	<Container zIndex={12}>
		{#each positions as p (`${p.reel}-${p.row}`)}
			{@const c = symCenter(p.reel, p.row)}
			<Graphics
				draw={(g) => {
					g.clear();
					const r = SYMBOL_SIZE * (0.55 + pulse * 0.08);
					// Outer soft halo
					g.circle(c.x, c.y, r * 1.25);
					g.fill({ color: 0xffd147, alpha: 0.1 + pulse * 0.1 });
					// Mid halo
					g.circle(c.x, c.y, r);
					g.fill({ color: 0xffd147, alpha: 0.18 + pulse * 0.18 });
					// Inner ring
					g.circle(c.x, c.y, r * 0.78);
					g.stroke({ color: 0xffe989, width: 3, alpha: 0.55 + pulse * 0.35 });
				}}
			/>
		{/each}
	</Container>
</BoardContainer>
