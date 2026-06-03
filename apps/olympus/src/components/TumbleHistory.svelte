<script lang="ts" module>
	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	export type TumbleHistoryLine = TumbleBreakdownLine;

	export type EmitterEventTumbleHistory =
		| { type: 'tumbleHistoryReset' }
		| { type: 'tumbleHistoryAdd'; lines: TumbleHistoryLine[] };
</script>

<script lang="ts">
	import { Container, BitmapText, Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import { getOlympusLandscapeHudLayout } from '../game/hudLandscapeLayout';
	import type { TumbleHistoryLine as Line } from '../game/tumbleBreakdown';

	const context = getContext();

	/** Keep mult + total on one row without overlap (after icon). */
	const fitHistoryRowAmountFontSize = (
		multText: string | null,
		totalText: string,
		spaceAfterIcon: number,
		baseFontSize: number,
	) => {
		const minSize = baseFontSize * 0.52;
		const charWidthMul = 0.54;
		const gapChars = multText ? 0.4 : 0;
		const charCount = (multText?.length ?? 0) + totalText.length + gapChars;
		const estimated = charCount * baseFontSize * charWidthMul;
		if (estimated <= spaceAfterIcon) return baseFontSize;
		return Math.max(minSize, spaceAfterIcon / (charCount * charWidthMul));
	};

	const MAX_LINES = 5;
	const GOLD = 0xffd147;
	const ROW_GAP = SYMBOL_SIZE * 0.38;
	const ICON_SIZE = SYMBOL_SIZE * 0.32;
	const FONT_COUNT = SYMBOL_SIZE * 0.2;
	const FONT_AMOUNT = SYMBOL_SIZE * 0.17;
	const DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	let lines: TumbleHistoryLine[] = $state([]);
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const isLandscape = $derived(layoutType === 'landscape');
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const isCompact = $derived(['portrait', 'tablet'].includes(layoutType));
	const visibleLines = $derived(
		isLandscape ? lines : isCompact ? lines.slice(-3) : lines,
	);
	const show = $derived(visibleLines.length > 0);

	const landscapeLayout = $derived(
		isLandscape
			? getOlympusLandscapeHudLayout({
					stateLayoutDerived: context.stateLayoutDerived,
					stateGameDerived: context.stateGameDerived,
				})
			: null,
	);

	const landscapeMetrics = $derived.by(() => {
		if (!landscapeLayout) return null;
		const w = landscapeLayout.leftColumnWidth;
		const h = landscapeLayout.historyPanelHeight;
		const innerPadLeft = w * 0.11;
		const innerPadRight = w * 0.11;
		const innerPadBottom = h * 0.1;
		const iconSize = w * 0.17;
		const rowGap = w * 0.045;
		return {
			panelWidth: w,
			panelHeight: h,
			innerPadLeft,
			innerPadRight,
			innerPadBottom,
			innerRowWidth: w - innerPadLeft - innerPadRight,
			iconSize,
			rowStride: iconSize + rowGap,
			fontCount: w * 0.095,
			fontAmount: w * 0.082,
			iconGap: 6,
			multGap: 6,
			countInset: 8,
			countSlot: w * 0.07,
		};
	});

	const position = $derived.by(() => {
		if (isLandscape && landscapeLayout) {
			return {
				x: landscapeLayout.tumbleHistoryX,
				y: landscapeLayout.tumbleHistoryY,
			};
		}
		if (isCompact) {
			return {
				x: BOARD_SIZES.width / 2,
				y: -SYMBOL_SIZE * 0.35,
			};
		}
		return {
			x: SYMBOL_SIZE * 0.5,
			y: isFreeSpins ? DESKTOP_Y_FREE_SPINS : DESKTOP_Y_BASE,
		};
	});

	context.eventEmitter.subscribeOnMount({
		tumbleHistoryReset: () => {
			lines = [];
		},
		tumbleHistoryAdd: (event) => {
			lines = [...lines, ...event.lines].slice(-MAX_LINES);
		},
	});
</script>

{#snippet historyRowLandscape(
	line: Line,
	rowY: number,
	rowIndex: number,
	metrics: {
		innerRowWidth: number;
		iconSize: number;
		fontCount: number;
		fontAmount: number;
		iconGap: number;
		multGap: number;
		countInset: number;
		countSlot: number;
	},
)}
	{@const iconCenterX =
		metrics.countInset + metrics.countSlot + metrics.iconGap + metrics.iconSize / 2}
	{@const multX =
		metrics.countInset + metrics.countSlot + metrics.iconGap + metrics.iconSize + metrics.multGap}
	{@const totalText = bookEventAmountToCurrencyString(line.amount)}
	{@const multText = line.spotMult > 1 ? `*${line.spotMult}` : null}
	{@const amountFontSize = fitHistoryRowAmountFontSize(
		multText,
		totalText,
		metrics.innerRowWidth - multX - 8,
		metrics.fontAmount,
	)}
	<Container x={0} y={rowY}>
		<Text
			anchor={{ x: 0, y: 0.5 }}
			x={metrics.countInset}
			y={0}
			text={`${line.count}`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: metrics.fontCount,
				fill: 0xffffff,
				fontWeight: '900',
			}}
		/>
		<UiAssetSprite
			key={`history_${line.symbol}_${rowIndex}`}
			assetKey={`sym_${line.symbol.toLowerCase()}`}
			anchor={0.5}
			x={iconCenterX}
			y={0}
			width={metrics.iconSize}
			height={metrics.iconSize}
		/>
		{#if multText}
			<Text
				anchor={{ x: 0, y: 0.5 }}
				x={multX}
				y={0}
				text={multText}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: amountFontSize,
					fill: 0xfff0b8,
					fontWeight: '900',
				}}
			/>
		{/if}
		<Text
			anchor={{ x: 1, y: 0.5 }}
			x={metrics.innerRowWidth}
			y={0}
			text={totalText}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: amountFontSize,
				fill: 0xfff0b8,
				fontWeight: '900',
			}}
		/>
	</Container>
{/snippet}

