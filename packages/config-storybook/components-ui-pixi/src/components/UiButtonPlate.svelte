<script lang="ts" module>
	import * as PIXI from 'pixi.js';
	import { Graphics, type GraphicsProps, anchorToPivot } from 'pixi-svelte';
	import type { PixiPoint } from 'pixi-svelte';

	/**
	 * Same props surface as `Rectangle` so this component is a drop-in
	 * replacement for `UiSprite`. It draws a richer "viking" plate:
	 *   • outer dark drop-shadow halo
	 *   • dark fill with subtle vertical highlight band
	 *   • main gold stroke + thin inner highlight stroke
	 *   • iron rivets at each corner
	 *   • small rune notch centred on the top edge
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
		borderRadius = 18,
		backgroundColor = 0x14182a,
		backgroundAlpha = 0.95,
		borderColor = 0xffd147,
		borderWidth = 2,
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
		const r = borderRadius;

		// 1. Outer dark drop-shadow halo (sits just outside the plate).
		g.roundRect(-3, -3, w + 6, h + 6, r + 3);
		g.stroke({ color: 0x05060f, alpha: 0.55, width: 4 });

		// 2. Dark plate fill.
		g.roundRect(0, 0, w, h, r);
		g.fill({ color: backgroundColor, alpha: backgroundAlpha });

		// 3. Subtle top highlight band (faux metal sheen).
		g.roundRect(2, 2, w - 4, Math.max(4, h * 0.45), Math.max(0, r - 2));
		g.fill({ color: 0xffffff, alpha: 0.04 });

		// 4. Main gold border.
		g.roundRect(0, 0, w, h, r);
		g.stroke({ color: borderColor, width: borderWidth, alpha: borderAlpha });

		// 5. Thin inner highlight border (warm light-gold).
		const inset = Math.max(3, borderWidth + 2);
		g.roundRect(inset, inset, w - inset * 2, h - inset * 2, Math.max(0, r - inset));
		g.stroke({ color: 0xffe6a8, width: 1, alpha: 0.55 });

		// 6. Iron rivets at each corner — tiny dark dot ringed by gold.
		const rivetInset = Math.max(8, r * 0.55);
		const rivetR = Math.max(2.2, Math.min(w, h) * 0.028);
		const corners: Array<[number, number]> = [
			[rivetInset, rivetInset],
			[w - rivetInset, rivetInset],
			[rivetInset, h - rivetInset],
			[w - rivetInset, h - rivetInset],
		];
		for (const [cx, cy] of corners) {
			g.circle(cx, cy, rivetR + 1);
			g.fill({ color: borderColor, alpha: 0.9 });
			g.circle(cx, cy, rivetR);
			g.fill({ color: 0x1a1208, alpha: 0.95 });
			g.circle(cx - rivetR * 0.35, cy - rivetR * 0.35, rivetR * 0.35);
			g.fill({ color: 0xffe6a8, alpha: 0.7 });
		}

		// 7. Rune notch on the top edge — two short angled gold marks.
		const notchHW = Math.min(w * 0.12, 14);
		const notchY = -1;
		const cxTop = w / 2;
		g.moveTo(cxTop - notchHW, notchY);
		g.lineTo(cxTop, notchY + 5);
		g.lineTo(cxTop + notchHW, notchY);
		g.stroke({ color: borderColor, width: 1.5, alpha: 0.85 });
	}}
/>
