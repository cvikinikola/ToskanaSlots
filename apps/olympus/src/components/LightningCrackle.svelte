<script lang="ts" module>
	export type EmitterEventLightningCrackle =
		| { type: 'lightningStrike'; durationMs?: number }
		| { type: 'scatterStorm' };
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();

	type Pt = { x: number; y: number };
	type Bolt = {
		id: number;
		pts: Pt[];
		branches: { pts: Pt[]; alpha: number }[];
		born: number;
		life: number;
		flashPeak: number;
	};
	let bolts = $state<Bolt[]>([]);
	let flashAlpha = $state(0);
	let nextId = 0;
	let lastThunderClapAt = 0;

	function playThunderClap() {
		const now = performance.now();
		if (now - lastThunderClapAt < 3500) return;
		lastThunderClapAt = now;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder_clap' });
	}

	function boltPath(
		ax: number,
		ay: number,
		bx: number,
		by: number,
		jx: number,
		jy: number,
		steps: number,
	): Pt[] {
		const pts: Pt[] = [{ x: ax, y: ay }];
		for (let i = 1; i < steps; i++) {
			const t = i / steps;
			pts.push({
				x: ax + (bx - ax) * t + (Math.random() - 0.5) * jx,
				y: ay + (by - ay) * t + (Math.random() - 0.5) * jy,
			});
		}
		pts.push({ x: bx, y: by });
		return pts;
	}

	function makeBolt(): Bolt {
		const bw = BOARD_SIZES.width;
		const bh = BOARD_SIZES.height;
		const tx = (Math.random() - 0.5) * bw * 0.7;
		const ty = bh * 0.5 - bw * 0.1;
		const sx = tx + (Math.random() - 0.5) * bw * 0.6;
		const sy = -bh * 0.65;
		const steps = 14 + Math.floor(Math.random() * 6);
		const pts = boltPath(sx, sy, tx, ty, 48, 20, steps);

		// 1–2 sub-branches for realism
		const branches: { pts: Pt[]; alpha: number }[] = [];
		const nBranches = 1 + Math.floor(Math.random() * 2);
		for (let i = 0; i < nBranches; i++) {
			const fi = 4 + Math.floor(Math.random() * (pts.length - 6));
			if (fi >= pts.length) continue;
			const sp = pts[fi];
			const bex = sp.x + (Math.random() - 0.5) * bw * 0.42;
			const bey = sp.y + bh * (0.05 + Math.random() * 0.18);
			branches.push({
				pts: boltPath(sp.x, sp.y, bex, bey, 28, 12, 5 + Math.floor(Math.random() * 4)),
				alpha: 0.55 + Math.random() * 0.35,
			});
		}

		return {
			id: nextId++,
			pts,
			branches,
			born: performance.now(),
			life: 380 + Math.random() * 260,
			flashPeak: 0.7 + Math.random() * 0.25,
		};
	}

	context.eventEmitter.subscribeOnMount({
		lightningStrike: (e) => {
			const dur = e.durationMs ?? 600;
			const fire = (forceThunder = false) => {
				const b = makeBolt();
				bolts = [...bolts, b];
				flashAlpha = Math.min(0.92, (flashAlpha || 0) + b.flashPeak * 0.85);
				if (forceThunder || b.flashPeak > 0.82) playThunderClap();
			};
			fire(true);
			if (dur > 400) setTimeout(fire, 180);
		},

		/** Auto-strike on big/super/mega/epic/max wins */
		winUpdate: (e) => {
			if (e.winLevelData?.type === 'big') {
				for (let i = 0; i < 2; i++) {
					setTimeout(() => {
						const b = makeBolt();
						bolts = [...bolts, b];
						flashAlpha = Math.min(0.88, (flashAlpha || 0) + b.flashPeak * 0.7);
						if (b.flashPeak > 0.82) playThunderClap();
					}, i * 220);
				}
			}
		},

		/** Scatter trigger — escalating barrage of board bolts over ~1.8 s */
		scatterStorm: () => {
			const schedule = [0, 360, 760, 1160];
			for (const ms of schedule) {
				setTimeout(() => {
					const b1 = makeBolt();
					bolts = [...bolts, b1];
					if (Math.random() < 0.18) bolts = [...bolts, makeBolt()];
					flashAlpha = Math.min(0.72, flashAlpha + b1.flashPeak * 0.32);
				}, ms);
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
			if (flashAlpha > 0) {
				const decay = flashAlpha > 0.45 ? 0.09 : 0.022;
				flashAlpha = Math.max(0, flashAlpha - decay);
			}
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
					// Instant peak, then slow decay
					const a = age < 0.15 ? 1 : Math.max(0, 1 - (age - 0.15) / 0.85);

					const drawPath = (pts: { x: number; y: number }[], wMul: number, aMul: number) => {
						// Wide corona
						g.moveTo(pts[0].x, pts[0].y);
						for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
						g.stroke({
							color: 0x44aaff,
							width: 32 * wMul,
							alpha: a * aMul * 0.1,
							cap: 'round',
							join: 'round',
						});
						// Outer glow
						g.moveTo(pts[0].x, pts[0].y);
						for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
						g.stroke({
							color: 0x7df0ff,
							width: 14 * wMul,
							alpha: a * aMul * 0.38,
							cap: 'round',
							join: 'round',
						});
						// Mid glow
						g.moveTo(pts[0].x, pts[0].y);
						for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
						g.stroke({
							color: 0xaaeeff,
							width: 6 * wMul,
							alpha: a * aMul * 0.88,
							cap: 'round',
							join: 'round',
						});
						// White-hot core
						g.moveTo(pts[0].x, pts[0].y);
						for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
						g.stroke({
							color: 0xffffff,
							width: 2 * wMul,
							alpha: a * aMul,
							cap: 'round',
							join: 'round',
						});
					};

					drawPath(b.pts, 1, 1);
					for (const br of b.branches) drawPath(br.pts, 0.6, br.alpha);
				}}
			/>
		{/each}
	</Container>
</MainContainer>
