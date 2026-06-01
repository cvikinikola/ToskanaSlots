<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Rectangle, Text } from 'pixi-svelte';

	import { SYMBOL_SIZE, SYMBOL_STEP_X } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';

	type Props = {
		reel: number;
		row: number;
		hitCount: number;
		multiplier: number;
		flashing: boolean;
		pulse: number;
	};

	const props: Props = $props();

	const CELL_W = SYMBOL_STEP_X * 0.96;
	const CELL_H = SYMBOL_SIZE * 0.96;
	const isMarked = $derived(props.hitCount >= 1 && props.multiplier < 2);
	const isActive = $derived(props.multiplier >= 2);

	const labelStyle = $derived.by(() => {
		const mult = props.multiplier;
		if (mult >= 256) return { fill: 0x44bbff, stroke: { color: 0xffffff, width: 5 } };
		if (mult >= 16) return { fill: 0xff2d6a, stroke: { color: 0xffffff, width: 5 } };
		if (mult >= 4) return { fill: 0xff5533, stroke: { color: 0xffffff, width: 5 } };
		return { fill: 0xffaa00, stroke: { color: 0xffffff, width: 5 } };
	});

	const markedAlpha = $derived(0.55 + 0.35 * Math.sin(props.pulse * Math.PI * 2));
	const markedFillAlpha = $derived(0.38 + 0.18 * Math.sin(props.pulse * Math.PI * 2));
	const activePulse = $derived(0.88 + 0.12 * Math.sin(props.pulse * Math.PI * 2));

	const flashScale = new Tween(1);

	$effect(() => {
		if (!props.flashing) return;
		void (async () => {
			await flashScale.set(1.22, { duration: 170 });
			await flashScale.set(1, { duration: 310 });
		})();
	});

	const scale = $derived(
		props.flashing
			? flashScale.current
			: isActive
				? 1 + 0.04 * Math.sin(props.pulse * Math.PI * 2)
				: 1,
	);
</script>

{#if isMarked || isActive}
	<Container
		x={getSymbolX(props.reel)}
		y={getSymbolY(props.row)}
		scale={scale}
		zIndex={-2}
	>
		{#if isActive}
			<Rectangle
				anchor={0.5}
				width={CELL_W * 1.08}
				height={CELL_H * 1.08}
				borderRadius={SYMBOL_SIZE * 0.12}
				backgroundColor={0xffa500}
				backgroundAlpha={0.35 * activePulse}
				borderWidth={0}
			/>
			<Rectangle
				anchor={0.5}
				width={CELL_W}
				height={CELL_H}
				borderRadius={SYMBOL_SIZE * 0.1}
				backgroundColor={0xffc830}
				backgroundAlpha={0.98}
				borderColor={0xffffff}
				borderWidth={3}
				borderAlpha={0.95}
			/>
			<Text
				anchor={0.5}
				text={`×${props.multiplier}`}
				style={{
					fontFamily: 'Arial Black, Segoe UI, sans-serif',
					fontSize: SYMBOL_SIZE * 0.4,
					fontWeight: '900',
					...labelStyle,
				}}
			/>
		{:else}
			<Rectangle
				anchor={0.5}
				width={CELL_W * 1.06}
				height={CELL_H * 1.06}
				borderRadius={SYMBOL_SIZE * 0.12}
				backgroundColor={0xffa500}
				backgroundAlpha={0.22 * markedAlpha}
				borderWidth={0}
			/>
			<Rectangle
				anchor={0.5}
				width={CELL_W}
				height={CELL_H}
				borderRadius={SYMBOL_SIZE * 0.1}
				backgroundColor={0xffb830}
				backgroundAlpha={markedFillAlpha}
				borderColor={0xffe566}
				borderWidth={3}
				borderAlpha={markedAlpha}
			/>
		{/if}
	</Container>
{/if}
