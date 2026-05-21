<script lang="ts" module>
	export type EmitterEventGlobalMultiplier =
		| { type: 'globalMultiplierShow' }
		| { type: 'globalMultiplierHide' }
		| { type: 'globalMultiplierUpdate'; multiplier: number };
</script>

<script lang="ts">
	import { Container, Graphics, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { waitForTimeout } from 'utils-shared/wait';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 1.4;
	const PANEL_H = SYMBOL_SIZE * 0.9;
	const CORNER = 12;

	// Frame extends 9% beyond board width on each side (FRAME_PADDING_X=1.18).
	// BoardContainer coords are in native (pre-scale) units, so board right edge
	// = BOARD_SIZES.width (600) and frame right edge = 600 + 54 = 654.
	// Place the panel just outside: 600 + 74 = 674.
	const position = $derived({
		x: BOARD_SIZES.width + SYMBOL_SIZE * 0.74,
		y: SYMBOL_SIZE * 0.2,
	});

	let show = $state(false);
	let multiplier = $state(1);
	let flash = $state(false);

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),

		globalMultiplierHide: () => (show = false),

		/**
		 * When multiplier increases or resets: short flash + delay before the
		 * displayed value changes, then resolve.
		 * Otherwise: just set the value immediately.
		 */
		globalMultiplierUpdate: async (emitterEvent) => {
			if (emitterEvent.multiplier === 1 && multiplier !== 1) {
				flash = true;
				await waitForTimeout(200);
				flash = false;
				multiplier = 1;
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
			<!-- Panel background -->
			<Graphics
				draw={(g) => {
					g.clear();
					g.roundRect(0, 0, PANEL_W, PANEL_H, CORNER);
					g.fill({ color: 0x1a1a2e, alpha: 0.85 });
					g.stroke({ color: flash ? 0xffd700 : 0x886600, width: 2 });
				}}
			/>

			<!-- Label -->
			<BitmapText
				anchor={{ x: 0.5, y: 0 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.1}
				text="MULTIPLIER"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.16,
					fill: 0xccaa44,
					fontWeight: '600',
				}}
			/>

			<!-- Multiplier value -->
			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.65}
				text={`×${multiplier}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.45,
					fill: flash ? 0xffffff : 0xffd700,
					fontWeight: '700',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
