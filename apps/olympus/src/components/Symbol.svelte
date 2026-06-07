<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText, Graphics, Sprite } from 'pixi-svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, TUMBLE_OPTIONS } from '../game/constants';
	import { getSymbolAssetKey, getSymbolSpriteDimensions } from '../game/utils';
	import { landBounce } from '../game/landBounce';
	import { destroySquashExplode } from '../game/destroyAnim';
	import { stateGameDerived } from '../game/stateGame.svelte';

	type Props = {
		x?: number;
		y?: number;
		state: SymbolState;
		rawSymbol: RawSymbol;
		oncomplete?: () => void;
		loop?: boolean;
	};

	const props: Props = $props();

	const spriteKey = $derived(getSymbolAssetKey(props.rawSymbol.name));
	const isScatter = $derived(props.rawSymbol.name === 'S');
	const showScatterAura = $derived(isScatter && props.state !== 'explosion');

	const tint = $derived(
		props.state === 'win'
			? 0xffffff
			: props.state === 'postWinStatic'
				? 0xffffff
				: props.state === 'explosion'
					? 0xff5555
					: 0xffffff,
	);

	const winScale = $derived(props.state === 'win' ? 1.05 : 1);
	const spriteDimensions = $derived(getSymbolSpriteDimensions(props.rawSymbol.name));
	const spriteYOffset = $derived(spriteDimensions.height / 2);
	const glowCenterY = $derived(spriteYOffset - spriteDimensions.height * 0.42);
	const glowRx = $derived(spriteDimensions.width * 0.58);
	const glowRy = $derived(spriteDimensions.height * 0.5);

	const scaleX = new Tween(1);
	const scaleY = new Tween(1);
	const alpha = new Tween(1);
	const jumpY = new Tween(0);

	let scatterPulse = $state(0);
	let scatterOrbit = $state(0);
	let scatterBreathe = $state(1);

	$effect(() => {
		if (!showScatterAura) {
			scatterPulse = 0;
			scatterOrbit = 0;
			scatterBreathe = 1;
			return;
		}

		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			const elapsed = t - start;
			scatterPulse = (Math.sin((elapsed / 850) * Math.PI * 2) + 1) / 2;
			scatterOrbit = elapsed / 1100;
			scatterBreathe = 1 + 0.03 * Math.sin((elapsed / 1300) * Math.PI * 2);
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const idleBreathe = $derived(
		showScatterAura && props.state === 'static' ? scatterBreathe : 1,
	);

	$effect(() => {
		if (props.state === 'win') {
			const duration = stateGameDerived.useTurboPacing()
				? TUMBLE_OPTIONS.winDurationTurboMs
				: TUMBLE_OPTIONS.winDurationMs;
			const t = setTimeout(() => props.oncomplete?.(), duration);
			return () => clearTimeout(t);
		}
		if (props.state === 'explosion') {
			let cancelled = false;
			scaleX.set(1, { duration: 0 });
			scaleY.set(1, { duration: 0 });
			alpha.set(1, { duration: 0 });
			jumpY.set(0, { duration: 0 });
			destroySquashExplode(
				scaleX,
				scaleY,
				alpha,
				jumpY,
				stateGameDerived.useTurboPacing(),
			).then(() => {
				if (!cancelled) props.oncomplete?.();
			});
			return () => {
				cancelled = true;
			};
		}
		if (props.state === 'land') {
			scaleX.set(1, { duration: 0 });
			scaleY.set(1, { duration: 0 });
			alpha.set(1, { duration: 0 });
			jumpY.set(0, { duration: 0 });
			landBounce(scaleX, scaleY);
			queueMicrotask(() => props.oncomplete?.());
		}
	});

	const drawScatterAura = (g: Parameters<NonNullable<ConstructorParameters<typeof Graphics>[0]['draw']>>[0]) => {
		g.clear();

		const pulse = scatterPulse;
		const breathe = scatterBreathe;
		const cy = glowCenterY;
		const rx = glowRx * breathe * (1 + pulse * 0.07);
		const ry = glowRy * breathe * (1 + pulse * 0.07);

		g.ellipse(0, cy, rx * 1.12, ry * 1.12);
		g.fill({ color: 0xffb703, alpha: 0.07 + pulse * 0.09 });

		g.ellipse(0, cy, rx, ry);
		g.fill({ color: 0xffd147, alpha: 0.05 + pulse * 0.08 });

		g.ellipse(0, cy, rx * 0.92, ry * 0.92);
		g.stroke({ color: 0xffe79a, width: 1.5 + pulse * 1.2, alpha: 0.35 + pulse * 0.4 });

		for (let i = 0; i < 4; i++) {
			const angle = scatterOrbit + (i * Math.PI) / 2;
			const sparkX = Math.cos(angle) * rx * 1.08;
			const sparkY = cy + Math.sin(angle) * ry * 0.92;
			g.circle(sparkX, sparkY, 1.8 + pulse * 1.4);
			g.fill({ color: 0xfff0b8, alpha: 0.35 + pulse * 0.45 });
		}
	};
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} alpha={alpha.current}>
	{#if showScatterAura}
		<Graphics draw={drawScatterAura} />
	{/if}

	<Container
		y={spriteYOffset + jumpY.current}
		scale={{
			x: scaleX.current * winScale * idleBreathe,
			y: scaleY.current * winScale * idleBreathe,
		}}
	>
		<Sprite
			key={spriteKey}
			anchor={{ x: 0.5, y: 1 }}
			width={spriteDimensions.width}
			height={spriteDimensions.height}
			roundPixels
			{tint}
		/>
	</Container>

	{#if props.rawSymbol.multiplier}
		<BitmapText
			anchor={{ x: 0.5, y: 1 }}
			y={SYMBOL_SIZE * 0.42}
			text={`×${props.rawSymbol.multiplier}`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: SYMBOL_SIZE * 0.28,
				fill: 0xffd700,
				fontWeight: '800',
				stroke: { color: 0x1a0608, width: 4 },
			}}
		/>
	{/if}
</Container>
