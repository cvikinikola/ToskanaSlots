<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { ColorMatrixFilter } from 'pixi.js';
	import { Container, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getBgConfig, getBgLayout } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import {
		DEKA_BRIGHTNESS,
		DEKA_SPRITE_TINT,
		getDekaRect,
		isDekaVisible,
	} from '../game/backgroundCharacter';
	import { startBackgroundCharacterAnim } from '../game/backgroundCharacterAnim';

	const context = getContext();

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const gameType = $derived(stateGame.gameType);
	const show = $derived(gameType === 'basegame' || gameType === 'freeSpins');
	const showDeka = $derived(show && isDekaVisible(layoutType));

	const bgLayout = $derived(getBgLayout(canvas, layoutType, gameType));
	const bgKey = $derived(getBgConfig(layoutType, gameType).key);
	const dekaRect = $derived(getDekaRect(canvas, layoutType, gameType));

	const dekaFilters = (() => {
		const matrix = new ColorMatrixFilter();
		matrix.brightness(DEKA_BRIGHTNESS, false);
		return [matrix];
	})();

	const DEKA_TEXTURE_KEYS = ['deka_v2_idle', 'deka_v2_blink', 'deka_v2_toast'] as const;

	$effect(() => {
		const assets = context.stateApp.loadedAssets;
		if (!assets) return;
		for (const key of DEKA_TEXTURE_KEYS) {
			const tex = assets[key] as PIXI.Texture | undefined;
			const source = tex?.source;
			if (!source) continue;
			source.alphaMode = 'premultiply-alpha-on-upload';
			source.update?.();
		}
	});

	let breathScale = $state(1);
	let idleAlpha = $state(1);
	let blinkAlpha = $state(0);
	let toastAlpha = $state(0);

	$effect(() => {
		if (!showDeka) return;
		const controller = startBackgroundCharacterAnim({
			setBreathScale: (scale) => {
				breathScale = scale;
			},
			setIdleAlpha: (alpha) => {
				idleAlpha = alpha;
			},
			setBlinkAlpha: (alpha) => {
				blinkAlpha = alpha;
			},
			setToastAlpha: (alpha) => {
				toastAlpha = alpha;
			},
		});
		return () => controller.stop();
	});
</script>

{#if show}
	<Container zIndex={-10} eventMode="none">
		<Sprite
			key={bgKey}
			anchor={{ x: 0.5, y: 0.5 }}
			x={bgLayout.x}
			y={bgLayout.y}
			width={bgLayout.width}
			height={bgLayout.height}
			eventMode="none"
		/>

		{#if showDeka}
			<Container
				x={dekaRect.x}
				y={dekaRect.y}
				scale={breathScale}
				filters={dekaFilters}
				eventMode="none"
			>
				<Sprite
					key="deka_v2_idle"
					anchor={{ x: 0.5, y: 1 }}
					width={dekaRect.width}
					height={dekaRect.height}
					alpha={idleAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
				<Sprite
					key="deka_v2_blink"
					anchor={{ x: 0.5, y: 1 }}
					width={dekaRect.width}
					height={dekaRect.height}
					alpha={blinkAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
				<Sprite
					key="deka_v2_toast"
					anchor={{ x: 0.5, y: 1 }}
					width={dekaRect.width}
					height={dekaRect.height}
					alpha={toastAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
			</Container>
		{/if}
	</Container>
{/if}
