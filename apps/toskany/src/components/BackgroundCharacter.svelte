<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { ColorMatrixFilter } from 'pixi.js';
	import { Container, Graphics, Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getBgConfig, getBgLayout } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import {
		DEKA_BRIGHTNESS,
		DEKA_SPRITE_TINT,
		getDekaLayout,
	} from '../game/backgroundCharacter';
	import { startBackgroundCharacterAnim } from '../game/backgroundCharacterAnim';

	type Props = {
		/** `background` = bg + beside; `portrait` = header overlay (render after board). */
		layer?: 'background' | 'portrait';
	};

	const { layer = 'background' }: Props = $props();

	const context = getContext();

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const gameType = $derived(stateGame.gameType);
	const show = $derived(gameType === 'basegame' || gameType === 'freeSpins');
	const dekaLayout = $derived(getDekaLayout(canvas, mainLayout, layoutType, gameType));
	const showDeka = $derived(show && dekaLayout !== null);
	const isHeader = $derived(dekaLayout?.mode === 'header');
	const isBeside = $derived(dekaLayout?.mode === 'beside');

	const renderBackground = $derived(layer === 'background');
	const renderPortrait = $derived(layer === 'portrait' && isHeader);

	const drawHeaderMask = (g: PIXI.Graphics) => {
		if (!dekaLayout) return;
		g.clear();
		const w = dekaLayout.width;
		const fullH = dekaLayout.height;
		const visibleH = fullH * dekaLayout.visibleHeightFrac;
		g.rect(-w, -fullH, w, visibleH);
		g.fill(0xffffff);
	};

	const bgLayout = $derived(getBgLayout(canvas, layoutType, gameType));
	const bgKey = $derived(getBgConfig(layoutType, gameType).key);

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
		const animActive =
			showDeka &&
			((layer === 'background' && isBeside) || (layer === 'portrait' && isHeader));
		if (!animActive) return;
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

{#if show && renderBackground}
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

		{#if showDeka && isBeside && dekaLayout}
			<Container
				x={dekaLayout.x}
				y={dekaLayout.y}
				scale={breathScale}
				filters={dekaFilters}
				eventMode="none"
			>
				<Sprite
					key="deka_v2_idle"
					anchor={dekaLayout.anchor}
					width={dekaLayout.width}
					height={dekaLayout.height}
					alpha={idleAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
				<Sprite
					key="deka_v2_blink"
					anchor={dekaLayout.anchor}
					width={dekaLayout.width}
					height={dekaLayout.height}
					alpha={blinkAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
				<Sprite
					key="deka_v2_toast"
					anchor={dekaLayout.anchor}
					width={dekaLayout.width}
					height={dekaLayout.height}
					alpha={toastAlpha}
					tint={DEKA_SPRITE_TINT}
					eventMode="none"
				/>
			</Container>
		{/if}
	</Container>
{/if}

{#if show && renderPortrait && dekaLayout}
	<Container
		zIndex={dekaLayout.zIndex}
		x={dekaLayout.x}
		y={dekaLayout.y}
		scale={breathScale * dekaLayout.layoutScale}
		filters={dekaFilters}
		eventMode="none"
	>
		<Graphics isMask={true} draw={drawHeaderMask} eventMode="none" />
		<Sprite
			key="deka_v2_idle"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={idleAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
		<Sprite
			key="deka_v2_blink"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={blinkAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
		<Sprite
			key="deka_v2_toast"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={toastAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
	</Container>
{/if}
