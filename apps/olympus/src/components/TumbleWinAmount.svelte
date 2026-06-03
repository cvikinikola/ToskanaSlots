<script lang="ts" module>
	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	export type TumbleWinBreakdownLine = TumbleBreakdownLine;

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
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';
	import type { TumbleWinBreakdownLine as Line } from '../game/tumbleBreakdown';

	const context = getContext();

	const GOLD = 0xffd147;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);

	const fontMain = $derived(SYMBOL_SIZE * (isCompact ? 0.34 : 0.38));
	const fontSmall = $derived(SYMBOL_SIZE * (isCompact ? 0.30 : 0.34));
	const iconSize = $derived(SYMBOL_SIZE * (isCompact ? 0.52 : 0.58));
	const lineGap = $derived(SYMBOL_SIZE * 0.54);
	const segGap = $derived(SYMBOL_SIZE * 0.12);

	let show = $state(false);
	let breakdownLines: TumbleWinBreakdownLine[] = $state([]);

	const centerX = BOARD_SIZES.width / 2;

	/** Bottom of 7×7 grid in board-local coords (pivot is board centre). */
	const gridBottom = BOARD_SIZES.height;

	/** First row centre — below grid, above menu WIN readout (in the frame gap). */
	const canvasSizeType = $derived(context.stateLayoutDerived.canvasSizeType());
	const tumbleGapScale = $derived(
		canvasSizeType === 'smallMobile' ? 0.38 : canvasSizeType === 'mobile' ? 0.42 : isCompact ? 0.45 : 0.55,
	);
	const firstRowY = $derived(gridBottom + SYMBOL_SIZE * tumbleGapScale + iconSize / 2);

	const textStyle = (size: number) => ({
		fontFamily: 'proxima-nova',
		fontSize: size,
		fill: GOLD,
		fontWeight: '900' as const,
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
			show = false;
			breakdownLines = [];
		},
		tumbleWinBreakdownShow: (emitterEvent) => {
			breakdownLines = emitterEvent.lines;
			show = true;
		},
		tumbleWinAmountUpdate: async () => {},
	});
</script>

{#snippet winRow(line: Line, rowY: number, rowIndex: number)}
	{@const hasMult = line.spotMult > 1}
	<Container x={centerX} y={rowY}>
		<BitmapText
			anchor={{ x: 1, y: 0.5 }}
			x={-iconSize / 2 - segGap}
			y={0}
			text={`${line.count}×`}
			style={textStyle(fontMain)}
		/>
		<UiAssetSprite
			key={`tumble_win_${line.symbol}_${rowIndex}`}
			assetKey={`sym_${line.symbol.toLowerCase()}`}
			anchor={0.5}
			x={0}
			y={0}
			width={iconSize}
			height={iconSize}
		/>
		<BitmapText
			anchor={{ x: 0, y: 0.5 }}
			x={iconSize / 2 + segGap}
			y={0}
			text={hasMult
				? `= ${bookEventAmountToCurrencyString(line.baseAmount)}`
				: `= ${bookEventAmountToCurrencyString(line.amount)}`}
			style={textStyle(fontSmall)}
		/>
		{#if hasMult}
			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={iconSize / 2 + segGap + fontSmall * 5.4}
				y={0}
				text={`× ${line.spotMult}`}
				style={textStyle(fontMain)}
			/>
			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={iconSize / 2 + segGap + fontSmall * 5.4 + fontMain * 2.2}
				y={0}
				text={`= ${bookEventAmountToCurrencyString(line.amount)}`}
				style={textStyle(fontSmall)}
			/>
		{/if}
	</Container>
{/snippet}

<FadeContainer {show}>
	<BoardContainer>
		{#each breakdownLines as line, index (line.symbol + line.amount + index)}
			{@render winRow(line, firstRowY + index * lineGap, index)}
		{/each}
	</BoardContainer>
</FadeContainer>
