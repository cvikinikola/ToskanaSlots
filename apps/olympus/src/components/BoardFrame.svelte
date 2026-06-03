<script lang="ts" module>

	export type EmitterEventBoardFrame =

		| { type: 'boardFrameGlowShow' }

		| { type: 'boardFrameGlowHide' };

</script>



<script lang="ts">

	import { SpineProvider, SpineTrack } from 'pixi-svelte';

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
		(baseFrameHeight + FRAME_EXTEND_TOP + FRAME_EXTEND_BOTTOM) * FRAME_SIZE_MUL,
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



{#if animationName}

	<SpineProvider

		zIndex={-1}

		key="reelhouse"

		x={frameX}

		y={frameY}

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

	x={frameX}

	y={frameY}

	width={frameWidth}

	height={frameHeight}

	zIndex={-1}

/>

