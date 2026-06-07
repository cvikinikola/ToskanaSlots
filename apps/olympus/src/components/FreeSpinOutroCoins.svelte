<script lang="ts">
	import { Container, Sprite } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const COIN_KEYS = [
		'coin_00',
		'coin_01',
		'coin_02',
		'coin_03',
		'coin_04',
		'coin_05',
		'coin_06',
		'coin_07',
		'coin_08',
	] as const;

	const INITIAL_BURST = 110;
	const SPAWN_BURST = 14;
	const SPAWN_INTERVAL_MS = 90;
	const MAX_COINS = 240;
	const COIN_BASE = SYMBOL_SIZE * 0.42;
	const GRAVITY = 520;
	const TWO_PI = Math.PI * 2;

	type FlyingCoin = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		/** Spin phase — drives flip-frame selection (coin_00 … coin_08). */
		rot: number;
		rotSpeed: number;
		/** Extra 2D tumble on top of the flip frames. */
		tumble: number;
		tumbleSpeed: number;
		scale: number;
		alpha: number;
		key: (typeof COIN_KEYS)[number];
	};

	let active = $state(false);
	let coins = $state<FlyingCoin[]>([]);
	let nextId = 0;
	let spawnTimer: ReturnType<typeof setInterval> | undefined;

	const layout = $derived(context.stateLayoutDerived.mainLayout());

	const rotToKey = (rot: number): (typeof COIN_KEYS)[number] => {
		const t = ((rot % TWO_PI) + TWO_PI) % TWO_PI;
		const idx = Math.min(
			COIN_KEYS.length - 1,
			Math.floor((t / TWO_PI) * COIN_KEYS.length),
		);
		return COIN_KEYS[idx];
	};

	const spawnCoin = (w: number, h: number, spreadY = false): FlyingCoin => {
		const rot = Math.random() * TWO_PI;
		return {
			id: nextId++,
			x: Math.random() * w,
			y: spreadY ? Math.random() * h : -COIN_BASE - Math.random() * h * 0.25,
			vx: (Math.random() - 0.5) * 140,
			vy: 60 + Math.random() * 280,
			rot,
			rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 16),
			tumble: Math.random() * TWO_PI,
			tumbleSpeed: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 8),
			scale: 0.55 + Math.random() * 0.75,
			alpha: 0.82 + Math.random() * 0.18,
			key: rotToKey(rot),
		};
	};

	const respawnCoin = (c: FlyingCoin, w: number, h: number): FlyingCoin => {
		const rot = Math.random() * TWO_PI;
		return {
			...c,
			x: Math.random() * w,
			y: -COIN_BASE - Math.random() * h * 0.15,
			vx: (Math.random() - 0.5) * 140,
			vy: 60 + Math.random() * 260,
			rot,
			rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (12 + Math.random() * 16),
			tumble: Math.random() * TWO_PI,
			key: rotToKey(rot),
		};
	};

	const spawnMany = (count: number, spreadY = false) => {
		const w = layout.width;
		const h = layout.height;
		const room = MAX_COINS - coins.length;
		if (room <= 0) return;
		const n = Math.min(count, room);
		const fresh: FlyingCoin[] = [];
		for (let i = 0; i < n; i++) fresh.push(spawnCoin(w, h, spreadY));
		coins = [...coins, ...fresh];
	};

	const startRain = () => {
		active = true;
		coins = [];
		nextId = 0;
		spawnMany(INITIAL_BURST, true);
		spawnTimer = setInterval(() => {
			if (!active) return;
			spawnMany(SPAWN_BURST, false);
		}, SPAWN_INTERVAL_MS);
	};

	const stopRain = () => {
		active = false;
		if (spawnTimer) clearInterval(spawnTimer);
		spawnTimer = undefined;
		coins = [];
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => startRain(),
		freeSpinOutroHide: () => stopRain(),
	});

	$effect(() => {
		if (!active) return;
		let raf = 0;
		let last = performance.now();
		const pad = COIN_BASE * 1.5;

		const tick = (t: number) => {
			const dt = Math.min(0.05, (t - last) / 1000);
			last = t;
			const w = layout.width;
			const h = layout.height;

			if (coins.length) {
				coins = coins.map((c) => {
					let { x, y, vx, vy, rot, rotSpeed, tumble, tumbleSpeed } = c;

					x += vx * dt;
					y += vy * dt;
					vy += GRAVITY * dt;
					vx *= 0.998;
					rot += rotSpeed * dt;
					tumble += tumbleSpeed * dt;

					if (x < -pad) x = w + pad * 0.4;
					if (x > w + pad) x = -pad * 0.4;

					if (y > h + pad) {
						return respawnCoin(
							{ ...c, rot, tumble, key: rotToKey(rot) },
							w,
							h,
						);
					}

					return {
						...c,
						x,
						y,
						vx,
						vy,
						rot,
						tumble,
						key: rotToKey(rot),
					};
				});
			}
			raf = requestAnimationFrame(tick);
		};

		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if active}
	<MainContainer>
		<Container zIndex={2}>
			{#each coins as coin (coin.id)}
				<Sprite
					key={coin.key}
					anchor={0.5}
					x={coin.x}
					y={coin.y}
					rotation={coin.tumble}
					width={COIN_BASE * coin.scale}
					height={COIN_BASE * coin.scale}
					alpha={coin.alpha}
				/>
			{/each}
		</Container>
	</MainContainer>
{/if}
