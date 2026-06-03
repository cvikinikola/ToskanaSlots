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
		CLUSTER_FRAME_BG_RATIO,
		FRAME_POSITION_ADJUSTMENT,
		FRAME_SPRITE_SCALE,
		FRAME_EXTEND_BOTTOM,
		FRAME_EXTEND_TOP,
		FRAME_OFFSET_Y,
		FRAME_SIZE_MUL,
		getFrameAssetKey,
		getFrameHeightMul,
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

	const playScale = $derived(boardLayout.scale ?? 1);

	const frameHeightMul = $derived(
		getFrameHeightMul(context.stateLayoutDerived.layoutType()),
	);

	const frameX = $derived(boardLayout.x * FRAME_POSITION_ADJUSTMENT);

	const baseFrameHeight = $derived(boardLayout.width * FRAME_SPRITE_SCALE.height);

	const frameY = $derived(
		boardLayout.y * FRAME_POSITION_ADJUSTMENT + FRAME_OFFSET_Y,
	);

	const frameWidth = $derived(
		boardLayout.width *
			CLUSTER_FRAME_BG_RATIO *
			FRAME_SPRITE_SCALE.width *
			FRAME_SIZE_MUL,
	);

	const frameHeight = $derived(
		(baseFrameHeight + FRAME_EXTEND_TOP + FRAME_EXTEND_BOTTOM) *
			FRAME_SIZE_MUL *
			frameHeightMul,
	);



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
		anchor={0.5}
		x={0}
		y={0}
		width={frameWidth}
		height={frameHeight}
	/>
</Container>

