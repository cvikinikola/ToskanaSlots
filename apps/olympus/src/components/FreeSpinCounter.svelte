<script lang="ts" module>
	export type EmitterEventFreeSpinCounter =
		| { type: 'freeSpinCounterShow' }
		| { type: 'freeSpinCounterHide' }
		| { type: 'freeSpinCounterUpdate'; current?: number; total?: number };
</script>

<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES, SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// Buy Bonus plaque (638×391) — isti vizuelni stil kao BUY BONUS dugme.
	const BUY_BONUS_ASPECT = 391 / 638;
	const PANEL_W = SYMBOL_SIZE * 2.35;
	const PANEL_H = PANEL_W * BUY_BONUS_ASPECT;
	const GOLD = 0xffd147;

	const panelWidth = PANEL_W;
	const panelHeight = PANEL_H;

	// TumbleHistory geometry mirrored from TumbleHistory.svelte so the
	// counter can align exactly with it on every viewport.
	const TH_PANEL_H_STACKED = SYMBOL_SIZE * 1.48;
	const TH_FRAME_GAP = SYMBOL_SIZE * 0.12;
	const TH_DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const TH_DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		// TumbleHistory uses 2.2 as the vertical divisor for its anchor.
		thTop: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		centerX: BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		boardLeft: 0,
	});

	const position = $derived.by(() => {
		if (isCompact) {
			// Small / square / portrait screens: TumbleHistory is a wide strip
			// centered at the top. Align the FREE SPINS panel's BOTTOM edge with
			// the TumbleHistory bottom edge. Flush the panel's RIGHT edge to the
			// board's LEFT edge so it hugs the top-left board corner and never
			// clips off-screen on narrow portrait viewports (QA 03.06.2026).
			const thCenterY = frameBounds.thTop - SYMBOL_SIZE * 0.22;
			const thBottomY = thCenterY + TH_PANEL_H_STACKED / 2;
			return {
				x: frameBounds.boardLeft - SYMBOL_SIZE * 0.55,
				y: thBottomY - PANEL_H,
			};
		}

		// Wide screens: desna ivica poravnata sa TumbleHistory panelom.
		const thRightEdge = frameBounds.left - TH_FRAME_GAP;
		const thTopY = frameBounds.thTop + (isFreeSpins ? TH_DESKTOP_Y_FREE_SPINS : TH_DESKTOP_Y_BASE);
		const gap = SYMBOL_SIZE * 0.3;
		return {
			x: thRightEdge - PANEL_W,
			y: thTopY - PANEL_H - gap,
		};
	});

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (e) => {
			if (e.current !== undefined) current = e.current;
			if (e.total !== undefined) total = e.total;
		},
	});
</script>

<FadeContainer {show}>
	<BoardContainer>
		<Container {...position}>
			<UiAssetSprite
				key="menu_buy_bonus"
				assetKey="menu_buy_bonus"
				anchor={{ x: 0, y: 0 }}
				width={panelWidth}
				height={panelHeight}
				alpha={0.98}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelWidth * 0.5}
				y={panelHeight * 0.38}
				text="FREE SPINS"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.11,
					fill: GOLD,
					fontWeight: '900',
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelWidth * 0.5}
				y={panelHeight * 0.62}
				text={`${current} / ${total}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.22,
					fill: 0xfff0b8,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
