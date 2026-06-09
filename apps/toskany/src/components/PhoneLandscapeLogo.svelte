<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getFrameAnchoredLogoLayout, getReelFrameCanvasRect } from '../game/backgroundCharacter';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	const layout = $derived.by(() => {
		const layoutType = context.stateLayoutDerived.layoutType();
		if (layoutType !== 'landscape') return null;
		const frame = getReelFrameCanvasRect(
			context.stateLayoutDerived.canvasSizes(),
			context.stateLayoutDerived.mainLayout(),
			layoutType,
		);
		return getFrameAnchoredLogoLayout(frame);
	});

	const logoKey = $derived(stateGame.gameType === 'freeSpins' ? 'logo_day' : 'logo');
</script>

{#if layout}
	<Sprite
		key={logoKey}
		anchor={{ x: 0, y: 0 }}
		x={layout.x}
		y={layout.y}
		width={layout.width}
		height={layout.height}
	/>
{/if}
