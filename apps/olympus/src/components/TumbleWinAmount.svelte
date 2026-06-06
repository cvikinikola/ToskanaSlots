<script lang="ts" module>
	import type { TumbleBreakdownLine } from '../game/tumbleBreakdown';

	export type EmitterEventTumbleWinAmount =
		| { type: 'tumbleWinAmountShow' }
		| { type: 'tumbleWinAmountHide' }
		| { type: 'tumbleWinAmountReset' }
		| {
				type: 'tumbleWinBreakdownShow';
				lines: TumbleBreakdownLine[];
				multiCluster?: boolean;
		  }
		| { type: 'tumbleWinSpinRemainingShow'; remaining: number }
		| { type: 'tumbleWinSpinRemainingHide' }
		| { type: 'tumbleWinAmountUpdate'; amount: number; animate: boolean }
		| { type: 'tumbleWinAmountShowMultiplier'; multiplier: number }
		| { type: 'tumbleWinAmountHideMultiplier' }
		| { type: 'tumbleWinAmountPulse' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { formatTumbleWinPaysText } from '../game/tumbleBreakdown';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 3.85;
	const PANEL_H = SYMBOL_SIZE * 1.05;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.08;
	const GOLD = 0xffd147;
	const ROW_Y = 0.52;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	/** Turbo base game — panel se uopšte ne renderuje (free spins i dalje rade). */
	const allowPanel = $derived(!context.stateGameDerived.useTurboPacing());

	type PanelMode = 'hidden' | 'freeSpinRemaining' | 'singleCluster' | 'winner';

	let show = $state(false);
	let panelMode: PanelMode = $state('hidden');
	let freeSpinRemaining = $state(0);
	let clusterLine: TumbleBreakdownLine | undefined = $state(undefined);

	const pulseScale = new Tween(1, { duration: 0 });
	let flashAmount = $state(0);

	const panelWidth = $derived(isCompact ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isCompact ? PANEL_H_STACKED : PANEL_H);
	const visible = $derived(show && allowPanel);

	const frameBounds = $derived({
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		bottom: BOARD_SIZES.height / 2 + REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	const position = $derived.by(() => {
		const x = BOARD_SIZES.width / 2 - panelWidth / 2;
		const layoutType = context.stateLayoutDerived.layoutType();

		if (layoutType === 'portrait') {
			const GAP = SYMBOL_SIZE * 0.09;
			return { x, y: frameBounds.top - panelHeight - GAP };
		}

		return {
			x,
			y: isCompact
				? frameBounds.bottom - panelHeight * 0.48
				: frameBounds.bottom - panelHeight * 0.35,
		};
	});

	const clusterRow = $derived.by(() => {
		if (!clusterLine) return null;

		const hasSpotMult = clusterLine.spotMult > 1;
		const fontSize =
			SYMBOL_SIZE * (isCompact ? (hasSpotMult ? 0.14 : 0.17) : hasSpotMult ? 0.155 : 0.19);
		const iconSize = SYMBOL_SIZE * (isCompact ? 0.28 : 0.32) * (hasSpotMult ? 0.88 : 1);
		const paysText = formatTumbleWinPaysText(clusterLine);
		const countText = `${clusterLine.count}x`;
		const gap = fontSize * 0.12;
		const countW = fontSize * 1.65;
		const paysW = fontSize * paysText.length * 0.5;
		const totalW = countW + gap + iconSize + gap + paysW;
		const left = (panelWidth - totalW) / 2;
		const y = panelHeight * ROW_Y;

		return {
			countText,
			paysText,
			fontSize,
			iconSize,
			symbol: clusterLine.symbol,
			countX: left + countW,
			iconX: left + countW + gap,
			paysX: left + countW + gap + iconSize + gap,
			y,
		};
	});

	const resetPanel = () => {
		show = false;
		panelMode = 'hidden';
		freeSpinRemaining = 0;
		clusterLine = undefined;
	};

	const tryShow = () => {
		if (!allowPanel) return;
		show = true;
	};

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: tryShow,

		tumbleWinAmountHide: resetPanel,

		tumbleWinAmountReset: resetPanel,

		tumbleWinSpinRemainingShow: (emitterEvent) => {
			if (!allowPanel) return;
			panelMode = 'freeSpinRemaining';
			freeSpinRemaining = emitterEvent.remaining;
			clusterLine = undefined;
			show = true;
		},

		tumbleWinSpinRemainingHide: () => {
			if (panelMode === 'freeSpinRemaining') {
				panelMode = 'hidden';
				freeSpinRemaining = 0;
				show = false;
			}
		},

		tumbleWinBreakdownShow: (emitterEvent) => {
			if (!allowPanel) return;
			if (emitterEvent.multiCluster || emitterEvent.lines.length > 1) {
				panelMode = 'winner';
				clusterLine = undefined;
			} else if (emitterEvent.lines.length === 1) {
				panelMode = 'singleCluster';
				clusterLine = emitterEvent.lines[0];
			}
			show = true;
		},

		tumbleWinAmountUpdate: async () => {},

		tumbleWinAmountShowMultiplier: () => {},

		tumbleWinAmountHideMultiplier: () => {},

		tumbleWinAmountPulse: async () => {
			if (!allowPanel) return;
			flashAmount = 1;
			await pulseScale.set(1.22, { duration: 220, easing: cubicOut });
			await pulseScale.set(1.0, { duration: 320, easing: cubicOut });
			flashAmount = 0;
		},
	});
</script>

<FadeContainer show={visible}>
	<BoardContainer>
		<Container
			x={position.x + panelWidth / 2}
			y={position.y + panelHeight / 2}
			pivot={{ x: panelWidth / 2, y: panelHeight / 2 }}
			scale={pulseScale.current}
		>
			<UiAssetSprite
				key="menu_panel_md"
				assetKey="menu_panel_md"
				anchor={{ x: 0, y: 0 }}
				width={panelWidth}
				height={panelHeight}
				alpha={0.98}
				tint={flashAmount > 0 ? 0xfff2a8 : 0xffffff}
			/>

			{#if panelMode === 'freeSpinRemaining'}
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					x={panelWidth / 2}
					y={panelHeight * ROW_Y}
					text={`Free spin left: ${freeSpinRemaining}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.17 : 0.19),
						fill: GOLD,
						fontWeight: '900',
					}}
				/>
			{:else if panelMode === 'winner'}
				<BitmapText
					anchor={{ x: 0.5, y: 0.5 }}
					x={panelWidth / 2}
					y={panelHeight * ROW_Y}
					text="WINNER"
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.22 : 0.24),
						fill: GOLD,
						fontWeight: '900',
					}}
				/>
			{:else if panelMode === 'singleCluster' && clusterRow}
				<BitmapText
					anchor={{ x: 1, y: 0.5 }}
					x={clusterRow.countX}
					y={clusterRow.y}
					text={clusterRow.countText}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: clusterRow.fontSize,
						fill: GOLD,
						fontWeight: '900',
					}}
				/>

				<UiAssetSprite
					key={`tumble_win_${clusterRow.symbol.toLowerCase()}`}
					assetKey={`sym_${clusterRow.symbol.toLowerCase()}`}
					anchor={{ x: 0, y: 0.5 }}
					x={clusterRow.iconX}
					y={clusterRow.y}
					width={clusterRow.iconSize}
					height={clusterRow.iconSize}
				/>

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={clusterRow.paysX}
					y={clusterRow.y}
					text={clusterRow.paysText}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: clusterRow.fontSize,
						fill: GOLD,
						fontWeight: '900',
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
</FadeContainer>
