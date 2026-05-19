<script lang="ts">
	import { Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOTTOM_UI_FRAC } from '../game/constants';

	const context = getContext();

	const canvas = $derived(context.stateLayoutDerived.canvasSizes());

	/**
	 * Soft black gradient strip across the bottom of the canvas.
	 * Hides the decorative (non-functional) UI bar that is painted into
	 * the AI-rendered Castle of Valhalla bg.png so that the real Stake SDK
	 * UI sits on a clean dark surface.
	 */
	// Fraction of canvas height covered by the mask (0 = none, 1 = whole canvas).
	// Shared with `getBgLayout` so the painted bg never sits underneath the UI.
	const COVER_FRACTION = BOTTOM_UI_FRAC;
	// Soft fade height at the top of the mask
	const FADE_FRACTION = 0.06;
</script>

<Graphics
	zIndex={-2}
	draw={(g) => {
		g.clear();
		const w = canvas.width;
		const h = canvas.height;
		const stripH = h * COVER_FRACTION;
		const fadeH = h * FADE_FRACTION;
		const top = h - stripH;

		// Soft fade from transparent to dark stone (12 bands)
		const bands = 12;
		for (let i = 0; i < bands; i++) {
			const y = top + (fadeH * i) / bands;
			const a = (i / bands) * 0.85;
			g.rect(0, y, w, fadeH / bands + 1);
			g.fill({ color: 0x05030a, alpha: a });
		}

		// Solid bottom block (slightly transparent so castle stone shows through)
		g.rect(0, top + fadeH, w, stripH - fadeH);
		g.fill({ color: 0x05030a, alpha: 0.86 });
	}}
/>
