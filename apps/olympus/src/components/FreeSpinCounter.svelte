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

	// Desktop / landscape: a compact panel that sits above TumbleHistory (left
	// of the reel frame) so it scales with the board on every viewport.
	const PANEL_W = SYMBOL_SIZE * 2.95;
	const PANEL_H = SYMBOL_SIZE * 1.25;
	// Stacked (portrait/tablet): a wider strip above the TumbleHistory row at
	// the top of the frame so it is comfortably readable on small devices.
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.3;
	const GOLD = 0xffd147;

	// Constants kept in sync with TumbleHistory.svelte positioning logic.
	const HISTORY_PANEL_W = SYMBOL_SIZE * 2.95;
	const HISTORY_PANEL_H_STACKED = SYMBOL_SIZE * 1.48;
	const HISTORY_FRAME_PULL_IN = SYMBOL_SIZE * 1.2;
	const HISTORY_DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const HISTORY_DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	const panelWidth = $derived(isCompact ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isCompact ? PANEL_H_STACKED : PANEL_H);

	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		compactTop: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		centerX: BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
	});

	const position = $derived.by(() => {
		if (isCompact) {
			// Sit just above the TumbleHistory row at the top of the frame.
			const historyRowCenterY = frameBounds.compactTop - SYMBOL_SIZE * 0.22;
			const historyTop = historyRowCenterY - HISTORY_PANEL_H_STACKED / 2;
			const gap = SYMBOL_SIZE * 0.22;
			return {
				x: frameBounds.centerX - panelWidth / 2,
				y: historyTop - panelHeight - gap,
			};
		}

		// Desktop / landscape: align horizontally with the TumbleHistory panel
		// (left of the reel frame) and sit just above its top edge.
		const historyX = frameBounds.left - HISTORY_PANEL_W + HISTORY_FRAME_PULL_IN;
		const historyY =
			frameBounds.top + (isFreeSpins ? HISTORY_DESKTOP_Y_FREE_SPINS : HISTORY_DESKTOP_Y_BASE);
		const gap = SYMBOL_SIZE * 0.22;
		return {
			x: historyX + (HISTORY_PANEL_W - panelWidth) / 2,
			y: historyY - panelHeight - gap,
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
				key="menu_panel_md"
				assetKey="menu_panel_md"
				anchor={{ x: 0, y: 0 }}
				width={panelWidth}
				height={panelHeight}
				alpha={0.98}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelWidth * 0.5}
				y={panelHeight * (isCompact ? 0.28 : 0.26)}
					text="FREE SPINS"
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.17 : 0.16),
						fill: GOLD,
						fontWeight: '900',
					}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelWidth * 0.5}
				y={panelHeight * (isCompact ? 0.62 : 0.6)}
					text={`${current} / ${total}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.28 : 0.3),
						fill: 0xfff0b8,
						fontWeight: '900',
					}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
