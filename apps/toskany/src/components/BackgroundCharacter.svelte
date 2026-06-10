<script lang="ts" module>
	export type EmitterEventBackgroundCharacter = { type: 'dekaSalute' };
</script>

<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { ColorMatrixFilter } from 'pixi.js';
	import { Container, Graphics, Sprite } from 'pixi-svelte';

	import { stateUi } from 'state-shared';
	import { getContext } from '../game/context';
	import { getBgConfig, getBgLayout } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';
	import {
		DEKA_BRIGHTNESS,
		DEKA_SPRITE_TINT,
		getDekaLayout,
	} from '../game/backgroundCharacter';
	import { applyDekaBlackBackgroundCutoutToAssets } from '../game/dekaTextureCutout';
	import { startBackgroundCharacterAnim, type DekaAnimController } from '../game/backgroundCharacterAnim';
	import { dekaSaluteVisual } from '../game/dekaSaluteVisual.svelte';
	import { shouldShowDekaCharacter, shouldSuspendForegroundForMenu, readBetControlsSuppressState } from '../game/betControlsForeground';

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
		applyDekaBlackBackgroundCutoutToAssets(assets, DEKA_TEXTURE_KEYS);
	});

	let breathScale = $state(1);
	let idleAlpha = $state(1);
	let blinkAlpha = $state(0);
	let toastAlpha = $state(0);
	let saluteActive = $state(false);
	let animController: DekaAnimController | null = null;

	const menuForegroundSuspended = $derived(shouldSuspendForegroundForMenu(stateUi.menuOpen));
	const menuBarChromeVisible = $derived(
		stateUi.pixiMenuBarVisible &&
			!stateGame.freeSpinIntroActive &&
			!stateGame.freeSpinOutroActive &&
			!stateGame.transitionActive,
	);

	const renderDekaAnim = $derived(
		showDeka &&
			menuBarChromeVisible &&
			((layer === 'background' && isBeside) || (layer === 'portrait' && isHeader)),
	);
	const dekaCharacterVisible = $derived(
		shouldShowDekaCharacter(gameType, readBetControlsSuppressState(stateGame)),
	);
	const showBesideInBackground = $derived(
		renderDekaAnim &&
			dekaCharacterVisible &&
			isBeside &&
			!menuForegroundSuspended &&
			layer === 'background' &&
			dekaLayout,
	);
	const showDekaInPlace = $derived(
		renderDekaAnim && !saluteActive && isHeader && dekaCharacterVisible,
	);

	$effect(() => {
		if (!renderDekaAnim) {
			animController = null;
			return;
		}
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
			setSaluteActive: (active) => {
				saluteActive = active;
			},
		});
		animController = controller;
		return () => {
			controller.stop();
			if (animController === controller) animController = null;
		};
	});

	$effect(() => {
		if (!renderDekaAnim) return;
		const overlayVisible =
			dekaCharacterVisible && (isBeside || saluteActive) && !menuForegroundSuspended;
		dekaSaluteVisual.visible = overlayVisible;
		dekaSaluteVisual.layout = overlayVisible ? dekaLayout : null;
		dekaSaluteVisual.isHeader = isHeader;
		dekaSaluteVisual.breathScale = breathScale;
		dekaSaluteVisual.idleAlpha = idleAlpha;
		dekaSaluteVisual.blinkAlpha = blinkAlpha;
		dekaSaluteVisual.toastAlpha = toastAlpha;
	});

	$effect(() => {
		if (!renderDekaAnim) return;
		return () => {
			dekaSaluteVisual.visible = false;
			dekaSaluteVisual.layout = null;
		};
	});

	context.eventEmitter.subscribeOnMount({
		dekaSalute: () => {
			animController?.triggerSalute();
		},
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
	</Container>
{/if}

{#if showBesideInBackground && dekaLayout}
	<Container
		zIndex={dekaLayout.zIndex}
		x={dekaLayout.x}
		y={dekaLayout.y}
		scale={breathScale * dekaLayout.layoutScale}
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

{#if show && renderPortrait && showDekaInPlace && dekaLayout}
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
