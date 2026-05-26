<script lang="ts">
	import { UiAssetSprite } from 'components-ui-pixi';

	import { getContext } from '../game/context';
	import { REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	const board = $derived(context.stateGameDerived.boardLayout());
</script>

<UiAssetSprite
	assetKey="menu_frame"
	anchor={0.5}
	x={board.x + REEL_FRAME_OFFSET.x * board.scale}
	y={board.y + REEL_FRAME_OFFSET.y * board.scale}
	width={REEL_FRAME_SIZES.width * board.scale}
	height={REEL_FRAME_SIZES.height * board.scale}
	zIndex={-1}
/>
