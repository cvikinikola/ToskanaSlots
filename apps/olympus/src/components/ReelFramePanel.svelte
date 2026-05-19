<script lang="ts">
	import { Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, FRAME_PANEL_PAD, FRAME_PANEL_STYLE as S } from '../game/constants';

	const context = getContext();

	// Board layout in MAIN-LOCAL coords (same space we render in).
	const board = $derived(context.stateGameDerived.boardLayout());

	// Outer panel rect in board-native pixels (drawn around the symbols
	// then scaled together with the board, so the gold border stays at a
	// constant visual thickness regardless of viewport).
	const panel = $derived({
		w: BOARD_SIZES.width + FRAME_PANEL_PAD * 2,
		h: BOARD_SIZES.height + FRAME_PANEL_PAD * 2,
	});
</script>

<!--
	Ornate "royale" reel-frame:
	  • outer dark bevel ring (drop shadow)
	  • main gold border with subtle inner tint
	  • inner thin highlight stroke
	  • gold + jewel medallion at every corner
	  • small crown cartouche centred on the top edge
	Drawn purely with Graphics so it stays crisp at every viewport and
	wraps the 6×5 grid exactly. Sits behind the symbols (zIndex -1) and
	shares the board's transform via MainContainer.
-->
<Graphics
	x={board.x}
	y={board.y}
	scale={board.scale}
	zIndex={-1}
	draw={(g) => {
		g.clear();

		const { w, h } = panel;
		const hw = w / 2;
		const hh = h / 2;
		const r = S.cornerRadius;

		// 1. Outer dark bevel — soft drop-shadow ring outside the gold.
		g.roundRect(
			-hw - S.bevelOffset,
			-hh - S.bevelOffset,
			w + S.bevelOffset * 2,
			h + S.bevelOffset * 2,
			r + S.bevelOffset,
		);
		g.stroke({ color: S.bevelColor, alpha: S.bevelAlpha, width: S.bevelWidth });

		// 2. Dark interior fill — strong contrast for the symbols.
		g.roundRect(-hw, -hh, w, h, r);
		g.fill({ color: S.fillColor, alpha: S.fillAlpha });

		// 3. Subtle inner tint band (depth) just inside the border.
		g.roundRect(-hw + 3, -hh + 3, w - 6, h - 6, r - 3);
		g.stroke({ color: S.innerTintColor, alpha: S.innerTintAlpha, width: 6 });

		// 4. Main gold border.
		g.roundRect(-hw, -hh, w, h, r);
		g.stroke({ color: S.strokeColor, width: S.strokeWidth });

		// 5. Thin inner highlight border (catches the eye, royal feel).
		g.roundRect(
			-hw + S.innerStrokeInset,
			-hh + S.innerStrokeInset,
			w - S.innerStrokeInset * 2,
			h - S.innerStrokeInset * 2,
			S.innerStrokeRadius,
		);
		g.stroke({ color: S.innerStrokeColor, width: S.innerStrokeWidth });

		// 6. Corner medallions — diamond + jewel at each rounded corner.
		const cs = S.cornerOrnamentSize;
		const corners: Array<[number, number]> = [
			[-hw + r * 0.55, -hh + r * 0.55],
			[ hw - r * 0.55, -hh + r * 0.55],
			[-hw + r * 0.55,  hh - r * 0.55],
			[ hw - r * 0.55,  hh - r * 0.55],
		];
		for (const [cx, cy] of corners) {
			// Diamond plate (rotated square) — dark backing then gold face.
			g.poly([cx, cy - cs, cx + cs, cy, cx, cy + cs, cx - cs, cy]);
			g.fill({ color: S.cornerOrnamentDark });
			g.poly([
				cx, cy - cs + 2,
				cx + cs - 2, cy,
				cx, cy + cs - 2,
				cx - cs + 2, cy,
			]);
			g.fill({ color: S.cornerOrnamentColor });
			// Centre jewel.
			g.circle(cx, cy, cs * 0.34);
			g.fill({ color: S.cornerJewelColor });
			// Jewel highlight glint.
			g.circle(cx - cs * 0.12, cy - cs * 0.14, cs * 0.12);
			g.fill({ color: S.cornerJewelHighlight, alpha: 0.85 });
		}

		// 7. Crown cartouche — centred on the top edge.
		const cw = S.crownWidth;
		const ch = S.crownHeight;
		const cyTop = -hh; // sits straddling the top border
		// Dark backing plate (slightly larger).
		g.roundRect(-cw / 2 - 2, cyTop - ch / 2 - 2, cw + 4, ch + 4, ch / 2 + 2);
		g.fill({ color: S.crownDark });
		// Gold plate.
		g.roundRect(-cw / 2, cyTop - ch / 2, cw, ch, ch / 2);
		g.fill({ color: S.crownColor });
		// Three crown peaks rising above the plate.
		const peakBaseY = cyTop - ch / 2;
		const peakH = ch * 0.85;
		const peakHW = ch * 0.55;
		const peakXs = [-cw * 0.32, 0, cw * 0.32];
		for (const px of peakXs) {
			g.poly([
				px - peakHW, peakBaseY,
				px,          peakBaseY - peakH,
				px + peakHW, peakBaseY,
			]);
			g.fill({ color: S.crownColor });
			// Tiny jewel on each peak tip.
			g.circle(px, peakBaseY - peakH + 2.5, 2.4);
			g.fill({ color: S.crownJewelColor });
		}
		// Central larger jewel on the gold plate.
		g.circle(0, cyTop, ch * 0.34);
		g.fill({ color: S.crownJewelColor });
		g.circle(-ch * 0.08, cyTop - ch * 0.1, ch * 0.13);
		g.fill({ color: S.crownJewelHighlight, alpha: 0.9 });
	}}
/>
