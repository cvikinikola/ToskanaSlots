<script lang="ts" module>
	import * as PIXI from 'pixi.js';
	import { Graphics, type GraphicsProps, anchorToPivot } from 'pixi-svelte';
	import type { PixiPoint } from 'pixi-svelte';

	/**
	 * Decorative plate behind BALANCE / WIN / BET readouts. Same prop
	 * surface as `UiSprite` so it's a drop-in replacement, but draws a
	 * richer "viking ticker" look:
	 *   • outer dark drop-shadow halo
	 *   • dark navy fill with a subtle horizontal sheen band on top
	 *   • main gold border + thin warm inner highlight
	 *   • a small gold rivet on each short end (left & right)
	 */
	export type Props = Omit<GraphicsProps, 'pivot' | 'draw'> & {
		anchor?: PixiPoint;
		width: number;
		height: number;
		borderRadius?: number;
		backgroundColor?: PIXI.FillStyle['color'];
		backgroundAlpha?: PIXI.FillStyle['alpha'];
		borderColor?: PIXI.StrokeStyle['color'];
		borderWidth?: PIXI.StrokeStyle['width'];
		borderAlpha?: PIXI.StrokeStyle['alpha'];
	};
</script>

<script lang="ts">
	const {
		anchor,
		width,
		height,
		borderRadius,
		backgroundColor = 0x0a0c1a,
		backgroundAlpha = 0.94,
		borderColor = 0xffd147,
		borderWidth = 2.5,
		borderAlpha = 1,
		...graphicsProps
	}: Props = $props();
</script>

<Graphics
	{...graphicsProps}
	pivot={anchorToPivot({ anchor, sizes: { width, height } })}
	draw={(g) => {
		g.clear();

		const w = width;
		const h = height;
		const r = borderRadius ?? Math.min(h * 0.5, 35);

		// 1. Outer dark drop-shadow halo.
		g.roundRect(-3, -3, w + 6, h + 6, r + 3);
		g.stroke({ color: 0x05060f, alpha: 0.6, width: 4 });

		// 2. Dark plate fill.
		g.roundRect(0, 0, w, h, r);
		g.fill({ color: backgroundColor, alpha: backgroundAlpha });

		// 3. Subtle metallic sheen on the upper third.
		g.roundRect(3, 3, w - 6, Math.max(6, h * 0.42), Math.max(0, r - 3));
		g.fill({ color: 0xffffff, alpha: 0.05 });

		// 4. Main gold border.
		g.roundRect(0, 0, w, h, r);
		g.stroke({ color: borderColor, width: borderWidth, alpha: borderAlpha });

		// 5. Inner warm highlight stroke.
		const inset = Math.max(4, borderWidth + 2);
		g.roundRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(0, r - inset));
		g.stroke({ color: 0xffe6a8, width: 1, alpha: 0.5 });

		// 6. End-cap rivets on the short edges (left & right, vertically centred).
		const rivetR = Math.max(2.4, h * 0.075);
		const rivetX = Math.max(rivetR * 2.4, r * 0.55);
		const rivetY = h / 2;
		for (const cx of [rivetX, w - rivetX]) {
			g.circle(cx, rivetY, rivetR + 1);
			g.fill({ color: borderColor, alpha: 0.95 });
			g.circle(cx, rivetY, rivetR);
			g.fill({ color: 0x1a1208, alpha: 0.95 });
			g.circle(cx - rivetR * 0.35, rivetY - rivetR * 0.35, rivetR * 0.32);
			g.fill({ color: 0xffe6a8, alpha: 0.7 });
		}
	}}
/>
