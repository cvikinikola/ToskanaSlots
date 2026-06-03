<script lang="ts" module>
	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	export type TumbleHistoryLine = TumbleBreakdownLine;

	export type EmitterEventTumbleHistory =
		| { type: 'tumbleHistoryReset' }
		| { type: 'tumbleHistoryAdd'; lines: TumbleHistoryLine[] };
</script>

<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, SYMBOL_SIZE } from '../game/constants';
	import type { TumbleHistoryLine as Line } from '../game/tumbleBreakdown';

	const context = getContext();

	const MAX_LINES = 5;
	const GOLD = 0xffd147;
	const ROW_GAP = SYMBOL_SIZE * 0.38;
	const ICON_SIZE = SYMBOL_SIZE * 0.32;
	const FONT_COUNT = SYMBOL_SIZE * 0.2;
	const FONT_AMOUNT = SYMBOL_SIZE * 0.17;
	const DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	let lines: TumbleHistoryLine[] = $state([]);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const visibleLines = $derived(isCompact ? lines.slice(-3) : lines);
	const show = $derived(visibleLines.length > 0);

	const position = $derived.by(() => {
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

{#snippet historyRow(line: Line, rowY: number, rowIndex: number)}
	<Container x={0} y={rowY}>
		<BitmapText
			anchor={{ x: 1, y: 0.5 }}
			x={-ICON_SIZE / 2 - 6}
			y={0}
			text={`${line.count}×`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: FONT_COUNT,
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
			width={ICON_SIZE}
			height={ICON_SIZE}
		/>
		<BitmapText
			anchor={{ x: 0, y: 0.5 }}
			x={ICON_SIZE / 2 + 6}
			y={0}
			text={line.spotMult > 1
				? `= ${bookEventAmountToCurrencyString(line.amount)} (×${line.spotMult})`
				: `= ${bookEventAmountToCurrencyString(line.amount)}`}
			style={{
				fontFamily: 'proxima-nova',
				fontSize: FONT_AMOUNT,
				fill: 0xfff0b8,
				fontWeight: '900',
			}}
		/>
	</Container>
{/snippet}

<FadeContainer {show}>
	<BoardContainer>
		<Container x={position.x} y={position.y}>
			{#each visibleLines as line, index (`${line.symbol}-${line.amount}-${index}`)}
				{@render historyRow(line, -index * ROW_GAP, index)}
			{/each}
		</Container>
	</BoardContainer>
</FadeContainer>
