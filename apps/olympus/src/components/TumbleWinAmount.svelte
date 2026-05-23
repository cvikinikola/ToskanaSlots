<script lang="ts" module>
	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| { type: 'tumbleWinAmountUpdate'; amount: number; animate: boolean };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { SECOND } from 'constants-shared/time';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 2.4;
	const PANEL_H = SYMBOL_SIZE * 0.64;

	const isStacked = $derived(context.stateLayoutDerived.isStacked());

	/**
	 * On portrait/tablet: top-right corner, just above the reel frame top border.
	 * On desktop/landscape: centred horizontally below the board.
	 */
	const position = $derived(
		isStacked
			? {
					// Right-aligned with the board, floating above the frame top
					x: BOARD_SIZES.width - PANEL_W,
					y: -(SYMBOL_SIZE * 0.9),
				}
			: {
					x: BOARD_SIZES.width / 2 - PANEL_W / 2,
					y: BOARD_SIZES.height + SYMBOL_SIZE * 0.35,
				},
	);

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
			<UiAssetSprite
				assetKey="menu_panel_md"
				anchor={{ x: 0, y: 0 }}
				width={PANEL_W}
				height={PANEL_H}
			/>

			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={SYMBOL_SIZE * 0.24}
				y={PANEL_H / 2}
				text="TUMBLE WIN"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.14,
					fill: 0xffd147,
					fontWeight: '700',
				}}
			/>

			<BitmapText
				anchor={{ x: 1, y: 0.5 }}
				x={PANEL_W - SYMBOL_SIZE * 0.24}
				y={PANEL_H / 2}
				text={bookEventAmountToCurrencyString(countUpAmount.current)}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.25,
					fill: 0xffd700,
					fontWeight: '700',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
