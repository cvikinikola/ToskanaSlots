<script lang="ts" module>
	export type { TumbleBreakdownLine as TumbleHistoryLine } from '../game/tumbleBreakdown';

	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	export type EmitterEventTumbleHistory =
		| { type: 'tumbleHistoryReset' }
		| { type: 'tumbleHistoryAdd'; lines: TumbleBreakdownLine[] };
</script>

<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES, SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const MAX_ENTRIES = 6;
	/** Tall panel — landscape / desktop (slika 2). */
	const PANEL_W = SYMBOL_SIZE * 2.95;
	const PANEL_H = SYMBOL_SIZE * 2.5;
	/** Wide strip — portrait / tablet (slika 1). */
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.48;
	const PANEL_FRAME_GAP = SYMBOL_SIZE * 0.12;
	const DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	/**
	 * Portrait 2×3 FIFO slot order (1 = bottom-left … 6 = top-right).
	 * `lines[i]` maps to slot i after rolling slice(-6).
	 */
	const PORTRAIT_SLOTS = [
		{ col: 0, row: 2 },
		{ col: 1, row: 2 },
		{ col: 0, row: 1 },
		{ col: 1, row: 1 },
		{ col: 0, row: 0 },
		{ col: 1, row: 0 },
	] as const;

	let lines: TumbleBreakdownLine[] = $state([]);

	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	/** Slika 1 — wide portal iznad reela. */
	const isPortraitGrid = $derived(layoutType === 'portrait' || layoutType === 'tablet');
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const show = $derived(lines.length > 0);

	/** Blago veći tekst/ikone na većim ekranima — oba layouta. */
	const textScale = $derived.by(() => {
		switch (layoutType) {
			case 'portrait':
				return 1.14;
			case 'tablet':
				return 1.12;
			case 'landscape':
				return 1.13;
			case 'desktop':
				return 1.18;
			default:
				return 1.1;
		}
	});

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		centerX: BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	const position = $derived.by(() => {
		if (isPortraitGrid) {
			if (layoutType === 'portrait') {
				const WIN_PANEL_H = SYMBOL_SIZE * 1.08;
				const GAP = SYMBOL_SIZE * 0.18;
				const bottomY = frameBounds.top - WIN_PANEL_H - GAP;
				return {
					x: frameBounds.centerX - PANEL_W_STACKED / 2,
					y: bottomY - PANEL_H_STACKED,
				};
			}
			const rowCenterY = frameBounds.top - SYMBOL_SIZE * 0.22;
			return {
				x: frameBounds.centerX - PANEL_W_STACKED / 2,
				y: rowCenterY - PANEL_H_STACKED / 2,
			};
		}

		const y =
			frameBounds.top +
			(isFreeSpins ? DESKTOP_Y_FREE_SPINS : DESKTOP_Y_BASE) -
			SYMBOL_SIZE * 0.14;
		return {
			x: frameBounds.left - PANEL_W - PANEL_FRAME_GAP,
			y,
		};
	});

	const panelW = $derived(isPortraitGrid ? PANEL_W_STACKED : PANEL_W);
	const panelH = $derived(isPortraitGrid ? PANEL_H_STACKED : PANEL_H);

	type EntryLayout = {
		line: TumbleBreakdownLine;
		countX: number;
		iconX: number;
		multX: number;
		amountX: number;
		y: number;
		iconSize: number;
		fontSize: number;
		amountAnchor: { x: number; y: number };
	};

	const entryLayouts = $derived.by((): EntryLayout[] => {
		if (isPortraitGrid) {
			const gridTop = panelH * 0.34;
			const gridBottom = panelH * 0.77;
			const gridLeft = panelW * 0.05;
			const gridRight = panelW * 0.95;
			const cellW = (gridRight - gridLeft) / 2;
			const cellH = (gridBottom - gridTop) / 3;
			const iconSize = SYMBOL_SIZE * 0.29 * textScale;
			const fontSize = SYMBOL_SIZE * 0.138 * textScale;

			return lines.map((line, index) => {
				const slot = PORTRAIT_SLOTS[index];
				const cellLeft = gridLeft + cellW * slot.col;
				const cellY = gridTop + cellH * slot.row + cellH * 0.5;

				// Levo: 5x + ikona (+ xN uz ikonu). Desno u ćeliji: = iznos (veći razmak kad nema mult).
				const clusterLeft = cellLeft + cellW * 0.04;
				const countEnd = clusterLeft + fontSize * 1.55;
				const amountX = cellLeft + cellW * 0.74;

				return {
					line,
					countX: clusterLeft,
					iconX: countEnd,
					multX: countEnd + iconSize * 0.95,
					amountX,
					y: cellY,
					iconSize,
					fontSize,
					amountAnchor: { x: 0.5, y: 0.5 },
				};
			});
		}

		const contentTop = panelH * 0.17;
		const contentBottom = panelH * 0.8;
		const rowH = (contentBottom - contentTop) / MAX_ENTRIES;
		const rowLeft = panelW * 0.08;
		const amountX = panelW * 0.74;
		const iconSize = SYMBOL_SIZE * 0.29 * textScale;
		const fontSize = SYMBOL_SIZE * 0.168 * textScale;
		const lineCount = lines.length;

		return lines.map((line, index) => {
			const clusterLeft = rowLeft;
			const countEnd = clusterLeft + fontSize * 1.55;
			// Prva stavka dole; svaka nova ulazi odozdo, starije idu nagore (FIFO).
			const rowIndex = MAX_ENTRIES - lineCount + index;

			return {
				line,
				countX: clusterLeft,
				iconX: countEnd,
				multX: countEnd + iconSize * 0.95,
				amountX,
				y: contentTop + rowH * rowIndex + rowH * 0.5,
				iconSize,
				fontSize,
				amountAnchor: { x: 0.5, y: 0.5 },
			};
		});
	});

	context.eventEmitter.subscribeOnMount({
		tumbleHistoryReset: () => {
			lines = [];
		},
		tumbleHistoryAdd: (event) => {
			lines = [...lines, ...event.lines].slice(-MAX_ENTRIES);
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position}>
			<UiAssetSprite
				key="menu_history_tumble"
				assetKey="menu_history_tumble"
				anchor={{ x: 0, y: 0 }}
				width={panelW}
				height={panelH}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelW / 2}
				y={panelH * (isPortraitGrid ? 0.22 : 0.12)}
				text="TUMBLE HISTORY"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * (isPortraitGrid ? 0.158 : 0.162) * textScale,
					fill: 0xffd147,
					fontWeight: '900',
				}}
			/>

			{#each entryLayouts as entry (`${entry.line.symbol}-${entry.line.count}-${entry.line.amount}-${entry.y}-${entry.countX}`)}
				{@const { line, countX, iconX, multX, amountX, y, iconSize, fontSize, amountAnchor } = entry}
				{@const totalStr = bookEventAmountToCurrencyString(line.amount)}

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={countX}
					{y}
					text={`${line.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize,
						fill: 0xffffff,
						fontWeight: '900',
					}}
				/>

				<UiAssetSprite
					key={`history_${line.symbol.toLowerCase()}_${countX}_${y}`}
					assetKey={`sym_${line.symbol.toLowerCase()}`}
					anchor={{ x: 0, y: 0.5 }}
					x={iconX}
					{y}
					width={iconSize}
					height={iconSize}
				/>

				{#if line.spotMult > 1}
					<BitmapText
						anchor={{ x: 0, y: 0.5 }}
						x={multX}
						{y}
						text={`x${line.spotMult}`}
						style={{
							fontFamily: 'proxima-nova',
							fontSize,
							fill: 0xffffff,
							fontWeight: '900',
						}}
					/>
				{/if}

				<BitmapText
					anchor={amountAnchor}
					x={amountX}
					{y}
					text={`= ${totalStr}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize,
						fill: 0xfff0b8,
						fontWeight: '900',
					}}
				/>
			{/each}
		</Container>
	</BoardContainer>
</FadeContainer>
