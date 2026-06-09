<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { ColorMatrixFilter } from 'pixi.js';
	import { Container, Graphics, Sprite } from 'pixi-svelte';
	import { stateUi } from 'state-shared';

	import { stateGame } from '../game/stateGame.svelte';
	import { DEKA_BRIGHTNESS, DEKA_SPRITE_TINT } from '../game/backgroundCharacter';
	import {
		DEKA_OVERLAY_Z_INDEX,
		shouldShowDekaCharacter,
		shouldSuspendForegroundForMenu,
	} from '../game/betControlsForeground';
	import { dekaSaluteVisual } from '../game/dekaSaluteVisual.svelte';

	const visual = dekaSaluteVisual;

	const show = $derived(
		shouldShowDekaCharacter(stateGame.gameType, stateGame) &&
			visual.visible &&
			visual.layout &&
			!shouldSuspendForegroundForMenu(stateUi.menuOpen),
	);

	const dekaLayout = $derived(visual.layout);

	const drawHeaderMask = (g: PIXI.Graphics) => {
		if (!dekaLayout) return;
		g.clear();
		const w = dekaLayout.width;
		const fullH = dekaLayout.height;
		const visibleH = fullH * dekaLayout.visibleHeightFrac;
		g.rect(-w, -fullH, w, visibleH);
		g.fill(0xffffff);
	};

	const dekaFilters = (() => {
		const matrix = new ColorMatrixFilter();
		matrix.brightness(DEKA_BRIGHTNESS, false);
		return [matrix];
	})();
</script>

{#if show && dekaLayout}
	<Container
		zIndex={DEKA_OVERLAY_Z_INDEX}
		x={dekaLayout.x}
		y={dekaLayout.y}
		scale={visual.breathScale * dekaLayout.layoutScale}
		filters={dekaFilters}
		eventMode="none"
	>
		{#if visual.isHeader}
			<Graphics isMask={true} draw={drawHeaderMask} eventMode="none" />
		{/if}
		<Sprite
			key="deka_v2_idle"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={visual.idleAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
		<Sprite
			key="deka_v2_blink"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={visual.blinkAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
		<Sprite
			key="deka_v2_toast"
			anchor={dekaLayout.anchor}
			width={dekaLayout.width}
			height={dekaLayout.height}
			alpha={visual.toastAlpha}
			tint={DEKA_SPRITE_TINT}
			eventMode="none"
		/>
	</Container>
{/if}
