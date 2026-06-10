<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventBigWinCelebration =
		| { type: 'bigWinCelebrationShow'; winLevelData: WinLevelData }
		| { type: 'bigWinCelebrationHide' }
		| {
				type: 'bigWinCelebrationUpdate';
				amount: number;
				winLevelData: WinLevelData;
				duration: number;
		  };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { backOut } from 'svelte/easing';
	import { Container, Sprite, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import type { WinLevelData } from '../game/winLevelMap';
	import { winCelebrationImageKey } from '../game/winCelebration';
	import {
		GRID_WIN_COUNT_FRACTION,
		getGridWinCelebrationSoundName,
		preloadGridWinCelebrationDurations,
	} from '../game/winCelebrationAudio';
	import { waitForSkipOrTimeout } from '../game/waitForSkipOrTimeout';

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

	const WIN_BADGE_SCALE = 1.2;
	const BADGE_W = SYMBOL_SIZE * 3.1 * WIN_BADGE_SCALE;
	const BADGE_H = BADGE_W * 0.42;
	const CONGRAT_ASPECT = 1000 / 250;
	const CONGRAT_GAP = SYMBOL_SIZE * 0.12;
	const SUNBURST_SIZE = SYMBOL_SIZE * 5.2;
	const SUN_SIZE = SYMBOL_SIZE * 1.5;
	const COIN_BASE = SYMBOL_SIZE * 0.3;
	const INITIAL_BURST = 36;
	const SPAWN_BURST = 8;
	const SPAWN_INTERVAL_MS = 130;
	const MAX_COINS = 90;
	const GRAVITY = 580;
	const TWO_PI = Math.PI * 2;
	const OVERLAY_ALPHA = 0.58;
	const POP_IN_MS = 420;
	const BADGE_BREATHE_MS = 1100;
	const BADGE_PUNCH_MS = 520;
	const CONGRAT_BREATHE_MS = 980;
	const SUNBURST_BREATHE_MS = 1300;
	const SUN_PUNCH_MS = 480;

	type FlyingCoin = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		rot: number;
		rotSpeed: number;
		tumble: number;
		tumbleSpeed: number;
		scale: number;
		alpha: number;
		key: (typeof COIN_KEYS)[number];
	};

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const centerX = $derived(layout.width / 2);
	const centerY = $derived(layout.height / 2);
	const CONGRAT_W = $derived(Math.min(BADGE_W * 2.15, layout.width * 0.92));
	const CONGRAT_H = $derived(CONGRAT_W / CONGRAT_ASPECT);
	const CONGRAT_Y = $derived(-(BADGE_H / 2 + CONGRAT_GAP + CONGRAT_H / 2));

	let show = $state(false);
	let winLevelData = $state<WinLevelData>();
	let badgeKey = $state<'win_big' | 'win_super' | 'win_mega'>('win_big');
	let rayAngle = $state(0);
	let badgePulseScale = $state(1);
	let congratPulseScale = $state(1);
	let sunburstPulseScale = $state(1);
	let sunPulseScale = $state(1);
	let badgeBobY = $state(0);
	let coins = $state<FlyingCoin[]>([]);
	let nextId = 0;
	let spawnTimer: ReturnType<typeof setInterval> | undefined;
	let motionRaf = 0;
	let coinRaf = 0;
	let coinLoopActive = false;

	const countUpAmount = new Tween(0);
	const celebrationPop = new Tween(0.82, { duration: 0 });

	onMount(() => {
		preloadGridWinCelebrationDurations();
	});

	const rotToKey = (rot: number): (typeof COIN_KEYS)[number] => {
		const t = ((rot % TWO_PI) + TWO_PI) % TWO_PI;
		const idx = Math.min(
			COIN_KEYS.length - 1,
			Math.floor((t / TWO_PI) * COIN_KEYS.length),
		);
		return COIN_KEYS[idx];
	};

	const spawnBurstCoin = (cx: number, cy: number): FlyingCoin => {
		const a = Math.random() * TWO_PI;
		const speed = 140 + Math.random() * 300;
		const rot = Math.random() * TWO_PI;
		return {
			id: nextId++,
			x: cx + (Math.random() - 0.5) * BADGE_W * 0.32,
			y: cy + (Math.random() - 0.5) * BADGE_H * 0.22,
			vx: Math.cos(a) * speed,
			vy: Math.sin(a) * speed - 50,
			rot,
			rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (8 + Math.random() * 12),
			tumble: Math.random() * TWO_PI,
			tumbleSpeed: (Math.random() < 0.5 ? -1 : 1) * (3 + Math.random() * 6),
			scale: 0.48 + Math.random() * 0.65,
			alpha: 0.82 + Math.random() * 0.18,
			key: rotToKey(rot),
		};
	};

	const spawnMany = (count: number) => {
		const room = MAX_COINS - coins.length;
		if (room <= 0) return;
		const fresh: FlyingCoin[] = [];
		for (let i = 0; i < Math.min(count, room); i++) {
			fresh.push(spawnBurstCoin(centerX, centerY));
		}
		coins = [...coins, ...fresh];
	};

	const resetMotion = () => {
		rayAngle = 0;
		badgePulseScale = 1;
		congratPulseScale = 1;
		sunburstPulseScale = 1;
		sunPulseScale = 1;
		badgeBobY = 0;
		void celebrationPop.set(0.82, { duration: 0 });
	};

	const stopMotionLoop = () => {
		cancelAnimationFrame(motionRaf);
		motionRaf = 0;
		resetMotion();
	};

	const startMotionLoop = () => {
		stopMotionLoop();
		const start = performance.now();
		void celebrationPop.set(1, { duration: POP_IN_MS, easing: backOut });

		const tick = (t: number) => {
			const elapsed = t - start;
			rayAngle = (elapsed / 90) % 360;

			const breathe = Math.sin((elapsed / BADGE_BREATHE_MS) * TWO_PI);
			const punch = Math.sin((elapsed / BADGE_PUNCH_MS) * TWO_PI);
			badgePulseScale = 1 + 0.035 * breathe + 0.05 * punch;
			badgeBobY = -SYMBOL_SIZE * 0.024 * punch;
			congratPulseScale =
				1 + 0.03 * Math.sin((elapsed / CONGRAT_BREATHE_MS) * TWO_PI + 0.65);
			sunburstPulseScale =
				1 + 0.045 * Math.sin((elapsed / SUNBURST_BREATHE_MS) * TWO_PI);
			sunPulseScale = 1 + 0.07 * Math.sin((elapsed / SUN_PUNCH_MS) * TWO_PI + 0.4);

			motionRaf = requestAnimationFrame(tick);
		};
		motionRaf = requestAnimationFrame(tick);
	};

	const stopCoinLoop = () => {
		coinLoopActive = false;
		cancelAnimationFrame(coinRaf);
		coinRaf = 0;
		if (spawnTimer) clearInterval(spawnTimer);
		spawnTimer = undefined;
		coins = [];
	};

	const startCoinLoop = () => {
		stopCoinLoop();
		coins = [];
		nextId = 0;
		spawnMany(INITIAL_BURST);
		spawnTimer = setInterval(() => spawnMany(SPAWN_BURST), SPAWN_INTERVAL_MS);
		coinLoopActive = true;
		let last = performance.now();

		const tick = (t: number) => {
			if (!coinLoopActive) return;
			const dt = Math.min(0.05, (t - last) / 1000);
			last = t;
			const w = layout.width;
			const h = layout.height;
			const pad = COIN_BASE * 2;

			if (coins.length) {
				coins = coins
					.map((c) => {
						let { x, y, vx, vy, rot, rotSpeed, tumble, tumbleSpeed } = c;
						x += vx * dt;
						y += vy * dt;
						vy += GRAVITY * dt;
						vx *= 0.992;
						rot += rotSpeed * dt;
						tumble += tumbleSpeed * dt;
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
					})
					.filter(
						(c) => c.y > -pad && c.y < h + pad && c.x > -pad && c.x < w + pad,
					);
			}

			coinRaf = requestAnimationFrame(tick);
		};

		coinRaf = requestAnimationFrame(tick);
	};

	const cleanup = () => {
		stopMotionLoop();
		stopCoinLoop();
	};

	context.eventEmitter.subscribeOnMount({
		bigWinCelebrationShow: (e) => {
			winLevelData = e.winLevelData;
			badgeKey = winCelebrationImageKey(e.winLevelData);
			show = true;
			countUpAmount.set(0, { duration: 0 });
			startMotionLoop();
			startCoinLoop();
		},

		bigWinCelebrationHide: () => {
			show = false;
			cleanup();
		},

		bigWinCelebrationUpdate: async (e) => {
			winLevelData = e.winLevelData;
			badgeKey = winCelebrationImageKey(e.winLevelData);
			const totalDuration = e.duration;
			const countUpDuration = Math.round(totalDuration * GRID_WIN_COUNT_FRACTION);
			const soundName = getGridWinCelebrationSoundName(e.winLevelData);

			const snapToFinal = () => {
				countUpAmount.set(e.amount, { duration: 0 });
			};

			if (countUpAmount.target !== e.amount) {
				void countUpAmount.set(e.amount, { duration: countUpDuration });
			}

			const { skipped } = await waitForSkipOrTimeout(totalDuration, () => {
				snapToFinal();
				context.eventEmitter.broadcast({ type: 'soundStop', name: soundName });
			});

			if (!skipped) {
				snapToFinal();
				context.eventEmitter.broadcast({ type: 'soundStop', name: soundName });
			}
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={OVERLAY_ALPHA} />

	<MainContainer>
		<Container x={centerX} y={centerY}>
			<Container rotation={(rayAngle * Math.PI) / 180} scale={sunburstPulseScale}>
				<Sprite
					key="win_sunburst"
					anchor={0.5}
					width={SUNBURST_SIZE}
					height={SUNBURST_SIZE}
				/>
			</Container>

			<Container scale={sunPulseScale}>
				<Sprite key="intro_sun" anchor={0.5} width={SUN_SIZE} height={SUN_SIZE} />
			</Container>

			<Container
				y={CONGRAT_Y}
				scale={congratPulseScale * celebrationPop.current}
			>
				<Sprite
					key="win_congratulations"
					anchor={0.5}
					width={CONGRAT_W}
					height={CONGRAT_H}
				/>
			</Container>

			<Container
				y={badgeBobY}
				scale={badgePulseScale * celebrationPop.current}
			>
				<Sprite key={badgeKey} anchor={0.5} width={BADGE_W} height={BADGE_H} />

				<BitmapText
					anchor={0.5}
					y={BADGE_H * 0.52}
					text={bookEventAmountToCurrencyString(countUpAmount.current)}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * 0.68,
						fill: 0xffffff,
						fontWeight: '700',
					}}
				/>
			</Container>
		</Container>

		<Container zIndex={3}>
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
</FadeContainer>
