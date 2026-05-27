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

	const position = $derived({
		x: BOARD_SIZES.width / 2 + REEL_FRAME_SIZES.width / 2 + REEL_FRAME_OFFSET.x + SYMBOL_SIZE * 0.28,
		y: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y + SYMBOL_SIZE * 0.76,
	});

	let show = $state(false);
	let multiplier = $state(1);
	let flash = $state(false);

	context.eventEmitter.subscribeOnMount({
		globalMultiplierShow: () => (show = true),

		globalMultiplierHide: () => (show = false),

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
					fill: flash ? 0xffffff : 0xffd147,
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
					fill: flash ? 0xffffff : 0xffd700,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
