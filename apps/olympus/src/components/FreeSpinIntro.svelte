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
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { waitForTimeout } from 'utils-shared/wait';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	// Responsive panel — caps to mainLayout so it never overflows on mobile.
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const PANEL_W = $derived(Math.min(SYMBOL_SIZE * 6, layout.width * 0.9));
	const PANEL_H = $derived(Math.min(SYMBOL_SIZE * 3.6, layout.height * 0.55));
	const FONT_SCALE = $derived(PANEL_W / (SYMBOL_SIZE * 6));
	const CORNER = 24;

	let show = $state(false);
	let totalFreeSpins = $state(0);
	let extraFreeSpins = $state(0);
	let mode = $state<'trigger' | 'retrigger'>('trigger');
	let oncomplete = $state(() => {});

	context.eventEmitter.subscribeOnMount({
		freeSpinIntroShow: () => {
			mode = 'trigger';
			stateGame.freeSpinIntroActive = true;
			show = true;
		},
		freeSpinIntroHide: () => {
			show = false;
			stateGame.freeSpinIntroActive = false;
		},
		freeSpinIntroUpdate: async (e) => {
			totalFreeSpins = e.totalFreeSpins;
			await waitForTimeout(2200);
			oncomplete();
		},
		freeSpinRetriggerShow: () => {
			mode = 'retrigger';
			stateGame.freeSpinIntroActive = true;
			show = true;
		},
		freeSpinRetriggerHide: () => {
			show = false;
			stateGame.freeSpinIntroActive = false;
		},
		freeSpinRetriggerUpdate: async (e) => {
			extraFreeSpins = e.extraFreeSpins;
			totalFreeSpins = e.totalFreeSpins;
			await waitForTimeout(1600);
			oncomplete();
		},
	});

	// Animated rays + bobbing Mjolnir
	let rayAngle = $state(0);
	let hammerScale = $state(0);
	let hammerY = $state(-10);
	$effect(() => {
		if (!show) {
			hammerScale = 0;
			return;
		}
		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			const elapsed = t - start;
			rayAngle = (elapsed / 60) % 360;
			const k = Math.min(1, elapsed / 380);
			hammerScale = k * (1 + 0.06 * Math.sin((elapsed / 600) * Math.PI * 2));
			hammerY = -10 + Math.sin((elapsed / 900) * Math.PI * 2) * 6;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.78} />

	<MainContainer>
		<Container
			x={layout.width / 2}
			y={layout.height / 2}
		>
			<!-- Rotating godrays -->
			<Container rotation={(rayAngle * Math.PI) / 180}>
				<Graphics
					draw={(g) => {
						g.clear();
						const R = SYMBOL_SIZE * 6;
						for (let i = 0; i < 16; i++) {
							const a = (i / 16) * Math.PI * 2;
							const wedge = Math.PI / 32;
							g.moveTo(0, 0);
							g.lineTo(Math.cos(a - wedge) * R, Math.sin(a - wedge) * R);
							g.lineTo(Math.cos(a + wedge) * R, Math.sin(a + wedge) * R);
							g.closePath();
							g.fill({ color: 0xffd147, alpha: 0.10 });
						}
					}}
				/>
			</Container>

			<!-- Soft glow disc -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.circle(0, 0, SYMBOL_SIZE * 3.5);
					g.fill({ color: 0xffd147, alpha: 0.08 });
					g.circle(0, 0, SYMBOL_SIZE * 2.4);
					g.fill({ color: 0xffd147, alpha: 0.12 });
				}}
			/>

			<!-- Decorative panel -->
			<Container x={-PANEL_W / 2} y={-PANEL_H / 2}>
				<Graphics
					draw={(g) => {
						g.clear();
						g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
						g.fill({ color: 0x0d0617, alpha: 0.96 });
						g.stroke({ color: 0xffd147, width: 4 });
						g.roundRect(8, 8, PANEL_W - 16, PANEL_H - 16, CORNER - 6);
						g.stroke({ color: 0xffd147, width: 1, alpha: 0.5 });
					}}
				/>
			</Container>

			<!-- Mjolnir behind text -->
			<Container x={0} y={hammerY - SYMBOL_SIZE * 0.6} scale={hammerScale}>
				<Sprite key="sym_m" anchor={0.5} width={SYMBOL_SIZE * 1.6} height={SYMBOL_SIZE * 1.6} />
			</Container>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				y={SYMBOL_SIZE * 0.55}
				text={mode === 'retrigger' ? 'RETRIGGER' : 'FREE SPINS'}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.7 * FONT_SCALE,
					fill: 0xffd147,
					fontWeight: '800',
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				y={SYMBOL_SIZE * 1.2}
				text={mode === 'retrigger'
					? `+${extraFreeSpins} FREE SPINS (${totalFreeSpins} TOTAL)`
					: `${totalFreeSpins} SPINS AWARDED`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.42 * FONT_SCALE,
					fill: 0xffffff,
					fontWeight: '700',
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>
