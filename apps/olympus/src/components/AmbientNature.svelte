<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';

	const context = getContext();

	const BIRD_KEYS = ['bird_glide_a', 'bird_glide_b', 'bird_glide_c'] as const;
	type BirdKey = (typeof BIRD_KEYS)[number];

	type Bird = {
		id: number;
		variant: BirdKey;
		x: number;
		y: number;
		vx: number;
		baseY: number;
		displayW: number;
		alpha: number;
		phase: number;
		glideAmp: number;
		born: number;
		life: number;
	};

	type Butterfly = {
		id: number;
		x: number;
		y: number;
		vx: number;
		baseY: number;
		driftY: number;
		displayW: number;
		alpha: number;
		phase: number;
		pathAmp: number;
		wing: number;
		born: number;
		life: number;
	};

	let birds: Bird[] = [];
	let butterflies: Butterfly[] = [];
	let nextBirdId = 0;
	let nextButterflyId = 0;
	let frame = $state(0);

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	const layoutScale = () => Math.max(0.85, Math.min(1.6, canvas.width / 1100));

	const bump = () => {
		frame++;
	};

	const pickBird = (): BirdKey => BIRD_KEYS[Math.floor(Math.random() * BIRD_KEYS.length)]!;

	/** yNorm 0 = top of canvas, 1 = bottom */
	function randomSkyY() {
		return 0.03 + Math.random() * 0.48;
	}

	function randomButterflyY() {
		return 0.12 + Math.random() * 0.62;
	}

	function addBird(fromLeft: boolean, yNorm: number, sizeMul = 1, speedMul = 1) {
		const w = canvas.width;
		const sc = layoutScale();
		const y = canvas.height * yNorm;
		const speed = (3.2 + Math.random() * 2.8) * sc * speedMul;
		birds.push({
			id: nextBirdId++,
			variant: pickBird(),
			x: fromLeft ? -90 - Math.random() * 80 : w + 90 + Math.random() * 80,
			y,
			baseY: y,
			vx: fromLeft ? speed : -speed,
			displayW: (58 + Math.random() * 42) * sc * sizeMul,
			alpha: 0.72 + Math.random() * 0.22,
			phase: Math.random() * Math.PI * 2,
			glideAmp: (14 + Math.random() * 22) * sc,
			born: performance.now(),
			life: 16000 + Math.random() * 14000,
		});
	}

	function addButterfly(fromLeft?: boolean, yNorm?: number) {
		const w = canvas.width;
		const sc = layoutScale();
		const enterLeft = fromLeft ?? Math.random() < 0.5;
		const y = canvas.height * (yNorm ?? randomButterflyY());
		const speed = (1.4 + Math.random() * 1.8) * sc;
		butterflies.push({
			id: nextButterflyId++,
			x: enterLeft ? -50 - Math.random() * 40 : w + 50 + Math.random() * 40,
			y,
			baseY: y,
			vx: enterLeft ? speed : -speed,
			driftY: (Math.random() - 0.5) * 0.35 * sc,
			displayW: (34 + Math.random() * 22) * sc,
			alpha: 0.78 + Math.random() * 0.18,
			phase: Math.random() * Math.PI * 2,
			pathAmp: (24 + Math.random() * 36) * sc,
			wing: Math.random() * Math.PI * 2,
			born: performance.now(),
			life: 14000 + Math.random() * 12000,
		});
	}

	function spawnBird() {
		addBird(Math.random() < 0.5, randomSkyY());
		bump();
	}

	function spawnFlock() {
		const fromLeft = Math.random() < 0.5;
		const count = 2 + Math.floor(Math.random() * 4);
		const baseY = randomSkyY();
		for (let i = 0; i < count; i++) {
			addBird(fromLeft, baseY + (i - count / 2) * 0.016, 0.78 + Math.random() * 0.28, 0.9 + i * 0.05);
		}
		bump();
	}

	function spawnButterfly() {
		addButterfly();
		bump();
	}

	function spawnButterflyPair() {
		const fromLeft = Math.random() < 0.5;
		const baseY = randomButterflyY();
		addButterfly(fromLeft, baseY);
		setTimeout(() => addButterfly(fromLeft, baseY + 0.02), 120 + Math.random() * 180);
		bump();
	}

	context.eventEmitter.subscribeOnMount({
		natureBurst: () => {
			spawnFlock();
			spawnButterflyPair();
		},
	});

	onMount(() => {
		spawnBird();
		spawnButterfly();
		setTimeout(spawnBird, 400);
		setTimeout(spawnButterfly, 700);
		setTimeout(spawnFlock, 1200);
		setTimeout(spawnButterflyPair, 1800);

		let birdTimer: ReturnType<typeof setTimeout>;
		const scheduleBirds = () => {
			if (Math.random() < 0.45) spawnFlock();
			else spawnBird();
			birdTimer = setTimeout(scheduleBirds, 2200 + Math.random() * 2800);
		};
		scheduleBirds();

		let butterflyTimer: ReturnType<typeof setTimeout>;
		const scheduleButterflies = () => {
			if (Math.random() < 0.35) spawnButterflyPair();
			else spawnButterfly();
			butterflyTimer = setTimeout(scheduleButterflies, 3200 + Math.random() * 3600);
		};
		scheduleButterflies();

		let raf = 0;
		const tick = () => {
			const now = performance.now();
			const w = canvas.width;
			let moved = false;

			for (let i = birds.length - 1; i >= 0; i--) {
				const b = birds[i];
				if (now - b.born >= b.life || b.x < -160 || b.x > w + 160) {
					birds.splice(i, 1);
					moved = true;
					continue;
				}
				b.x += b.vx;
				b.y =
					b.baseY +
					Math.sin(now * 0.0026 + b.phase) * b.glideAmp +
					Math.sin(now * 0.01 + b.phase * 2) * (b.glideAmp * 0.22);
				moved = true;
			}

			for (let i = butterflies.length - 1; i >= 0; i--) {
				const bf = butterflies[i];
				if (now - bf.born >= bf.life || bf.x < -120 || bf.x > w + 120) {
					butterflies.splice(i, 1);
					moved = true;
					continue;
				}
				bf.x += bf.vx;
				bf.baseY += bf.driftY * 0.015;
				bf.y =
					bf.baseY +
					Math.sin(now * 0.0034 + bf.phase) * bf.pathAmp +
					Math.sin(now * 0.011 + bf.phase * 1.7) * (bf.pathAmp * 0.35);
				bf.wing += 0.2;
				moved = true;
			}

			if (moved) bump();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			clearTimeout(birdTimer);
			clearTimeout(butterflyTimer);
			cancelAnimationFrame(raf);
		};
	});
