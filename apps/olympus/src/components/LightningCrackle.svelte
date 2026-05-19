<script lang="ts" module>
	export type EmitterEventLightningCrackle =
		| { type: 'lightningStrike'; durationMs?: number };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();

	type Bolt = { id: number; x1: number; y1: number; x2: number; y2: number; born: number; life: number; jagged: { x: number; y: number }[] };
	let bolts = $state<Bolt[]>([]);
	let flashAlpha = $state(0);
	let nextId = 0;

	function makeBolt(): Bolt {
		const bw = BOARD_SIZES.width;
		const bh = BOARD_SIZES.height;
		// Strike from above the frame to a random point inside the board
		const tx = (Math.random() - 0.5) * bw * 0.7;
		const ty = bh / 2 - bw * 0.1;
		const sx = tx + (Math.random() - 0.5) * bw * 0.5;
		const sy = -bh * 0.6;
		// Build jagged segments
		const steps = 8 + Math.floor(Math.random() * 4);
		const jagged: { x: number; y: number }[] = [];
		for (let i = 1; i < steps; i++) {
			const t = i / steps;
			const baseX = sx + (tx - sx) * t;
			const baseY = sy + (ty - sy) * t;
			jagged.push({
				x: baseX + (Math.random() - 0.5) * 30,
				y: baseY + (Math.random() - 0.5) * 12,
			});
		}
		return { id: nextId++, x1: sx, y1: sy, x2: tx, y2: ty, born: performance.now(), life: 320 + Math.random() * 220, jagged };
	}

	context.eventEmitter.subscribeOnMount({
		lightningStrike: (e) => {
			const dur = e.durationMs ?? 600;
			const fire = () => {
				bolts = [...bolts, makeBolt()];
				flashAlpha = 0.55;
			};
			fire();
			setTimeout(fire, 90);
			if (dur > 400) setTimeout(fire, 280);
		},

		/** Auto-strike on big/super/mega/epic/max wins */
		winUpdate: (e) => {
			if (e.winLevelData?.type === 'big') {
				for (let i = 0; i < 3; i++) {
					setTimeout(() => {
						bolts = [...bolts, makeBolt()];
						flashAlpha = 0.6;
					}, i * 220);
				}
			}
		},
	});

	// Animation loop — fade bolts and flash.
	$effect(() => {
		let raf = 0;
		const tick = (t: number) => {
			const now = performance.now();
			if (bolts.length) {
				bolts = bolts.filter((b) => now - b.born < b.life);
			}
			if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.04);
			// Reassign to trigger reactivity for fading bolts (alpha derived from `now - born`)
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
		zIndex={20}
	>
		{#if flashAlpha > 0}
			<Graphics
				draw={(g) => {
					g.clear();
					g.rect(-W / 2 - 40, -H / 2 - 40, W + 80, H + 80);
					g.fill({ color: 0xaaeeff, alpha: flashAlpha });
				}}
			/>
		{/if}

		{#each bolts as b (b.id)}
			<Graphics
				draw={(g) => {
					g.clear();
					const age = (performance.now() - b.born) / b.life;
					const a = Math.max(0, 1 - age);
					const pts = [{ x: b.x1, y: b.y1 }, ...b.jagged, { x: b.x2, y: b.y2 }];
					// Outer glow stroke
					g.moveTo(pts[0].x, pts[0].y);
					for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
					g.stroke({ color: 0x7df0ff, width: 14, alpha: a * 0.35, cap: 'round', join: 'round' });
					// Mid stroke
					g.moveTo(pts[0].x, pts[0].y);
					for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
					g.stroke({ color: 0xaaeeff, width: 6, alpha: a * 0.85, cap: 'round', join: 'round' });
					// White-hot core
					g.moveTo(pts[0].x, pts[0].y);
					for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
					g.stroke({ color: 0xffffff, width: 2, alpha: a, cap: 'round', join: 'round' });
				}}
			/>
		{/each}
	</Container>
</MainContainer>
