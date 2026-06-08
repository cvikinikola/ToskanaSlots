<script lang="ts">
	import { BG_FILL_COLOR } from '../game/constants';

	const fillHex = `#${BG_FILL_COLOR.toString(16).padStart(6, '0')}`;
</script>

<!-- Solid fill behind transparent Pixi canvas (backgrounds are Pixi sprites). -->
<div class="bg-video" style:background-color={fillHex} aria-hidden="true"></div>

<style lang="scss">
	.bg-video {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
</style>