</script>

<!-- Above board, below UI — birds & butterflies cross the full viewport. -->
<Container zIndex={6}>
	{#each birds as b (b.id)}
		{@const dir = b.vx >= 0 ? 1 : -1}
		{@const flap = 0.94 + Math.sin(frame * 0.15 + b.phase) * 0.07}
		{@const tilt = Math.sin(frame * 0.1 + b.phase) * 0.06}
		<Sprite
			key={b.variant}
			anchor={0.5}
			x={b.x}
			y={b.y}
			width={b.displayW}
			height={b.displayW * 0.37 * flap}
			rotation={tilt * dir}
			scale={{ x: dir, y: 1 }}
			alpha={b.alpha}
		/>
	{/each}

	{#each butterflies as bf (bf.id)}
		{@const wing = 0.76 + Math.abs(Math.sin(bf.wing)) * 0.3}
		{@const bob = Math.sin(frame * 0.08 + bf.phase) * 0.04}
		{@const dir = bf.vx >= 0 ? 1 : -1}
		<Sprite
			key="butterfly"
			anchor={0.5}
			x={bf.x}
			y={bf.y}
			width={bf.displayW * wing}
			height={bf.displayW * 0.85 * wing}
			rotation={bob * dir}
			scale={{ x: dir, y: 1 }}
			alpha={bf.alpha}
		/>
	{/each}
</Container>
