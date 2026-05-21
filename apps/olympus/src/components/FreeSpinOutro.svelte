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

	// Panel sizing — responsive. On wide layouts (landscape desktop) the panel
	// is the classic ~5.5 × SYMBOL_SIZE wide; on narrow portrait/phone layouts
	// it shrinks to fit inside mainLayout so the text never overflows.
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const PANEL_W = $derived(Math.min(SYMBOL_SIZE * 5.5, layout.width * 0.88));
	const PANEL_H = $derived(Math.min(SYMBOL_SIZE * 3.5, layout.height * 0.5));
	const FONT_SCALE = $derived(PANEL_W / (SYMBOL_SIZE * 5.5));
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
			// Use a minimum 3-second count-up so the player always sees the win animate.
			// winLevelData may be undefined when winLevel 0 is sent (no entry in map).
			const duration = e.winLevelData?.presentDuration || 3000;
			await countUpAmount.set(e.amount, { duration });
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.75} />

	<MainContainer>
				<Container
					x={layout.width / 2}
					y={layout.height / 2}
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
							fontSize: SYMBOL_SIZE * 0.38 * FONT_SCALE,
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
							fontSize: SYMBOL_SIZE * 0.48 * FONT_SCALE,
							fill: 0xffffff,
							fontWeight: '700',
						}}
					/>
				</Container>
	</MainContainer>
</FadeContainer>
