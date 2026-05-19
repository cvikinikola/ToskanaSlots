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

	const PANEL_W = SYMBOL_SIZE * 2.2;
	const PANEL_H = SYMBOL_SIZE * 1.4;
	const CORNER = 14;

	const position = $derived({
		x:
			context.stateGameDerived.boardLayout().x -
			context.stateGameDerived.boardLayout().width / 2 -
			PANEL_W -
			SYMBOL_SIZE * 0.3,
		y:
			context.stateGameDerived.boardLayout().y -
			context.stateGameDerived.boardLayout().height / 2,
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
					g.fill({ color: 0x0d0d1f, alpha: 0.9 });
					g.stroke({ color: 0xffd700, width: 2 });
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.1}
				text="FREE SPINS"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.2,
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
					fontSize: SYMBOL_SIZE * 0.45,
					fill: 0xffffff,
					fontWeight: '700',
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>
