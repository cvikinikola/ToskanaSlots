<script lang="ts" module>
	export type EmitterEventNatureBurst =
		| { type: 'natureFlutter'; durationMs?: number }
		| { type: 'natureBurst' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();

	type Butterfly = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		displayW: number;
		alpha: number;
		wing: number;
		born: number;
		life: number;
	};

	let butterflies: Butterfly[] = [];
	let nextId = 0;
	let frame = $state(0);
	let lastChirpAt = 0;

	const W = BOARD_SIZES.width;
	const H = BOARD_SIZES.height;

	const bump = () => {
		frame++;
	};

	function playChirp() {
		const now = performance.now();
		if (now - lastChirpAt < 1200) return;
		lastChirpAt = now;
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_bird_chirp' });
	}

	function spawnButterfly(x: number, y: number) {
		butterflies.push({
			id: nextId++,
			x,
			y,
			vx: (Math.random() - 0.5) * 2.2,
			vy: -1.2 - Math.random() * 1.5,
			displayW: 12 + Math.random() * 10,
			alpha: 0.75 + Math.random() * 0.2,
			wing: Math.random() * Math.PI * 2,
			born: performance.now(),
			life: 900 + Math.random() * 700,
		});
		bump();
	}

	function flutterBurst(count = 4) {
		for (let i = 0; i < count; i++) {
			spawnButterfly(
				(Math.random() - 0.5) * W * 0.65,
				(Math.random() - 0.5) * H * 0.45,
			);
		}
		playChirp();
	}

	context.eventEmitter.subscribeOnMount({
		natureFlutter: () => {
			flutterBurst(3 + Math.floor(Math.random() * 3));
			if (Math.random() < 0.4) {
				setTimeout(() => flutterBurst(2), 160);
			}
		},

		winUpdate: (e) => {
			if (e.winLevelData?.type === 'big') {
				for (let i = 0; i < 2; i++) {
					setTimeout(() => flutterBurst(5), i * 200);
				}
				context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_nature_burst' });
			}
		},

		natureBurst: () => {
			const schedule = [0, 280, 580, 880];
			for (const ms of schedule) {
				setTimeout(() => flutterBurst(4 + Math.floor(Math.random() * 3)), ms);
			}
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_nature_burst' });
		},
	});

	onMount(() => {
		let raf = 0;
		const tick = () => {
			const now = performance.now();
			let moved = false;

			for (let i = butterflies.length - 1; i >= 0; i--) {
				const bf = butterflies[i];
				if (now - bf.born >= bf.life) {
					butterflies.splice(i, 1);
					moved = true;
					continue;
				}
				bf.x += bf.vx;
				bf.y += bf.vy;
				bf.vy += 0.02;
				bf.wing += 0.18;
				moved = true;
			}

			if (moved) bump();
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<MainContainer>
	<Container
		x={context.stateGameDerived.boardLayout().x}
		y={context.stateGameDerived.boardLayout().y}
		zIndex={20}
	>
		{#each butterflies as bf (bf.id)}
			{@const wing = 0.78 + Math.abs(Math.sin(bf.wing)) * 0.28}
			{@const age = (performance.now() - bf.born) / bf.life}
			{@const fade = age < 0.2 ? 1 : Math.max(0, 1 - (age - 0.2) / 0.8)}
			<Sprite
				key="butterfly"
				anchor={0.5}
				x={bf.x}
				y={bf.y}
				width={bf.displayW * wing}
				height={bf.displayW * 0.85 * wing}
				alpha={bf.alpha * fade}
			/>
		{/each}
	</Container>
</MainContainer>
