<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type TumbleWinBreakdownLine = {
		count: number;
		symbol: SymbolName;
		amount: number;
	};

	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| { type: 'tumbleWinBreakdownShow'; lines: TumbleWinBreakdownLine[] }
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
	import { SYMBOL_SIZE, BOARD_SIZES, FRAME_PANEL_PAD } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 3.55;
	const PANEL_H = SYMBOL_SIZE * 0.92;

	const HEADER_Y = SYMBOL_SIZE * 0.34;
	const BREAKDOWN_Y = SYMBOL_SIZE * 0.61;
	const BREAKDOWN_ICON_SIZE = SYMBOL_SIZE * 0.22;

	const isStacked = $derived(context.stateLayoutDerived.isStacked());

	let show = $state(false);
	let breakdownLines: TumbleWinBreakdownLine[] = $state([]);

	const countUpAmount = new Tween(0);

	const position = $derived(
		isStacked
			? {
					x: BOARD_SIZES.width + FRAME_PANEL_PAD + SYMBOL_SIZE * 0.04 - PANEL_W,
					y: -PANEL_H - SYMBOL_SIZE * 0.42,
				}
			: {
					x: BOARD_SIZES.width / 2 - PANEL_W / 2,
					y: BOARD_SIZES.height + SYMBOL_SIZE * 0.32, // povecano sa 0.2 na 0.32
				},
	);

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => {
			show = true;
		},

		tumbleWinAmountHide: () => {
			show = false;
			breakdownLines = [];
		},

		tumbleWinAmountReset: () => {
			countUpAmount.set(0, { duration: 0 });
			breakdownLines = [];
		},

		tumbleWinBreakdownShow: (emitterEvent) => {
			breakdownLines = emitterEvent.lines;
			show = true;
		},

		tumbleWinAmountUpdate: async (emitterEvent) => {
			if (countUpAmount.target === emitterEvent.amount) return;

			await countUpAmount.set(emitterEvent.amount, {
				duration: emitterEvent.animate ? 0.8 * SECOND : 0,
			});
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
				alpha={0.98}
			/>

			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={SYMBOL_SIZE * 0.26}
				y={HEADER_Y}
				text="TUMBLE WIN"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.16,
					fill: 0xffd147,
					fontWeight: '900',
				}}
			/>

			<BitmapText
				anchor={{ x: 1, y: 0.5 }}
				x={PANEL_W - SYMBOL_SIZE * 0.28}
				y={HEADER_Y}
				text={bookEventAmountToCurrencyString(countUpAmount.current)}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.28,
					fill: 0xffd700,
					fontWeight: '900',
				}}
			/>

			{#if breakdownLines.length > 0}
				{@const line = breakdownLines[0]}

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={SYMBOL_SIZE * 0.96}
					y={BREAKDOWN_Y}
					text={`${line.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * 0.16,
						fill: 0xffffff,
						fontWeight: '900',
					}}
				/>

				<UiAssetSprite
					assetKey={`sym_${line.symbol.toLowerCase()}`}
					anchor={0.5}
					x={SYMBOL_SIZE * 1.44}
					y={BREAKDOWN_Y}
					width={BREAKDOWN_ICON_SIZE}
					height={BREAKDOWN_ICON_SIZE}
				/>

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={SYMBOL_SIZE * 1.70}
					y={BREAKDOWN_Y}
					text={`Pays ${bookEventAmountToCurrencyString(line.amount)}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * 0.16,
						fill: 0xfff0b8,
						fontWeight: '900',
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
</FadeContainer>
