<script lang="ts" module>
	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| { type: 'tumbleWinAmountUpdate'; amount: number; animate: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, Graphics, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { SECOND } from 'constants-shared/time';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 2.4;
	const PANEL_H = SYMBOL_SIZE * 0.55;
	const CORNER = 12;

	/**
	 * Centered horizontally on the board, positioned BELOW the bottom of the
	 * reel frame (in the gap between the frame and the bottom UI strip).
	 * Lives inside <BoardContainer/> so it always scales with the board and
	 * never drifts behind/above the frame at any viewport size.
	 */
	const position = $derived({
		x: BOARD_SIZES.width / 2 - PANEL_W / 2,
		y: BOARD_SIZES.height + SYMBOL_SIZE * 0.35,
	});

	let show = $state(false);
	const countUpAmount = new Tween(0);

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => (show = true),

		tumbleWinAmountHide: () => (show = false),

		tumbleWinAmountReset: () => {
			countUpAmount.set(0, { duration: 0 });
		},

		tumbleWinAmountUpdate: async (emitterEvent) => {
			if (countUpAmount.target === emitterEvent.amount) return;
			const duration = emitterEvent.animate ? 0.8 * SECOND : 0;
			await countUpAmount.set(emitterEvent.amount, { duration });
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position}>
			<!-- Panel background -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
					g.fill({ color: 0x0a0c1a, alpha: 0.85 });
					g.stroke({ color: 0xd4a64a, width: 2 });
				}}
			/>

			<!-- Label -->
			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={SYMBOL_SIZE * 0.18}
				y={PANEL_H / 2}
				text="TUMBLE WIN"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.16,
					fill: 0xccaa44,
					fontWeight: '600',
				}}
			/>

			<!-- Amount -->
			<BitmapText
				anchor={{ x: 1, y: 0.5 }}
				x={PANEL_W - SYMBOL_SIZE * 0.18}
				y={PANEL_H / 2}
				text={bookEventAmountToCurrencyString(countUpAmount.current)}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.28,
					fill: 0xffd700,
					fontWeight: '700',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
