<script lang="ts">
	import { Sprite, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getBgLayout, BG_FILL_COLOR } from '../game/constants';

	const context = getContext();

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const bgGameType = $derived(
		context.stateGame.gameType === 'freeSpins' || context.stateGame.freeSpinIntroActive
			? 'freeSpins'
			: 'basegame',
	);

	const layout = $derived(getBgLayout(canvas, layoutType, bgGameType));
</script>

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
