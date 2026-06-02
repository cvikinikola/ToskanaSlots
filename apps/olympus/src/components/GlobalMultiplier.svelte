<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 1.85;
	const PANEL_H = SYMBOL_SIZE * 1.18;
	const GOLD = 0xffd147;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		compactTop: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	const position = $derived.by(() => {
		const insetY = SYMBOL_SIZE * (isCompact ? 0.14 : 0.22);

		if (isCompact) {
			const rowCenterY = frameBounds.compactTop - SYMBOL_SIZE * 0.22;
			return {
				x: frameBounds.right - PANEL_W - SYMBOL_SIZE * 0.86,
				y: rowCenterY - PANEL_H / 2,
			};
		}

		// Desktop / landscape: mirror the FREE SPINS counter (left of board).
		// FreeSpinCounter overlaps the frame by ~1.2 SYMBOL_SIZE inside; mirror
		// that overlap on the right so the multiplier hugs the board edge
		// symmetrically. Y is aligned with the FREE SPINS panel top.
		const FRAME_OVERLAP_INSIDE = SYMBOL_SIZE * 1.2;
		// Matches FreeSpinCounter: historyY (frameBounds.top + 2.12) - panelH - gap(0.22)
		const counterTopY = frameBounds.top + SYMBOL_SIZE * 2.12 - SYMBOL_SIZE * 1.25 - SYMBOL_SIZE * 0.22;
		return {
			x: frameBounds.right - FRAME_OVERLAP_INSIDE,
			y: counterTopY + (SYMBOL_SIZE * 1.25 - PANEL_H) / 2 + insetY * 0,
		};
	});

	let show = $state(false);
	let multiplier = $state(0);
	let flash = $state(false);

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),

		globalMultiplierHide: () => (show = false),

		globalMultiplierUpdate: async (emitterEvent) => {
			if (emitterEvent.multiplier === 0 && multiplier !== 0) {
				flash = true;
				await waitForTimeout(200);
				flash = false;
				multiplier = 0;
			} else if (emitterEvent.multiplier > multiplier) {
				flash = true;
				await waitForTimeout(300);
				multiplier = emitterEvent.multiplier;
				flash = false;
			} else {
				multiplier = emitterEvent.multiplier;
			}
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
				alpha={flash ? 1 : 0.94}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.25}
				text="MULTIPLIER"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.12,
					fill: GOLD,
					fontWeight: '900',
				}}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.62}
				text={`x${multiplier}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.34,
					fill: GOLD,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
