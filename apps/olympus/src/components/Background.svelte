<script lang="ts">
	import { Sprite, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getBgLayout, BG_FILL_COLOR } from '../game/constants';

	const context = getContext();

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	// Pure decorative scenery — cover-fits the canvas, no frame anchoring.
	// The reel frame is drawn separately by `ReelFramePanel` so the bg
	// sprite just needs to fill every pixel of the viewport.
	const bgGameType = $derived(
		context.stateGame.gameType === 'freeSpins' || context.stateGame.freeSpinIntroActive
			? 'freeSpins'
			: 'basegame',
	);

	const layout = $derived(
		getBgLayout(
			context.stateLayoutDerived.canvasSizes(),
			context.stateLayoutDerived.layoutType(),
			bgGameType,
		),
	);
</script>

<!-- Solid dark fill — visible only while the bg texture is still loading. -->
<Graphics
	zIndex={-11}
	draw={(g) => {
		g.clear();
		g.rect(0, 0, canvas.width, canvas.height);
		g.fill({ color: BG_FILL_COLOR });
	}}
/>

<Sprite
	key={layout.cfg.key}
	anchor={0.5}
	x={layout.x}
	y={layout.y}
	width={layout.width}
	height={layout.height}
	zIndex={-10}
/>
