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
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES, SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const MAX_LINES = 5;
	const PANEL_W = SYMBOL_SIZE * 2.95;
	const PANEL_H = SYMBOL_SIZE * 2.50;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.48;
	const PANEL_FRAME_PULL_IN = SYMBOL_SIZE * 1.2;
	const ROW_GAP = SYMBOL_SIZE * 0.25;
	const ROW_GAP_STACKED = SYMBOL_SIZE * 0.31;
	const ICON_SIZE = SYMBOL_SIZE * 0.28;
	const DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	let lines: TumbleHistoryLine[] = $state([]);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const visibleLines = $derived(isCompact ? lines.slice(-3) : lines);
	const show = $derived(visibleLines.length > 0);

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		centerX: BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
	});

	const position = $derived.by(() => {
		if (isCompact) {
			const layoutType = context.stateLayoutDerived.layoutType();
			if (layoutType === 'portrait') {
				// QA 04.06.2026: na portretu TumbleWinAmount panel sedi između
				// TumbleHistory strip-a i reel okvira — TumbleHistory mora gore
				// da ne ulazi u njega. Sidri donju ivicu na fiksnom offsetu
				// iznad reel okvira, ostavljajući prostor za WIN panel + gap.
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

		return {
			x: frameBounds.left - PANEL_W + PANEL_FRAME_PULL_IN,
			y: frameBounds.top + (isFreeSpins ? DESKTOP_Y_FREE_SPINS : DESKTOP_Y_BASE),
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

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position}>
			<UiAssetSprite
				key="menu_frame_free_spins"
				assetKey="menu_frame_free_spins"
				anchor={{ x: 0, y: 0 }}
				width={isCompact ? PANEL_W_STACKED : PANEL_W}
				height={isCompact ? PANEL_H_STACKED : PANEL_H}
				alpha={0.94}
			/>

		 <BitmapText
			anchor={{ x: 0.5, y: 0.5 }}
			x={(isCompact ? PANEL_W_STACKED : PANEL_W) / 2}
			y={(isCompact ? PANEL_H_STACKED : PANEL_H) * (isCompact ? 0.24 : 0.2)}
			text="TUMBLE HISTORY"
			style={{
				fontFamily: 'proxima-nova',
				fontSize: SYMBOL_SIZE * (isCompact ? 0.145 : 0.15),
				fill: 0xffd147,
				fontWeight: '900',
			}}
		/> 

			{#each visibleLines as line, index (`${line.symbol}-${line.count}-${line.amount}-${index}`)}
				{@const panelH = isCompact ? PANEL_H_STACKED : PANEL_H}
				{@const rowGap = isCompact ? ROW_GAP_STACKED : ROW_GAP}
				{@const rowY = panelH * 0.78 - (visibleLines.length - 1 - index) * rowGap}

			<BitmapText
				anchor={{ x: 1, y: 0.5 }}
				x={SYMBOL_SIZE * (isCompact ? 0.72 : 0.64)}
				y={rowY}
					text={`${line.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.155 : 0.18),
						fill: 0xffffff,
						fontWeight: '900',
					}}
			/>

			<UiAssetSprite
				key={`history_${line.symbol.toLowerCase()}_${index}`}
				assetKey={`sym_${line.symbol.toLowerCase()}`}
				anchor={0.5}
				x={SYMBOL_SIZE * (isCompact ? 0.92 : 0.88)}
				y={rowY}
				width={ICON_SIZE * (isCompact ? 0.86 : 1)}
				height={ICON_SIZE * (isCompact ? 0.86 : 1)}
			/>

			<BitmapText
				anchor={{ x: 0, y: 0.5 }}
				x={SYMBOL_SIZE * (isCompact ? 1.08 : 1.08)}
				y={rowY}
					text={`= ${bookEventAmountToCurrencyString(line.amount)}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.155 : 0.17),
						fill: 0xfff0b8,
						fontWeight: '900',
					}}
			/>
			{/each}
		</Container>
	</BoardContainer>
</FadeContainer>
