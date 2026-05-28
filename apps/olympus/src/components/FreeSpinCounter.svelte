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

	const PANEL_W = SYMBOL_SIZE * 3.85;
	const PANEL_H = SYMBOL_SIZE * 1.05;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.08;
	const GOLD = 0xffd147;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const panelWidth = $derived(isCompact ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isCompact ? PANEL_H_STACKED : PANEL_H);
	const frameBounds = $derived({
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		bottom: BOARD_SIZES.height / 2 + REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});
	const position = $derived.by(() => {
		const tumbleWinY = isCompact
			? frameBounds.bottom - PANEL_H_STACKED * 0.48
			: frameBounds.bottom - PANEL_H * 0.35;
		const gap = SYMBOL_SIZE * (isCompact ? 0.18 : 0.24);

		return {
			x: BOARD_SIZES.width / 2 - panelWidth / 2,
			y: tumbleWinY + panelHeight + gap,
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
				x={panelWidth * 0.36}
				y={panelHeight * 0.52}
					text="FREE SPINS"
					style={{
						fontFamily: 'serif',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.18 : 0.18),
						fill: GOLD,
						fontWeight: '900',
					}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={panelWidth * 0.74}
				y={panelHeight * 0.52}
					text={`${current} / ${total}`}
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * (isCompact ? 0.21 : 0.21),
						fill: GOLD,
						fontWeight: '900',
					}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
