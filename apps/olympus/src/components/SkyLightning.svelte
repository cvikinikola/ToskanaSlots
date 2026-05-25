<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	/**
	 * Cinematic full-canvas lightning storm. Bolts strike from above the
	 * canvas down to a random target near castle/horizon, with branching
	 * forks. Each strike fires a quick bright white flash + lingering
	 * cyan after-glow that fades over ~600ms — selling the impression of
	 * real thunderclouds rolling over Asgard.
	 */

	type Branch = { pts: { x: number; y: number }[]; width: number; alpha: number };
	type Strike = {
		id: number;
		branches: Branch[];
		born: number;
		life: number;
		flashPeak: number;
	};

	let strikes = $state<Strike[]>([]);
	let flashAlpha = $state(0);
	let flashColor = $state(0xffffff);
	let nextId = 0;
	let lastThunderClapAt = 0;

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	function playThunderClap() {
		const now = performance.now();
		if (now - lastThunderClapAt < 4500) return;
		lastThunderClapAt = now;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_thunder_clap' });
	}

	/** Scatter trigger — rapid cluster of full-canvas strikes over ~1.8 s */
	context.eventEmitter.subscribeOnMount({
		scatterStorm: () => {
			const schedule = [0, 420, 960];
			for (const ms of schedule) {
				setTimeout(() => {
					const s = makeStrike();
					strikes = [...strikes, s];
					flashColor = 0xaaddff;
					flashAlpha = Math.min(0.72, (flashAlpha || 0) + s.flashPeak * 0.42);
					playThunderClap();
					if (Math.random() < 0.16) {
						setTimeout(
							() => {
								strikes = [...strikes, makeStrike()];
								flashAlpha = Math.min(0.72, flashAlpha + 0.12);
							},
							120 + Math.random() * 160,
						);
					}
				}, ms);
			}
		},
	});

	function jagged(ax: number, ay: number, bx: number, by: number, jitter: number, segs: number) {
		const pts = [{ x: ax, y: ay }];
		for (let i = 1; i < segs; i++) {
			const t = i / segs;
			pts.push({
				x: ax + (bx - ax) * t + (Math.random() - 0.5) * jitter,
				y: ay + (by - ay) * t + (Math.random() - 0.5) * jitter * 0.5,
			});
		}
		pts.push({ x: bx, y: by });
		return pts;
	}

	function makeStrike(): Strike {
		const w = canvas.width;
		const h = canvas.height;

		// Main bolt: top of canvas to ~40-65% Y at random x
		const sx = Math.random() * w;
		const sy = -40;
		const tx = sx + (Math.random() - 0.5) * w * 0.25;
		const ty = h * (0.35 + Math.random() * 0.3);
		const main = jagged(sx, sy, tx, ty, 36, 18 + Math.floor(Math.random() * 4));
		const branches: Branch[] = [{ pts: main, width: 5, alpha: 1 }];

		// 1-3 forks splitting off the main bolt
		const forkCount = 1 + Math.floor(Math.random() * 3);
		for (let f = 0; f < forkCount; f++) {
			const fi = 3 + Math.floor(Math.random() * (main.length - 5));
			if (fi >= main.length) continue;
			const start = main[fi];
			const fx = start.x + (Math.random() - 0.5) * w * 0.28;
			const fy = start.y + h * (0.05 + Math.random() * 0.18);
			branches.push({
				pts: jagged(start.x, start.y, fx, fy, 24, 7 + Math.floor(Math.random() * 4)),
				width: 3.5,
				alpha: 0.9,
			});
		}

		return {
			id: nextId++,
			branches,
			born: performance.now(),
			life: 580 + Math.random() * 300,
			flashPeak: 0.65 + Math.random() * 0.25,
		};
	}

	$effect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const schedule = () => {
			// Keep idle lightning atmospheric instead of constant.
			timer = setTimeout(
				() => {
					const s = makeStrike();
					strikes = [...strikes, s];
					flashColor = Math.random() < 0.7 ? 0xffffff : 0xc8e8ff;
					flashAlpha = s.flashPeak * 0.72;
					if (Math.random() < 0.55) playThunderClap();
					if (Math.random() < 0.12) {
						setTimeout(
							() => {
								const s2 = makeStrike();
								strikes = [...strikes, s2];
								flashAlpha = Math.max(flashAlpha, s2.flashPeak * 0.55);
							},
							180 + Math.random() * 260,
						);
					}
					schedule();
				},
				14000 + Math.random() * 14000,
			);
		};
		schedule();
		return () => clearTimeout(timer);
	});

	$effect(() => {
		let raf = 0;
		const tick = () => {
			const now = performance.now();
			if (strikes.length) strikes = strikes.filter((s) => now - s.born < s.life);
			if (flashAlpha > 0) {
				const decay = flashAlpha > 0.5 ? 0.09 : 0.022;
				flashAlpha = Math.max(0, flashAlpha - decay);
			}
			if (strikes.length) strikes = strikes;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<Container zIndex={-3}>
	{#if flashAlpha > 0}
		<Graphics
			draw={(g) => {
				g.clear();
				g.rect(0, 0, canvas.width, canvas.height);
				g.fill({ color: flashColor, alpha: flashAlpha * 0.55 });
			}}
		/>
	{/if}

	{#each strikes as s (s.id)}
		<Graphics
			draw={(g) => {
				g.clear();
				const age = (performance.now() - s.born) / s.life;
				// Bright in first 30% of life, then quick fade
				const a = age < 0.3 ? 1 : Math.max(0, 1 - (age - 0.3) / 0.7);
				for (const br of s.branches) {
					// Corona
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0x44aaff,
						width: br.width * 8,
						alpha: a * br.alpha * 0.09,
						cap: 'round',
						join: 'round',
					});
					// Outer glow
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0x7df0ff,
						width: br.width * 4,
						alpha: a * br.alpha * 0.28,
						cap: 'round',
						join: 'round',
					});
					// Mid glow
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0xaaeeff,
						width: br.width * 2,
						alpha: a * br.alpha * 0.8,
						cap: 'round',
						join: 'round',
					});
					// White-hot core
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0xffffff,
						width: br.width * 0.75,
						alpha: a * br.alpha,
						cap: 'round',
						join: 'round',
					});
				}
			}}
		/>
	{/each}
</Container>
