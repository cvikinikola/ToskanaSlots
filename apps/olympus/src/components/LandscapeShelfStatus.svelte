<script lang="ts">
	import { stateUi } from 'state-shared';
	import { Container, Text } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite, portraitUiRuntime } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { getOlympusLandscapeHudLayout } from '../game/hudLandscapeLayout';
	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	/** Same gold as BALANCE / WIN / BET values (UiLabel). */
	const TEXT_FILL = 0xffe79a;

	const context = getContext();

	const layout = $derived(getOlympusLandscapeHudLayout(context));
	const isLandscape = $derived(context.stateLayoutDerived.layoutType() === 'landscape');
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');

	let winLine: TumbleBreakdownLine | null = $state(null);
	let showWin = $state(false);

	const showFreeSpinsLeft = $derived(
		isLandscape &&
			isFreeSpins &&
			!showWin &&
			stateUi.freeSpinCounterShow &&
			stateUi.freeSpinCounterTotal > 0,
	);

	const freeSpinsLeft = $derived(
		Math.max(0, stateUi.freeSpinCounterTotal - stateUi.freeSpinCounterCurrent),
	);

	const shelfMetrics = $derived.by(() => {
		const shelfW = layout.shelfInfoWidth;
		const shelfH = layout.bottomBarIconSide;
		return { shelfW, shelfH };
	});

	const textStyle = (fontSize: number) => ({
		fontFamily: 'proxima-nova',
		fontSize,
		fill: TEXT_FILL,
		fontWeight: '900' as const,
	});

	const fitFontSize = (text: string, maxWidth: number, baseSize: number) => {
		const minSize = baseSize * 0.55;
		const estimated = text.length * baseSize * 0.5;
		if (estimated <= maxWidth) return baseSize;
		return Math.max(minSize, maxWidth / (Math.max(1, text.length) * 0.5));
	};

	/** Sugar Rush style: 6X [icon] PAYS $2.00 x 6 = $12.00 */
	const layoutWinPill = (line: TumbleBreakdownLine) => {
		const { shelfW, shelfH } = shelfMetrics;
		const hasMult = line.spotMult > 1;
		const countText = `${line.count}X`;
		const baseStr = bookEventAmountToCurrencyString(line.baseAmount);
		const totalStr = bookEventAmountToCurrencyString(line.amount);
		const paysText = hasMult
			? `PAYS ${baseStr} x ${line.spotMult} = ${totalStr}`
			: `PAYS ${totalStr}`;

		const gap = 5;
		const maxInnerW = shelfW;
		let fontSize =
			portraitUiRuntime.plateValueFontSize > 0
				? portraitUiRuntime.plateValueFontSize * 0.92
				: shelfH * 0.36;
		const iconSize = () => fontSize * 1.05;

		const estimateW = () =>
			countText.length * fontSize * 0.48 +
			gap +
			iconSize() +
			gap +
			paysText.length * fontSize * 0.48;

		while (estimateW() > maxInnerW && fontSize > shelfH * 0.28) {
			fontSize *= 0.94;
		}

		fontSize = fitFontSize(countText + paysText, maxInnerW - iconSize() - gap * 2, fontSize);

		const countW = countText.length * fontSize * 0.48;
		const paysW = paysText.length * fontSize * 0.48;
		const icon = iconSize();
		const innerW = countW + gap + icon + gap + paysW;
		const startX = -innerW / 2;

		return {
			countText,
			paysText,
			fontSize,
			iconSize: icon,
			countX: startX,
			iconX: startX + countW + gap + icon / 2,
			paysX: startX + countW + gap + icon + gap,
		};
	};

	context.eventEmitter.subscribeOnMount({
		tumbleWinBreakdownShow: (event) => {
			const line = event.lines[event.lines.length - 1];
			if (line) {
				winLine = line;
				showWin = true;
			} else {
				winLine = null;
				showWin = false;
			}
		},
		tumbleWinAmountReset: () => {
			showWin = false;
			winLine = null;
		},
		tumbleWinAmountHide: () => {
			showWin = false;
			winLine = null;
		},
	});
</script>

{#if isLandscape}
	<Container x={layout.shelfInfoCenterX} y={layout.yBottomBarIcons}>
		<FadeContainer show={showWin && winLine !== null}>
			{#if winLine}
				{@const row = layoutWinPill(winLine)}
				<Container y={0}>
					<Text
						anchor={{ x: 0, y: 0.5 }}
						x={row.countX}
						y={0}
						text={row.countText}
						style={textStyle(row.fontSize)}
					/>
					<UiAssetSprite
						key={`shelf_${winLine.symbol}`}
						assetKey={`sym_${winLine.symbol.toLowerCase()}`}
						anchor={0.5}
						x={row.iconX}
						y={0}
						width={row.iconSize}
						height={row.iconSize}
					/>
					<Text
						anchor={{ x: 0, y: 0.5 }}
						x={row.paysX}
						y={0}
						text={row.paysText}
						style={textStyle(row.fontSize)}
					/>
				</Container>
			{/if}
		</FadeContainer>

		<FadeContainer show={showFreeSpinsLeft}>
			{@const fsText = `${freeSpinsLeft} FREE SPINS LEFT`}
			<Text
				anchor={0.5}
				x={0}
				y={0}
				text={fsText}
				style={textStyle(
					fitFontSize(fsText, shelfMetrics.shelfW, portraitUiRuntime.plateValueFontSize * 0.92),
				)}
			/>
		</FadeContainer>
	</Container>
{/if}
