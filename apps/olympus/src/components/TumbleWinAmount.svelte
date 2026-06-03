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
		| { type: 'tumbleWinAmountUpdate'; amount: number; animate: boolean }
		// Gates-of-Olympus style end-of-spin multiplier overlay. When shown,
		// the panel renders `WIN WIN {amount} ×{multiplier}`. Use
		// `tumbleWinAmountShowMultiplier` to set/update the visible multiplier
		// (called repeatedly to grow it as each M-symbol value is collected),
		// and `tumbleWinAmountHideMultiplier` to clear it once the final
		// post-multiplier total has been counted up.
		| { type: 'tumbleWinAmountShowMultiplier'; multiplier: number }
		| { type: 'tumbleWinAmountHideMultiplier' };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { stateBet } from 'state-shared';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	/** Duration of the count-up tween when `animate: true` is requested. */
	const COUNT_UP_DURATION = 600;
	const COUNT_UP_DURATION_TURBO = 220;

	const PANEL_W = SYMBOL_SIZE * 3.85;
	const PANEL_H = SYMBOL_SIZE * 1.05;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.08;
	const SYMBOL_ICON_SIZE = SYMBOL_SIZE * 0.34;
	const GOLD = 0xffd147;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);

	let show = $state(false);
	let breakdownLines: TumbleWinBreakdownLine[] = $state([]);
	/**
	 * Cumulative tumble-win amount for the current spin, tweened so that
	 * `animate: true` updates count up smoothly (e.g. when the post-multiplier
	 * total is revealed). Source of truth for the displayed number — driven by
	 * `tumbleWinAmountUpdate` events from `winInfo`, `updateTumbleWin` and
	 * `boardMultiplierInfo` handlers.
	 */
	const amountTween = new Tween(0, { duration: 0 });
	/**
	 * When non-null, the panel renders the end-of-spin multiplier overlay
	 * (`WIN WIN {amount} ×{multiplier}`). Driven by
	 * `tumbleWinAmountShowMultiplier`/`tumbleWinAmountHideMultiplier`.
	 */
	let activeMultiplier: number | null = $state(null);

	const panelWidth = $derived(isCompact ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isCompact ? PANEL_H_STACKED : PANEL_H);
	/** Round to nearest 1 so the tweened display doesn't show fractional currency units. */
	const displayedAmount = $derived(Math.round(amountTween.current));
	/**
	 * Single-cluster "first hit" visual mode: show {count}x [icon] Pays {amount}
	 * only while the cumulative spin total still equals that single cluster's
	 * amount (i.e. it's the very first cascade and a single cluster, with no
	 * multiplier overlay active). Once more cascades land or the multiplier
	 * phase begins, we fall through to the `WIN WIN {amount}` numeric display.
	 */
	const singleWinLine = $derived.by(() => {
		if (activeMultiplier !== null) return undefined;
		if (breakdownLines.length !== 1) return undefined;
		if (breakdownLines[0].amount !== displayedAmount) return undefined;
		return breakdownLines[0];
	});
	const displayText = $derived.by(() => {
		if (singleWinLine) return '';
		if (displayedAmount <= 0) return '';
		const amountStr = bookEventAmountToCurrencyString(displayedAmount);
		if (activeMultiplier !== null) {
			return `WIN WIN ${amountStr} ×${activeMultiplier}`;
		}
		return `WIN WIN ${amountStr}`;
	});

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
			y: isCompact
				? frameBounds.bottom - panelHeight * 0.48
				: frameBounds.bottom - panelHeight * 0.35,
		};
	});

	context.eventEmitter.subscribeOnMount({
		tumbleWinAmountShow: () => {
			show = true;
		},

		tumbleWinAmountHide: () => {
			show = false;
			breakdownLines = [];
			activeMultiplier = null;
			amountTween.set(0, { duration: 0 });
		},

		tumbleWinAmountReset: () => {
			show = false;
			breakdownLines = [];
			activeMultiplier = null;
			amountTween.set(0, { duration: 0 });
		},

		tumbleWinBreakdownShow: (emitterEvent) => {
			breakdownLines = emitterEvent.lines;
			show = true;
		},

		tumbleWinAmountUpdate: async (emitterEvent) => {
			// Source of truth for the displayed cumulative amount. When
			// `animate` is true (e.g. the post-multiplier reveal in
			// boardMultiplierInfo) we count up smoothly so the player sees the
			// number grow; otherwise we snap so per-cascade increments don't
			// feel laggy. Turbo shortens the count-up so the multiplier sequence
			// can't bleed into the next spin (QA 02.06.2026).
			if (amountTween.target === emitterEvent.amount) return;
			if (emitterEvent.animate) {
				const duration = stateBet.isTurbo ? COUNT_UP_DURATION_TURBO : COUNT_UP_DURATION;
				await amountTween.set(emitterEvent.amount, { duration });
			} else {
				amountTween.set(emitterEvent.amount, { duration: 0 });
			}
		},

		tumbleWinAmountShowMultiplier: (emitterEvent) => {
			activeMultiplier = emitterEvent.multiplier;
			show = true;
		},

		tumbleWinAmountHideMultiplier: () => {
			activeMultiplier = null;
		},
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
					x={panelWidth * (isCompact ? 0.32 : 0.34)}
					y={panelHeight * 0.52}
					text={`${singleWinLine.count}x`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.19 : 0.21),
						fill: GOLD,
						fontWeight: '900',
					}}
				/>

				<UiAssetSprite
					key={`tumble_win_${singleWinLine.symbol.toLowerCase()}`}
					assetKey={`sym_${singleWinLine.symbol.toLowerCase()}`}
					anchor={0.5}
					x={panelWidth * (isCompact ? 0.4 : 0.42)}
					y={panelHeight * 0.52}
					width={SYMBOL_ICON_SIZE * (isCompact ? 0.96 : 1)}
					height={SYMBOL_ICON_SIZE * (isCompact ? 0.96 : 1)}
				/>

				<BitmapText
					anchor={{ x: 0, y: 0.5 }}
					x={panelWidth * (isCompact ? 0.48 : 0.5)}
					y={panelHeight * 0.52}
					text={`Pays ${bookEventAmountToCurrencyString(singleWinLine.amount)}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.19 : 0.21),
						fill: GOLD,
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
						fontSize: SYMBOL_SIZE * (isCompact ? 0.19 : 0.21),
						fill: GOLD,
						fontWeight: '900',
					}}
				/>
			{/if}
		</Container>
	</BoardContainer>
</FadeContainer>
