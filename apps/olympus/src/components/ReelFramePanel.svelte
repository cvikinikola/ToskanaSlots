<script lang="ts">
	import { Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { BOARD_SIZES, FRAME_PANEL_PAD, FRAME_PANEL_STYLE as S } from '../game/constants';

	const context = getContext();

	const board = $derived(context.stateGameDerived.boardLayout());

	const panel = $derived({
		w: BOARD_SIZES.width + FRAME_PANEL_PAD * 2,
		h: BOARD_SIZES.height + FRAME_PANEL_PAD * 2,
	});
</script>

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

		g.roundRect(
			-hw - S.bevelOffset,
			-hh - S.bevelOffset,
			w + S.bevelOffset * 2,
			h + S.bevelOffset * 2,
			r + S.bevelOffset,
		);
		g.stroke({ color: S.bevelColor, alpha: S.bevelAlpha, width: S.bevelWidth });

		g.roundRect(-hw, -hh, w, h, r);
		g.fill({ color: 0x061427, alpha: 0.88 });

		g.roundRect(-hw + 10, -hh + 10, w - 20, h - 20, r - 8);
		g.stroke({ color: 0x15365c, alpha: 0.72, width: 12 });

		g.roundRect(-hw + 22, -hh + 22, w - 44, h - 44, r - 14);
		g.stroke({ color: 0x07101f, alpha: 0.55, width: 18 });

		g.roundRect(-hw, -hh, w, h, r);
		g.stroke({ color: S.cornerOrnamentDark, width: 10 });

		g.roundRect(-hw + 4, -hh + 4, w - 8, h - 8, r - 4);
		g.stroke({ color: S.strokeColor, width: 5 });

		g.roundRect(
			-hw + S.innerStrokeInset + 4,
			-hh + S.innerStrokeInset + 4,
			w - (S.innerStrokeInset + 4) * 2,
			h - (S.innerStrokeInset + 4) * 2,
			S.innerStrokeRadius,
		);
		g.stroke({ color: S.innerStrokeColor, width: S.innerStrokeWidth });

		const drawKnot = (cx: number, cy: number, cs: number) => {
			g.poly([cx, cy - cs, cx + cs, cy, cx, cy + cs, cx - cs, cy]);
			g.fill({ color: 0x3c2709 });
			g.poly([cx, cy - cs + 3, cx + cs - 3, cy, cx, cy + cs - 3, cx - cs + 3, cy]);
			g.fill({ color: S.cornerOrnamentDark });
			g.poly([cx, cy - cs + 7, cx + cs - 7, cy, cx, cy + cs - 7, cx - cs + 7, cy]);
			g.fill({ color: S.cornerOrnamentColor });
			g.circle(cx, cy, cs * 0.22);
			g.fill({ color: 0x45b8ff });
			g.circle(cx - cs * 0.08, cy - cs * 0.1, cs * 0.08);
			g.fill({ color: 0xe6faff, alpha: 0.9 });
		};

		const cornerSize = S.cornerOrnamentSize;
		const edgeSize = S.cornerOrnamentSize * 0.78;
		const knots: Array<[number, number, number]> = [
			[-hw + r * 0.55, -hh + r * 0.55, cornerSize],
			[hw - r * 0.55, -hh + r * 0.55, cornerSize],
			[-hw + r * 0.55, hh - r * 0.55, cornerSize],
			[hw - r * 0.55, hh - r * 0.55, cornerSize],
			[0, -hh + 5, edgeSize],
			[0, hh - 5, edgeSize],
			[-hw + 5, 0, edgeSize],
			[hw - 5, 0, edgeSize],
		];

		for (const [cx, cy, cs] of knots) drawKnot(cx, cy, cs);
	}}
/>
