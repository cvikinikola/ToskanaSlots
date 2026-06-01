<script lang="ts">
	import { UiAssetSprite } from 'components-ui-pixi';

	import BoardContainer from './BoardContainer.svelte';
	import { BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';
</script>

<!-- Isti BoardContainer kao simboli — okvir prati board pri resize-u. -->
<BoardContainer>
	<UiAssetSprite
		assetKey="menu_frame"
		anchor={0.5}
		x={BOARD_SIZES.width / 2 + REEL_FRAME_OFFSET.x}
		y={BOARD_SIZES.height / 2 + REEL_FRAME_OFFSET.y}
		width={REEL_FRAME_SIZES.width}
		height={REEL_FRAME_SIZES.height}
		zIndex={-1}
	/>
</BoardContainer>
