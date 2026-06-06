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

	// TumbleHistory geometry mirrored from TumbleHistory.svelte so the
	// multiplier aligns symmetrically with the FREE SPINS counter (which is
	// aligned to TumbleHistory on the left) on every viewport.
	const TH_PANEL_H_STACKED = SYMBOL_SIZE * 1.48;
	const TH_FRAME_PULL_IN = SYMBOL_SIZE * 1.2;
	const TH_DESKTOP_Y_BASE = SYMBOL_SIZE * 2.1;
	const TH_DESKTOP_Y_FREE_SPINS = SYMBOL_SIZE * 2.12;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const isFreeSpins = $derived(context.stateGame.gameType === 'freeSpins');
	/** Global multiplier panel — samo base game; tokom free spins se ne prikazuje. */
	const visible = $derived(show && !isFreeSpins);
	const frameBounds = $derived({
		left: BOARD_SIZES.width / 2 - REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		right: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x,
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		// TumbleHistory uses 2.2 as the vertical divisor for its anchor.
		thTop: BOARD_SIZES.height / 2.2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		boardRight: BOARD_SIZES.width,
		boardLeft: 0,
	});

	const position = $derived.by(() => {
		if (isCompact) {
			// Small / square / portrait screens: mirror the FREE SPINS counter
			// on the right. Align the panel's BOTTOM edge with the TumbleHistory
			// bottom edge and flush its LEFT edge to the board's RIGHT edge so
			// it hugs the top-right board corner and never clips off-screen on
			// narrow portrait viewports (QA 03.06.2026).
			const thCenterY = frameBounds.thTop - SYMBOL_SIZE * 0.22;
			const thBottomY = thCenterY + TH_PANEL_H_STACKED / 2;
			return {
				x: frameBounds.boardRight - PANEL_W + SYMBOL_SIZE * 0.55,
				y: thBottomY - PANEL_H,
			};
		}

		// Big / landscape screens: mirror the FREE SPINS counter. Its right
		// edge aligns with TumbleHistory's right edge (frame.left + PULL_IN);
		// mirrored on the right that is the panel's LEFT edge at
		// frame.right - PULL_IN. Same height as FREE SPINS.
		const thLeftEdgeMirrored = frameBounds.right - TH_FRAME_PULL_IN;
		const thTopY = frameBounds.thTop + (isFreeSpins ? TH_DESKTOP_Y_FREE_SPINS : TH_DESKTOP_Y_BASE);
		const gap = SYMBOL_SIZE * 0.3;
		return {
			x: thLeftEdgeMirrored,
			y: thTopY - PANEL_H - gap,
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

<FadeContainer show={visible}>
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
