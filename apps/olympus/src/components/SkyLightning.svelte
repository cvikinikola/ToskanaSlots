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

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	function jagged(
		ax: number,
		ay: number,
		bx: number,
		by: number,
		jitter: number,
		segs: number,
	) {
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
		const main = jagged(sx, sy, tx, ty, 26, 14);
		const branches: Branch[] = [{ pts: main, width: 5, alpha: 1 }];

		// 1-3 forks splitting off the main bolt
		const forkCount = 1 + Math.floor(Math.random() * 3);
		for (let f = 0; f < forkCount; f++) {
			const fi = 3 + Math.floor(Math.random() * (main.length - 5));
			if (fi >= main.length) continue;
			const start = main[fi];
			const fx = start.x + (Math.random() - 0.5) * w * 0.25;
			const fy = start.y + h * (0.05 + Math.random() * 0.18);
			branches.push({
				pts: jagged(start.x, start.y, fx, fy, 18, 6 + Math.floor(Math.random() * 4)),
				width: 3,
				alpha: 0.85,
			});
		}

		return {
			id: nextId++,
			branches,
			born: performance.now(),
			life: 520 + Math.random() * 260,
			flashPeak: 0.55 + Math.random() * 0.3,
		};
	}

	$effect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const schedule = () => {
			// Storm cadence: 3.5–9s between primary strikes
			timer = setTimeout(
				() => {
					const s = makeStrike();
					strikes = [...strikes, s];
					flashColor = Math.random() < 0.7 ? 0xffffff : 0xc8e8ff;
					flashAlpha = s.flashPeak;
					// Possible double-strike thunderclap
					if (Math.random() < 0.45) {
						setTimeout(
							() => {
								const s2 = makeStrike();
								strikes = [...strikes, s2];
								flashAlpha = Math.max(flashAlpha, s2.flashPeak * 0.85);
							},
							140 + Math.random() * 220,
						);
					}
					schedule();
				},
				3500 + Math.random() * 5500,
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
			if (flashAlpha > 0) flashAlpha = Math.max(0, flashAlpha - 0.045);
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
					// Outer glow
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0x7df0ff,
						width: br.width * 4,
						alpha: a * br.alpha * 0.22,
						cap: 'round',
						join: 'round',
					});
					// Mid glow
					g.moveTo(br.pts[0].x, br.pts[0].y);
					for (let i = 1; i < br.pts.length; i++) g.lineTo(br.pts[i].x, br.pts[i].y);
					g.stroke({
						color: 0xaaeeff,
						width: br.width * 2,
						alpha: a * br.alpha * 0.7,
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
