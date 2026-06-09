<script lang="ts" module>
	export type EmitterEventFreeSpinIntro =
		| { type: 'freeSpinIntroShow' }
		| { type: 'freeSpinIntroHide' }
		| { type: 'freeSpinIntroUpdate'; totalFreeSpins: number }
		| { type: 'freeSpinRetriggerShow' }
		| { type: 'freeSpinRetriggerHide' }
		| { type: 'freeSpinRetriggerUpdate'; extraFreeSpins: number; totalFreeSpins: number };
</script>

<script lang="ts">
	import { Container, Graphics, Sprite, BitmapText } from 'pixi-svelte';
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// ─── Timeline tuning (ms) ─────────────────────────────────────────────────
	const T_CROW_MS = 300;
	const T_SUN_MS = 800;
	const INTRO_HOLD_MS = 1800;
	const RETRIGGER_HOLD_MS = 1400;
	const OVERLAY_ALPHA = 0.42;

	const SUN_RISE_MS = 900;
	const SUN_GLOW_MS = 1100;
	const ROOSTER_ENTER_MS = 380;
	const ROOSTER_CROW_LIFT_MS = 360;
	const ROOSTER_CROW_DROP_MS = 440;
	const ROOSTER_CROW_POSE_HOLD_MS = 180;
	const ROOSTER_CROW_CYCLE_GAP_MS = 220;
	/** kukuriku.mp3 runtime — crow/calm cycles repeat until this elapses. */
	const ROOSTER_CROW_AUDIO_MS = 7056;
	const ROOSTER_LIFT_Y = SYMBOL_SIZE * 0.11;
	const PANEL_ENTER_MS = 320;

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const FRAME_ASPECT = 422 / 591;
	const PANEL_W = $derived(Math.min(SYMBOL_SIZE * 6.2, layout.width * 0.92));
	const PANEL_H = $derived(Math.min(PANEL_W * FRAME_ASPECT, layout.height * 0.55));
	const FONT_SCALE = $derived(PANEL_W / (SYMBOL_SIZE * 6.2));

	// Text colours — tuned for outro_frame asset (same as FreeSpinOutro)
	const PANEL_WOOD_DEEP = 0x2e180f;
	const PANEL_GOLD_HEADING = 0xffd86b;
	const PANEL_CREAM = 0xf5e7c0;

	const ROOSTER_SIZE = SYMBOL_SIZE * 1.6;
	const SUN_SIZE = SYMBOL_SIZE * 2.8;
	const GLOW_SIZE = SYMBOL_SIZE * 6.2;
	const RAYS_SPRITE_SIZE = SYMBOL_SIZE * 11.5;

	let show = $state(false);
	let totalFreeSpins = $state(0);
	let extraFreeSpins = $state(0);
	let mode = $state<'trigger' | 'retrigger'>('trigger');
	/** false = petao.png (calm), true = petao_peva.png (crow) */
	let roosterCrow = $state(false);
	let raysVisible = $state(false);
	let rayAngle = $state(0);

	const panelScale = new Tween(0.88, { duration: 0 });
	const panelAlpha = new Tween(0, { duration: 0 });
	const roosterScale = new Tween(0, { duration: 0 });
	const roosterLift = new Tween(0, { duration: 0 });
	const sunY = new Tween(SYMBOL_SIZE * 0.9, { duration: 0 });
	const sunScale = new Tween(0.75, { duration: 0 });
	const sunGlow = new Tween(0, { duration: 0 });
	const textAlpha = new Tween(0, { duration: 0 });

	let rafId = 0;
	let sequenceToken = 0;

	const resetAnimation = () => {
		cancelAnimationFrame(rafId);
		roosterCrow = false;
		raysVisible = false;
		rayAngle = 0;
		panelScale.set(0.88, { duration: 0 });
		panelAlpha.set(0, { duration: 0 });
		roosterScale.set(0, { duration: 0 });
		roosterLift.set(0, { duration: 0 });
		sunY.set(SYMBOL_SIZE * 0.9, { duration: 0 });
		sunScale.set(0.75, { duration: 0 });
		sunGlow.set(0, { duration: 0 });
		textAlpha.set(0, { duration: 0 });
	};

	const startRaySpin = () => {
		cancelAnimationFrame(rafId);
		raysVisible = true;
		const start = performance.now();
		const tick = (t: number) => {
			rayAngle = ((t - start) / 90) % 360;
			rafId = requestAnimationFrame(tick);
		};
		rafId = requestAnimationFrame(tick);
	};

	const playSunrise = async () => {
		startRaySpin();
		await Promise.all([
			sunY.set(-SYMBOL_SIZE * 0.15, { duration: SUN_RISE_MS, easing: cubicOut }),
			sunScale.set(1.08, { duration: SUN_RISE_MS, easing: cubicOut }),
			sunGlow.set(1, { duration: SUN_GLOW_MS, easing: cubicOut }),
		]);
	};

	/** Calm rooster (petao.png) pops in with the panel. */
	const showCalmRooster = async () => {
		roosterCrow = false;
		await roosterScale.set(1, { duration: ROOSTER_ENTER_MS, easing: backOut });
	};

	/** Alternate peva ↔ calm (lift ↔ rest) for the full kukuriku clip. */
	const animateRoosterCrow = async (token: number) => {
		context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_rooster_crow' });
		const endAt = performance.now() + ROOSTER_CROW_AUDIO_MS;

		while (performance.now() < endAt) {
			if (token !== sequenceToken) return;

			// Crow pose — lift up (petao_peva.png)
			roosterCrow = true;
			await Promise.all([
				roosterScale.set(1.12, { duration: ROOSTER_CROW_LIFT_MS, easing: backOut }),
				roosterLift.set(-ROOSTER_LIFT_Y, { duration: ROOSTER_CROW_LIFT_MS, easing: backOut }),
			]);
			if (token !== sequenceToken) return;
			await waitForTimeout(Math.min(ROOSTER_CROW_POSE_HOLD_MS, endAt - performance.now()));
			if (performance.now() >= endAt) break;

			// Calm pose — back to rest (petao.png)
			roosterCrow = false;
			await Promise.all([
				roosterScale.set(1, { duration: ROOSTER_CROW_DROP_MS, easing: cubicOut }),
				roosterLift.set(0, { duration: ROOSTER_CROW_DROP_MS, easing: cubicOut }),
			]);
			if (token !== sequenceToken) return;
			await waitForTimeout(Math.min(ROOSTER_CROW_CYCLE_GAP_MS, endAt - performance.now()));
		}

		roosterCrow = false;
		await Promise.all([
			roosterScale.set(1, { duration: 150, easing: cubicOut }),
			roosterLift.set(0, { duration: 150, easing: cubicOut }),
		]);
	};

	const playIntroSequence = async (isRetrigger: boolean) => {
		const token = ++sequenceToken;
		resetAnimation();

		await Promise.all([
			panelAlpha.set(1, { duration: 280, easing: cubicOut }),
			panelScale.set(1, { duration: PANEL_ENTER_MS, easing: backOut }),
			textAlpha.set(1, { duration: 320, easing: cubicOut }),
			showCalmRooster(),
		]);
		if (token !== sequenceToken) return;

		const crowDelay = isRetrigger ? 150 : T_CROW_MS;
		await waitForTimeout(crowDelay);
		if (token !== sequenceToken) return;

		const crowPromise = animateRoosterCrow(token);

		if (!isRetrigger) {
			const sunDelay = Math.max(0, T_SUN_MS - crowDelay);
			await waitForTimeout(sunDelay);
			if (token !== sequenceToken) return;
			void playSunrise();
		} else {
			void sunGlow.set(0.55, { duration: 400, easing: cubicOut });
		}

		await crowPromise;
		if (token !== sequenceToken) return;

		await waitForTimeout(isRetrigger ? RETRIGGER_HOLD_MS : INTRO_HOLD_MS);
	};

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			mode = 'trigger';
			stateGame.freeSpinIntroActive = true;
			show = true;
		},
		freeSpinIntroHide: () => {
			sequenceToken++;
			resetAnimation();
			show = false;
			stateGame.freeSpinIntroActive = false;
		},
		freeSpinIntroUpdate: async (e) => {
			totalFreeSpins = e.totalFreeSpins;
			await playIntroSequence(false);
		},
		freeSpinRetriggerShow: () => {
			mode = 'retrigger';
			stateGame.freeSpinIntroActive = true;
			show = true;
		},
		freeSpinRetriggerHide: () => {
			sequenceToken++;
			resetAnimation();
			show = false;
			stateGame.freeSpinIntroActive = false;
		},
		freeSpinRetriggerUpdate: async (e) => {
			extraFreeSpins = e.extraFreeSpins;
			totalFreeSpins = e.totalFreeSpins;
			await playIntroSequence(true);
		},
	});
