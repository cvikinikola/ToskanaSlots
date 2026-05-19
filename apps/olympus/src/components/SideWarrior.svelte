<script lang="ts">
	import { Sprite } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_SIZES } from '../game/constants';

	const context = getContext();

	/**
	 * Thor stands on the RIGHT side of the canvas (Castle-of-Valhalla style),
	 * looming over the reels with raised Mjolnir.
	 *
	 * - Frame lives in the centred MainContainer; right edge in canvas coords
	 *   sits at `canvasW/2 + frameW/2`. Anchor Thor's left edge just past it.
	 * - Subtle vertical bob driven by requestAnimationFrame.
	 * - Hidden in stacked layouts where there is no horizontal room.
	 */
	const visible = $derived(!context.stateLayoutDerived.isStacked());
	const canvas = $derived(context.stateLayoutDerived.canvasSizes());
	const main = $derived(context.stateLayoutDerived.mainLayout());

	// SVG viewBox is 700×1100 (aspect 0.636).
	const h = $derived(canvas.height * 0.82);
	const w = $derived(h * 0.636);

	const frameW = $derived(BOARD_SIZES.width * 1.18 * main.scale);
	const frameRight = $derived(canvas.width / 2 + frameW / 2);

	// Animated breathing/bob (~4px amplitude, 2.6s period)
	let bob = $state(0);
	$effect(() => {
		let raf = 0;
		const start = performance.now();
		const tick = (t: number) => {
			bob = Math.sin(((t - start) / 2600) * Math.PI * 2) * 4;
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

{#if visible}
	<Sprite
		key="warrior"
		anchor={{ x: 0, y: 1 }}
		x={frameRight - canvas.width * 0.04}
		y={canvas.height * 0.99 + bob}
		width={w}
		height={h}
		zIndex={1}
	/>
{/if}
