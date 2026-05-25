<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();

	/**
	 * Decorative ambient lightning that flickers occasionally over the reels
	 * to keep the Norse atmosphere alive even during idle. Generates a small
	 * jagged bolt every 5–11 seconds with a soft cyan flash.
	 */
	type Bolt = {
		id: number;
		pts: { x: number; y: number }[];
		born: number;
		life: number;
	};

	let bolts = $state<Bolt[]>([]);
	let flashAlpha = $state(0);
	let nextId = 0;

	function makeBolt(): Bolt {
		const bw = BOARD_SIZES.width;
		const bh = BOARD_SIZES.height;
		const tx = (Math.random() - 0.5) * bw * 0.85;
		const ty = (Math.random() - 0.5) * bh * 0.6;
		const sx = tx + (Math.random() - 0.5) * bw * 0.3;
		const sy = -bh * 0.55;
		const steps = 6 + Math.floor(Math.random() * 4);
		const pts: { x: number; y: number }[] = [{ x: sx, y: sy }];
		for (let i = 1; i < steps; i++) {
			const t = i / steps;
			pts.push({
				x: sx + (tx - sx) * t + (Math.random() - 0.5) * 22,
				y: sy + (ty - sy) * t + (Math.random() - 0.5) * 10,
			});
		}
		pts.push({ x: tx, y: ty });
		return { id: nextId++, pts, born: performance.now(), life: 240 + Math.random() * 200 };
	}

	$effect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const schedule = () => {
			timer = setTimeout(
				() => {
					bolts = [...bolts, makeBolt()];
					flashAlpha = 0.1 + Math.random() * 0.12;
					if (Math.random() < 0.12) {
						setTimeout(() => {
							bolts = [...bolts, makeBolt()];
							flashAlpha = 0.14;
						}, 150);
					}
					schedule();
				},
				12000 + Math.random() * 12000,
			);
		};
		schedule();
		return () => clearTimeout(timer);
	});

	$effect(() => {
		let raf = 0;
		const tick = () => {
			const now = performance.now();
			if (bolts.length) bolts = bolts.filter((b) => now - b.born < b.life);
			if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.025);
			if (bolts.length) bolts = bolts;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const W = BOARD_SIZES.width;
	const H = BOARD_SIZES.height;
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		scale={context.stateGameDerived.boardLayout().scale}
		zIndex={15}
	>
		{#if flashAlpha > 0}
			<Graphics
				draw={(g) => {
					g.clear();
					g.rect(-W / 2 - 30, -H / 2 - 30, W + 60, H + 60);
					g.fill({ color: 0x7df0ff, alpha: flashAlpha });
				}}
			/>
		{/if}

		{#each bolts as b (b.id)}
			<Graphics
				draw={(g) => {
					g.clear();
					const age = (performance.now() - b.born) / b.life;
					const a = Math.max(0, 1 - age);
					g.moveTo(b.pts[0].x, b.pts[0].y);
					for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i].x, b.pts[i].y);
					g.stroke({ color: 0x7df0ff, width: 8, alpha: a * 0.28, cap: 'round', join: 'round' });
					g.moveTo(b.pts[0].x, b.pts[0].y);
					for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i].x, b.pts[i].y);
					g.stroke({ color: 0xaaeeff, width: 3.5, alpha: a * 0.75, cap: 'round', join: 'round' });
					g.moveTo(b.pts[0].x, b.pts[0].y);
					for (let i = 1; i < b.pts.length; i++) g.lineTo(b.pts[i].x, b.pts[i].y);
					g.stroke({ color: 0xffffff, width: 1, alpha: a * 0.95, cap: 'round', join: 'round' });
				}}
			/>
		{/each}
	</Container>
</MainContainer>
