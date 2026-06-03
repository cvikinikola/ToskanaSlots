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
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	const PANEL_W = SYMBOL_SIZE * 1.85;
	const PANEL_H = SYMBOL_SIZE * 1.18;
	const GOLD = 0xffd147;

	const PANEL_WIDTH = SYMBOL_SIZE * 0.641;
	const scale = $derived(context.stateLayoutDerived.isStacked() ? 1.28 : 1);
	const desktopPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.3,
		y: -SYMBOL_SIZE * 0.47,
	});
	const portraitPosition = $derived({
		x: context.stateGameDerived.boardLayout().width - PANEL_WIDTH * 1.5,
		y: -SYMBOL_SIZE * 0.55,
	});
	const position = $derived(
		context.stateLayoutDerived.isStacked() ? portraitPosition : desktopPosition,
	);

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
		<Container {...position} scale={scale}>
			<UiAssetSprite
				assetKey="menu_panel_win"
				anchor={{ x: 0, y: 0 }}
				width={PANEL_W}
				height={PANEL_H}
				alpha={flash ? 0.75 : 0.98}
			/>
			<BitmapText
				x={PANEL_W * 0.5}
				y={PANEL_H * 0.48}
				anchor={0.5}
				text={`x${multiplier}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.42,
					fill: GOLD,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
</FadeContainer>
