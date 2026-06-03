<script lang="ts">
	import { UiAssetSprite } from 'components-ui-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import {
		BOARD_SIZES,
		FRAME_BG_RATIO,
		FRAME_SPRITE_SCALE,
	} from '../game/constants';
</script>

<BoardContainer>
	<UiAssetSprite
		assetKey="menu_frame"
		anchor={0.5}
		x={BOARD_SIZES.width / 2}
		y={BOARD_SIZES.height / 2}
		width={BOARD_SIZES.width * FRAME_BG_RATIO * FRAME_SPRITE_SCALE.width}
		height={BOARD_SIZES.width * FRAME_SPRITE_SCALE.height}
		zIndex={-1}
	/>
</BoardContainer>
