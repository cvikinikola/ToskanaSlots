<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { Container, Graphics, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 2.45;
	const PANEL_H = SYMBOL_SIZE * 1.5;
	const CORNER = 18;

	const position = $derived({
		x:
			context.stateGameDerived.boardLayout().x -
			context.stateGameDerived.boardLayout().width / 2 -
			PANEL_W -
			SYMBOL_SIZE * 0.3,
		y: context.stateGameDerived.boardLayout().y - context.stateGameDerived.boardLayout().height / 2,
	});

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (e) => {
			if (e.current !== undefined) current = e.current;
			if (e.total !== undefined) total = e.total;
		},
	});
</script>

<FadeContainer {show}>
	<MainContainer>
		<Container {...position}>
			<Graphics
				draw={(g) => {
					g.clear();

					g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
					g.fill({ color: 0x061427, alpha: 0.94 });

					g.roundRect(7, 7, PANEL_W - 14, PANEL_H - 14, CORNER - 6);
					g.stroke({ color: 0x15365c, alpha: 0.72, width: 7 });

					g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
					g.stroke({ color: 0x4b2f08, width: 8 });

					g.roundRect(3, 3, PANEL_W - 6, PANEL_H - 6, CORNER - 3);
					g.stroke({ color: 0xd4a64a, width: 4 });

					g.roundRect(11, 11, PANEL_W - 22, PANEL_H - 22, CORNER - 9);
					g.stroke({ color: 0xffe6a8, alpha: 0.95, width: 1.4 });

					const knot = (cx: number, cy: number, cs: number) => {
						g.poly([cx, cy - cs, cx + cs, cy, cx, cy + cs, cx - cs, cy]);
						g.fill({ color: 0x3c2709 });
						g.poly([cx, cy - cs + 3, cx + cs - 3, cy, cx, cy + cs - 3, cx - cs + 3, cy]);
						g.fill({ color: 0x7a5a1f });
						g.poly([cx, cy - cs + 6, cx + cs - 6, cy, cx, cy + cs - 6, cx - cs + 6, cy]);
						g.fill({ color: 0xf4cf78 });
						g.circle(cx, cy, cs * 0.18);
						g.fill({ color: 0x45b8ff });
					};

					const cs = 11;
					knot(14, PANEL_H / 2, cs);
					knot(PANEL_W - 14, PANEL_H / 2, cs);
					knot(PANEL_W / 2, 6, cs * 0.78);
					knot(PANEL_W / 2, PANEL_H - 6, cs * 0.78);
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.1}
				text="FREE SPINS"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.19,
					fill: 0xffd700,
					fontWeight: '700',
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.62}
				text={`${current} / ${total}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.43,
					fill: 0xffffff,
					fontWeight: '700',
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>