</script>

<!--
	Z-order (back → front):
	  glow + sun rays + sun disk  →  panel frame + rooster + text
	Night vineyard stays visible; global video switches to day only after intro.
-->
<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x04060f} backgroundAlpha={OVERLAY_ALPHA} />

	<MainContainer>
		<Container x={layout.width / 2} y={layout.height / 2} scale={panelScale.current}>
			<!-- ── BACK LAYER: everything behind the frame ── -->
			<Container label="intro-back">
				<Container y={-SYMBOL_SIZE * 0.55} alpha={sunGlow.current}>
					<Graphics
						draw={(g) => {
							g.clear();
							const cy = sunY.current;
							const r0 = GLOW_SIZE * 0.5;
							const r1 = GLOW_SIZE * 0.95;
							const r2 = GLOW_SIZE * 1.15;
							g.circle(0, cy, r2);
							g.fill({ color: 0xffc840, alpha: 0.32 });
							g.circle(0, cy, r1);
							g.fill({ color: 0xffe066, alpha: 0.38 });
							g.circle(0, cy, r0);
							g.fill({ color: 0xfff4a8, alpha: 0.48 });
							g.circle(0, cy, r0 * 0.45);
							g.fill({ color: 0xffffff, alpha: 0.42 });
						}}
					/>
				</Container>

				{#if raysVisible}
					<Container
						y={sunY.current - SYMBOL_SIZE * 0.55}
						rotation={(rayAngle * Math.PI) / 180}
						alpha={sunGlow.current}
					>
						<Sprite
							key="intro_sun_rays"
							anchor={0.5}
							width={RAYS_SPRITE_SIZE}
							height={RAYS_SPRITE_SIZE}
						/>
					</Container>
				{/if}

				<Container
					y={sunY.current - SYMBOL_SIZE * 0.55}
					scale={sunScale.current}
					alpha={sunGlow.current}
				>
					<Sprite key="intro_sun" anchor={0.5} width={SUN_SIZE} height={SUN_SIZE} />
				</Container>
			</Container>

			<!-- ── FRONT LAYER: frame, rooster, text ── -->
			<Container label="intro-front">
				<Container x={-PANEL_W / 2} y={-PANEL_H / 2} alpha={panelAlpha.current}>
					<Sprite key="outro_frame" width={PANEL_W} height={PANEL_H} />
				</Container>

				<Container y={-SYMBOL_SIZE * 0.6 + roosterLift.current} scale={roosterScale.current}>
					{#if roosterCrow}
						<Sprite
							key="intro_rooster_crow"
							anchor={0.5}
							width={ROOSTER_SIZE}
							height={ROOSTER_SIZE}
						/>
					{:else}
						<Sprite
							key="intro_rooster_calm"
							anchor={0.5}
							width={ROOSTER_SIZE}
							height={ROOSTER_SIZE}
						/>
					{/if}
				</Container>

				<Container alpha={textAlpha.current}>
					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						y={PANEL_H * -0.15}
						text={mode === 'retrigger' ? 'RETRIGGER' : 'FREE SPINS'}
						style={{
							fontFamily: 'proxima-nova',
							fontSize: SYMBOL_SIZE * 0.34 * FONT_SCALE,
							fill: PANEL_GOLD_HEADING,
							fontWeight: '900',
							stroke: { color: PANEL_WOOD_DEEP, width: 3 },
						}}
					/>

					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						y={PANEL_H * 0.12}
						text={mode === 'retrigger'
							? `+${extraFreeSpins} FREE SPINS (${totalFreeSpins} TOTAL)`
							: `${totalFreeSpins} SPINS AWARDED`}
						style={{
							fontFamily: 'proxima-nova',
							fontSize: SYMBOL_SIZE * 0.44 * FONT_SCALE,
							fill: PANEL_CREAM,
							fontWeight: '900',
							stroke: { color: PANEL_WOOD_DEEP, width: 2 },
						}}
					/>
				</Container>
			</Container>
		</Container>
	</MainContainer>
</FadeContainer>
