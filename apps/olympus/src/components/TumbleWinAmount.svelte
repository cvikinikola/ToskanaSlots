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
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 3.85;
	const PANEL_H = SYMBOL_SIZE * 1.05;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.34;
	const PANEL_H_STACKED = SYMBOL_SIZE * 0.88;
	const SYMBOL_ICON_SIZE = SYMBOL_SIZE * 0.34;

	const isStacked = $derived(context.stateLayoutDerived.isStacked());

	let show = $state(false);
	let breakdownLines: TumbleWinBreakdownLine[] = $state([]);

	const panelWidth = $derived(isStacked ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isStacked ? PANEL_H_STACKED : PANEL_H);
	const currentTumbleAmount = $derived(
		breakdownLines.reduce((total, line) => total + line.amount, 0),
	);
	const displayText = $derived.by(() => {
		if (breakdownLines.length === 0) return '';
		if (breakdownLines.length === 1) return '';
		return `WIN WIN ${bookEventAmountToCurrencyString(currentTumbleAmount)}`;
	});
	const singleWinLine = $derived(breakdownLines.length === 1 ? breakdownLines[0] : undefined);

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		bottom: BOARD_SIZES.height / 2 + REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	const position = $derived.by(() => {
		const x = BOARD_SIZES.width / 2 - panelWidth / 2;

		return {
			x,
			y: frameBounds.bottom + SYMBOL_SIZE * (isStacked ? 0.04 : 0.05),
		};
	});

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => {
			show = true;
		},

		tumbleWinAmountHide: () => {
			show = false;
			breakdownLines = [];
		},

		tumbleWinAmountReset: () => {
			breakdownLines = [];
		},

		tumbleWinBreakdownShow: (emitterEvent) => {
			breakdownLines = emitterEvent.lines;
			show = true;
		},

		tumbleWinAmountUpdate: async () => {},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position}>
			<UiAssetSprite
				key="menu_panel_md"
				assetKey="menu_panel_md"
				anchor={{ x: 0, y: 0 }}
				width={panelWidth}
				height={panelHeight}
				alpha={0.98}
			/>

			{#if singleWinLine}
				<BitmapText
					anchor={{ x: 1, y: 0.5 }}
					x={panelWidth * (isStacked ? 0.32 : 0.34)}
					y={panelHeight * 0.52}
					text={`${singleWinLine.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isStacked ? 0.16 : 0.21),
						fill: 0xffd700,
						fontWeight: '900',
					}}
				/>

				<UiAssetSprite
					key={`tumble_win_${singleWinLine.symbol.toLowerCase()}`}
					assetKey={`sym_${singleWinLine.symbol.toLowerCase()}`}
					anchor={0.5}
					x={panelWidth * (isStacked ? 0.4 : 0.42)}
					y={panelHeight * 0.52}
					width={SYMBOL_ICON_SIZE * (isStacked ? 0.82 : 1)}
					height={SYMBOL_ICON_SIZE * (isStacked ? 0.82 : 1)}
				/>

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={panelWidth * (isStacked ? 0.48 : 0.5)}
					y={panelHeight * 0.52}
					text={`Pays ${bookEventAmountToCurrencyString(singleWinLine.amount)}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isStacked ? 0.16 : 0.21),
						fill: 0xffd700,
						fontWeight: '900',
					}}
				/>
			{:else if displayText}
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					x={panelWidth / 2}
					y={panelHeight * 0.52}
					text={displayText}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isStacked ? 0.16 : 0.21),
						fill: 0xffd700,
						fontWeight: '900',
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
</FadeContainer>
