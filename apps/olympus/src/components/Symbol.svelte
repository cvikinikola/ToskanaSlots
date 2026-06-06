<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText, Sprite } from 'pixi-svelte';
	import type { SymbolState, RawSymbol } from '../game/types';
	import { SYMBOL_SIZE, TUMBLE_OPTIONS } from '../game/constants';
	import { getSymbolAssetKey, getSymbolSpriteSize } from '../game/utils';
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
	const symbolSpriteSize = $derived(getSymbolSpriteSize(props.rawSymbol.name));
	const spriteYOffset = $derived(symbolSpriteSize / 2);

	const scaleX = new Tween(1);
	const scaleY = new Tween(1);
	const alpha = new Tween(1);
	const jumpY = new Tween(0);

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
</script>

<Container x={props.x ?? 0} y={props.y ?? 0} alpha={alpha.current}>
	<Container
		y={spriteYOffset + jumpY.current}
		scale={{ x: scaleX.current * winScale, y: scaleY.current * winScale }}
	>
		<Sprite
			key={spriteKey}
			anchor={{ x: 0.5, y: 1 }}
			width={symbolSpriteSize}
			height={symbolSpriteSize}
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
