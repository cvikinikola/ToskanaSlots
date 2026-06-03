<script lang="ts">
	import { UiAssetSprite } from 'components-ui-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { BOARD_SIZES, FRAME_BG_RATIO } from '../game/constants';

	const frameSide = BOARD_SIZES.width * FRAME_BG_RATIO;
</script>

<BoardContainer>
	<UiAssetSprite
		assetKey="menu_frame"
		anchor={0.5}
		x={BOARD_SIZES.width / 2}
		y={BOARD_SIZES.height / 2}
		width={frameSide}
		height={frameSide}
		zIndex={-1}
	/>
</BoardContainer>
