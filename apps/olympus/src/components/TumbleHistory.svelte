<script lang="ts" module>
	import type { SymbolName } from '../game/types';

	export type TumbleHistoryLine = {
		count: number;
		symbol: SymbolName;
		amount: number;
	};

	export type EmitterEventTumbleHistory =
		| { type: 'tumbleHistoryReset' }
		| { type: 'tumbleHistoryAdd'; lines: TumbleHistoryLine[] };
</script>

<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES, SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const MAX_LINES = 5;
	const PANEL_W = SYMBOL_SIZE * 2.95;
	const PANEL_H = SYMBOL_SIZE * 2.85;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.34;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.25;
	const PANEL_GAP = SYMBOL_SIZE * 0.18;
	const ROW_GAP = SYMBOL_SIZE * 0.41;
	const ROW_GAP_STACKED = SYMBOL_SIZE * 0.26;
	const ICON_SIZE = SYMBOL_SIZE * 0.28;
	const FREE_SPINS_COUNTER_SPACE = SYMBOL_SIZE * 1.82;

	let lines: TumbleHistoryLine[] = $state([]);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const isStacked = $derived(context.stateLayoutDerived.isStacked());
	const visibleLines = $derived(isStacked ? lines.slice(-3) : lines);

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	const position = $derived.by(() => {
		if (isStacked) {
			return {
				x: BOARD_SIZES.width / 2 - PANEL_W_STACKED / 2,
				y: frameBounds.top - PANEL_H_STACKED - SYMBOL_SIZE * 0.08,
			};
		}

		return {
			x: frameBounds.left - PANEL_W - PANEL_GAP,
			y: frameBounds.top + SYMBOL_SIZE * 0.52 + (isFreeSpins ? FREE_SPINS_COUNTER_SPACE : 0),
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

<BoardContainer>
	<Container {...position}>
		<UiAssetSprite
			key="menu_frame_free_spins"
			assetKey="menu_frame_free_spins"
			anchor={{ x: 0, y: 0 }}
			width={isStacked ? PANEL_W_STACKED : PANEL_W}
			height={isStacked ? PANEL_H_STACKED : PANEL_H}
			alpha={0.94}
		/>

		<BitmapText
			anchor={{ x: 0.5, y: 0.5 }}
			x={(isStacked ? PANEL_W_STACKED : PANEL_W) / 2}
			y={(isStacked ? PANEL_H_STACKED : PANEL_H) * (isStacked ? 0.24 : 0.2)}
			text="TUMBLE HISTORY"
			style={{
				fontFamily: 'proxima-nova',
				fontSize: SYMBOL_SIZE * (isStacked ? 0.12 : 0.15),
				fill: 0xffd147,
				fontWeight: '900',
			}}
		/>

		{#each visibleLines as line, index (`${line.symbol}-${line.count}-${line.amount}-${index}`)}
			{@const panelH = isStacked ? PANEL_H_STACKED : PANEL_H}
			{@const rowGap = isStacked ? ROW_GAP_STACKED : ROW_GAP}
			{@const rowY = panelH * (isStacked ? 0.78 : 0.78) - (visibleLines.length - 1 - index) * rowGap}

			<BitmapText
				anchor={{ x: 1, y: 0.5 }}
				x={SYMBOL_SIZE * (isStacked ? 0.72 : 0.64)}
				y={rowY}
					text={`${line.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isStacked ? 0.13 : 0.18),
						fill: 0xffffff,
						fontWeight: '900',
					}}
			/>

			<UiAssetSprite
				key={`history_${line.symbol.toLowerCase()}_${index}`}
				assetKey={`sym_${line.symbol.toLowerCase()}`}
				anchor={0.5}
				x={SYMBOL_SIZE * (isStacked ? 0.92 : 0.88)}
				y={rowY}
				width={ICON_SIZE * (isStacked ? 0.72 : 1)}
				height={ICON_SIZE * (isStacked ? 0.72 : 1)}
			/>

			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={SYMBOL_SIZE * (isStacked ? 1.08 : 1.08)}
				y={rowY}
					text={`= ${bookEventAmountToCurrencyString(line.amount)}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isStacked ? 0.13 : 0.17),
						fill: 0xfff0b8,
						fontWeight: '900',
					}}
			/>
		{/each}
	</Container>
</BoardContainer>