{#snippet historyRow(
	line: Line,
	rowY: number,
	rowIndex: number,
	metrics: {
		iconSize: number;
		fontCount: number;
		fontAmount: number;
	},
)}
	<Container x={0} y={rowY}>
		<BitmapText
			anchor={{ x: 1, y: 0.5 }}
			x={-metrics.iconSize / 2 - 4}
			y={0}
			text={`${line.count}×`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: metrics.fontCount,
				fill: 0xffffff,
				fontWeight: '900',
			}}
		/>
		<UiAssetSprite
			key={`history_${line.symbol}_${rowIndex}`}
			assetKey={`sym_${line.symbol.toLowerCase()}`}
			anchor={0.5}
			x={0}
			y={0}
			width={metrics.iconSize}
			height={metrics.iconSize}
		/>
		<BitmapText
			anchor={{ x: 0, y: 0.5 }}
			x={metrics.iconSize / 2 + 4}
			y={0}
			text={`= ${bookEventAmountToCurrencyString(line.amount)}`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: metrics.fontAmount,
				fill: 0xfff0b8,
				fontWeight: '900',
			}}
		/>
	</Container>
{/snippet}

{#if isLandscape && landscapeLayout && landscapeMetrics}
	<Container x={position.x} y={position.y}>
		<UiAssetSprite
			assetKey="menu_tumble_history_panel"
			anchor={0.5}
			width={landscapeMetrics.panelWidth}
			height={landscapeMetrics.panelHeight}
		/>
		{#if show}
			<Container
				x={-landscapeMetrics.panelWidth / 2 + landscapeMetrics.innerPadLeft}
				y={landscapeMetrics.panelHeight / 2 - landscapeMetrics.innerPadBottom}
			>
				{#each visibleLines as line, index (`${line.symbol}-${line.amount}-${index}`)}
					{@render historyRowLandscape(
						line,
						-(visibleLines.length - 1 - index) * landscapeMetrics.rowStride,
						index,
						landscapeMetrics,
					)}
				{/each}
			</Container>
		{/if}
	</Container>
{:else}
	<FadeContainer {show}>
		<BoardContainer>
			<Container x={position.x} y={position.y}>
				{#each visibleLines as line, index (`${line.symbol}-${line.amount}-${index}`)}
					{@render historyRow(
						line,
						-index * ROW_GAP,
						index,
						{
							iconSize: ICON_SIZE,
							fontCount: FONT_COUNT,
							fontAmount: FONT_AMOUNT,
						},
					)}
				{/each}
			</Container>
		</BoardContainer>
	</FadeContainer>
{/if}
