<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';

	import { Container, Sprite, BitmapText } from 'pixi-svelte';

	import { FadeContainer } from 'components-pixi';

	import { CanvasSizeRectangle } from 'components-layout';

	import { OnHotkey } from 'components-shared';

	import { OnPressFullScreen } from 'components-layout';

	import { getContext } from '../game/context';

	import {
		BG_FILL_COLOR,
		getIntroLayout,
		INTRO_BG_SWAP_MS,
		INTRO_CROSSFADE_MS,
		INTRO_FRAME_SWAP_MS,
		INTRO_LOGO_DAY_KEY,
		INTRO_LOGO_NIGHT_KEY,
		INTRO_CREAM,
		INTRO_GOLD,
		INTRO_GOLD_BRIGHT,
		INTRO_TEXT_STROKE,
	} from '../game/loadingIntroLayout';

	type Props = { onloaded: () => void };

	const props: Props = $props();

	const context = getContext();

	const loaded = $derived(context.stateApp.loaded);

	const layoutType = $derived(context.stateLayoutDerived.layoutType());

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());

	const layout = $derived(getIntroLayout(canvas, mainLayout, layoutType));

	const taglineStyle = $derived({
		fontFamily: 'proxima-nova',
		fontSize: layout.text.taglineFontSize,
		fill: INTRO_GOLD,
		fontWeight: '700' as const,
		stroke: { color: INTRO_TEXT_STROKE, width: layout.text.strokeWidth },
	});

	const actionStyle = $derived({
		fontFamily: 'proxima-nova',
		fontSize: layout.text.actionFontSize,
		fill: INTRO_GOLD_BRIGHT,
		fontWeight: '700' as const,
		stroke: { color: INTRO_TEXT_STROKE, width: layout.text.strokeWidth },
	});

	const loadingStyle = $derived({
		fontFamily: 'proxima-nova',
		fontSize: layout.text.actionFontSize * 0.92,
		fill: INTRO_CREAM,
		fontWeight: '600' as const,
	});

	/** 1 = day bg / day logo, 0 = night. */
	const dayBlend = new Tween(1, { duration: 0 });
	/** 0 = frame_full, 1 = frame_multiplicator. */
	const frameBlend = new Tween(0, { duration: 0 });

	const crossfadeOpts = { duration: INTRO_CROSSFADE_MS, easing: cubicInOut };

	const INTRO_TEXT_PULSE_MS = 1600;
	const INTRO_TEXT_PULSE_AMP = 0.035;

	let textPulse = $state(1);

	$effect(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			const elapsed = t - start;
			textPulse = 1 + INTRO_TEXT_PULSE_AMP * Math.sin((elapsed / INTRO_TEXT_PULSE_MS) * Math.PI * 2);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	onMount(() => {
		let dayIsDay = true;
		let frameIsMultiplier = false;

		const frameId = setInterval(() => {
			frameIsMultiplier = !frameIsMultiplier;
			frameBlend.set(frameIsMultiplier ? 1 : 0, crossfadeOpts);
		}, INTRO_FRAME_SWAP_MS);

		const bgId = setInterval(() => {
			dayIsDay = !dayIsDay;
			dayBlend.set(dayIsDay ? 1 : 0, crossfadeOpts);
		}, INTRO_BG_SWAP_MS);

		return () => {
			clearInterval(frameId);
			clearInterval(bgId);
		};
	});
</script>

<FadeContainer show={true} zIndex={500} eventMode="passive">
	<CanvasSizeRectangle backgroundColor={BG_FILL_COLOR} eventMode="none" />

	<Container eventMode="none">
		<Sprite
			key={layout.bgDay.cfg.key}
			anchor={0.5}
			x={layout.bgDay.x}
			y={layout.bgDay.y}
			width={layout.bgDay.width}
			height={layout.bgDay.height}
			alpha={dayBlend.current}
		/>
		<Sprite
			key={layout.bgNight.cfg.key}
			anchor={0.5}
			x={layout.bgNight.x}
			y={layout.bgNight.y}
			width={layout.bgNight.width}
			height={layout.bgNight.height}
			alpha={1 - dayBlend.current}
		/>
	</Container>

	<Container eventMode="none">
		<Container x={layout.centerX} y={layout.centerY}>
			<Sprite
				key="intro_frame_full"
				anchor={0.5}
				width={layout.frameW}
				height={layout.frameH}
				alpha={1 - frameBlend.current}
			/>
			<Sprite
				key="intro_frame_multiplicator"
				anchor={0.5}
				width={layout.frameW}
				height={layout.frameH}
				alpha={frameBlend.current}
			/>
		</Container>

		<Sprite
			key={INTRO_LOGO_DAY_KEY}
			anchor={layout.logoDay.anchor}
			x={layout.logoDay.x}
			y={layout.logoDay.y}
			width={layout.logoDay.width}
			height={layout.logoDay.height}
			alpha={dayBlend.current}
		/>
		<Sprite
			key={INTRO_LOGO_NIGHT_KEY}
			anchor={layout.logoNight.anchor}
			x={layout.logoNight.x}
			y={layout.logoNight.y}
			width={layout.logoNight.width}
			height={layout.logoNight.height}
			alpha={1 - dayBlend.current}
		/>

		<BitmapText
			anchor={0.5}
			x={layout.text.centerX}
			y={layout.text.taglineY}
			scale={textPulse}
			text="WIN UP TO 25,000× BET"
			style={taglineStyle}
		/>

		{#if !loaded}
			<BitmapText
				anchor={0.5}
				x={layout.text.centerX}
				y={layout.text.actionY}
				scale={textPulse}
				text="Loading..."
				style={loadingStyle}
			/>
		{/if}

		{#if loaded}
			<BitmapText
				anchor={0.5}
				x={layout.text.centerX}
				y={layout.text.actionY}
				scale={textPulse}
				text="PRESS ANYWHERE TO START"
				style={actionStyle}
			/>
		{/if}
	</Container>
</FadeContainer>

{#if loaded}
	<OnHotkey hotkey="Space" onpress={() => props.onloaded()} />
	<OnPressFullScreen onpress={() => props.onloaded()} />
{/if}
