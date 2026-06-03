<script lang="ts" module>

	export type EmitterEventBoardFrame =

		| { type: 'boardFrameGlowShow' }

		| { type: 'boardFrameGlowHide' };

</script>



<script lang="ts">

	import { Container, SpineProvider, SpineTrack } from 'pixi-svelte';

	import { UiAssetSprite } from 'components-ui-pixi';



	import { getContext } from '../game/context';

	import {
		FRAME_POSITION_ADJUSTMENT,
		FRAME_OFFSET_Y,
		getBoardFrameDisplaySize,
		getFrameAssetKey,
		isAlmostSquareCanvas,
	} from '../game/constants';



	const context = getContext();

	const SPINE_SCALE = { width: 0.6, height: 0.6 };

	type AnimationName = 'reelhouse_glow_start' | 'reelhouse_glow_idle' | 'reelhouse_glow_exit';



	let animationName = $state<AnimationName | undefined>(undefined);

	let loop = $state(false);



	const frameAssetKey = $derived(

		getFrameAssetKey(context.stateLayoutDerived.layoutType()),

	);



	const boardLayout = $derived(context.stateGameDerived.boardLayout());
	const mainLayout = $derived(context.stateLayoutDerived.mainLayout());

	const playScale = $derived(boardLayout.scale ?? 1);

	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const almostSquare = $derived(
		isAlmostSquareCanvas(context.stateLayoutDerived.canvasSizes()),
	);

	const frameX = $derived(boardLayout.x * FRAME_POSITION_ADJUSTMENT);

	const frameY = $derived(
		boardLayout.y * FRAME_POSITION_ADJUSTMENT + FRAME_OFFSET_Y,
	);

	const frameSize = $derived(
		getBoardFrameDisplaySize(boardLayout, layoutType, almostSquare),
	);

	const frameWidth = $derived(frameSize.width);
	const frameHeight = $derived(frameSize.height);



	context.eventEmitter.subscribeOnMount({

		boardFrameGlowShow: () => {

			animationName = 'reelhouse_glow_start';

			loop = false;

		},

		boardFrameGlowHide: () => {

			if (animationName) animationName = 'reelhouse_glow_exit';

		},

	});

</script>



<Container x={frameX} y={frameY} scale={playScale} zIndex={-1}>
	{#if animationName}
		<SpineProvider
			key="reelhouse"
			x={0}
			y={0}
			width={boardLayout.width * SPINE_SCALE.width}
			height={boardLayout.height * SPINE_SCALE.height}
		>
			<SpineTrack
				trackIndex={0}
				{animationName}
				{loop}
				listener={{
					complete: (entry) => {
						if (entry.animation?.name === 'reelhouse_glow_start') {
							animationName = 'reelhouse_glow_idle';
							loop = true;
						}
						if (entry.animation?.name === 'reelhouse_glow_exit') {
							animationName = undefined;
							loop = false;
						}
					},
				}}
			/>
		</SpineProvider>
	{/if}

	<UiAssetSprite
		assetKey={frameAssetKey}
		fallbackAssetKey="menu_frame_fallback"
		anchor={0.5}
		x={0}
		y={0}
		width={frameWidth}
		height={frameHeight}
	/>
</Container>

