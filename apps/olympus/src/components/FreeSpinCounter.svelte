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

	const PANEL_W = SYMBOL_SIZE * 2.95;
	const PANEL_H = SYMBOL_SIZE * 1.62;
	const PANEL_GAP = SYMBOL_SIZE * 0.34;

	const isStacked = $derived(context.stateLayoutDerived.isStacked());
	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		centerX: BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
	});
	const position = $derived.by(() => {
		if (isStacked) {
			return {
				x: frameBounds.centerX - PANEL_W / 2,
				y: frameBounds.top - PANEL_H - SYMBOL_SIZE * 1.52,
			};
		}

		return {
			x: frameBounds.left - PANEL_W - PANEL_GAP,
			y: frameBounds.top + SYMBOL_SIZE * 0.15,
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
				key="menu_frame_free_spins"
				assetKey="menu_frame_free_spins"
				anchor={{ x: 0, y: 0 }}
				width={PANEL_W}
				height={PANEL_H}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.24}
				text="FREE SPINS"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.18,
					fill: 0xffd700,
					fontWeight: '900',
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.63}
				text={`${current} / ${total}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.42,
					fill: 0xffffff,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
