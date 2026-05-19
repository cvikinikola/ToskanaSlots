<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Graphics, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 5.5;
	const PANEL_H = SYMBOL_SIZE * 3.5;
	const CORNER = 20;

	let show = $state(false);
	const countUpAmount = new Tween(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			countUpAmount.set(0, { duration: 0 });
		},

		freeSpinOutroHide: () => (show = false),

		freeSpinOutroCountUp: async (e) => {
			if (countUpAmount.target === e.amount) return;
			await countUpAmount.set(e.amount, { duration: e.winLevelData.presentDuration });
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.75} />

	<MainContainer>
				<Container
					x={context.stateLayoutDerived.mainLayout().width / 2}
					y={context.stateLayoutDerived.mainLayout().height / 2}
					pivot={{ x: PANEL_W / 2, y: PANEL_H / 2 }}
				>
					<Graphics
						draw={(g) => {
							g.clear();
							g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
							g.fill({ color: 0x0d0d1f, alpha: 0.95 });
							g.stroke({ color: 0xffd700, width: 3 });
						}}
					/>

					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						x={PANEL_W / 2}
						y={PANEL_H * 0.3}
						text="FREE SPINS COMPLETE!"
						style={{
							fontFamily: 'proxima-nova',
							fontSize: SYMBOL_SIZE * 0.38,
							fill: 0xffd700,
							fontWeight: '700',
						}}
					/>

					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						x={PANEL_W / 2}
						y={PANEL_H * 0.65}
						text={`YOU WON ${bookEventAmountToCurrencyString(countUpAmount.current)}`}
						style={{
							fontFamily: 'proxima-nova',
							fontSize: SYMBOL_SIZE * 0.48,
							fill: 0xffffff,
							fontWeight: '700',
						}}
					/>
				</Container>
	</MainContainer>
</FadeContainer>
