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

	let birds: Bird[] = [];
	let nextBirdId = 0;
	let frame = $state(0);

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	const layoutScale = () => Math.max(0.9, Math.min(1.5, canvas.width / 1200));

	const bump = () => {
		frame++;
	};

	const pickBird = (): BirdKey => BIRD_KEYS[Math.floor(Math.random() * BIRD_KEYS.length)]!;

	/** yNorm 0 = top of canvas, 1 = bottom — keep birds in the sky band */
	function addBird(fromLeft: boolean, yNorm: number, sizeMul = 1, speedMul = 1) {
		const w = canvas.width;
		const sc = layoutScale();
		const y = canvas.height * yNorm;
		const speed = (2.5 + Math.random() * 2) * sc * speedMul;
		birds.push({
			id: nextBirdId++,
			variant: pickBird(),
			x: fromLeft ? -70 - Math.random() * 60 : w + 70 + Math.random() * 60,
			y,
			baseY: y,
			vx: fromLeft ? speed : -speed,
			displayW: (44 + Math.random() * 32) * sc * sizeMul,
			alpha: 0.58 + Math.random() * 0.22,
			phase: Math.random() * Math.PI * 2,
			glideAmp: (10 + Math.random() * 18) * sc,
			born: performance.now(),
			life: 15000 + Math.random() * 12000,
		});
	}

	function randomSkyY() {
		return 0.04 + Math.random() * 0.38;
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
			addBird(fromLeft, baseY + (i - count / 2) * 0.018, 0.75 + Math.random() * 0.25, 0.88 + i * 0.04);
		}
		bump();
	}

	context.eventEmitter.subscribeOnMount({
		natureBurst: () => spawnFlock(),
	});

	onMount(() => {
		spawnBird();
		setTimeout(spawnBird, 500);
		setTimeout(spawnFlock, 1400);

		let birdTimer: ReturnType<typeof setTimeout>;
		const scheduleBirds = () => {
			if (Math.random() < 0.42) spawnFlock();
			else spawnBird();
			birdTimer = setTimeout(scheduleBirds, 2800 + Math.random() * 3200);
		};
		scheduleBirds();

		let raf = 0;
		const tick = () => {
			const now = performance.now();
			const w = canvas.width;
			let moved = false;

			for (let i = birds.length - 1; i >= 0; i--) {
				const b = birds[i];
				if (now - b.born >= b.life || b.x < -140 || b.x > w + 140) {
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

			if (moved) bump();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);

		return () => {
			clearTimeout(birdTimer);
			cancelAnimationFrame(raf);
		};
	});
</script>

<!-- Sky layer: above bg (-10), below reels -->
{#if context.stateGame.gameType !== 'freeSpins' && !context.stateGame.freeSpinIntroActive}
<Container zIndex={-4}>
	{#each birds as b (b.id)}
		{@const dir = b.vx >= 0 ? 1 : -1}
		{@const flap = 0.95 + Math.sin(frame * 0.15 + b.phase) * 0.06}
		{@const tilt = Math.sin(frame * 0.1 + b.phase) * 0.05}
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
</Container>
{/if}
