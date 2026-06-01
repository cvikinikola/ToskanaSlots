<script lang="ts" module>
	import type { SpriteProps } from 'pixi-svelte';
	import type { PixiPoint } from 'pixi-svelte';

	import UiAssetSprite from './UiAssetSprite.svelte';

	/**
	 * Decorative plate behind BALANCE / WIN / BET readouts. Same prop
	 * surface as `UiSprite` so it's a drop-in replacement, but draws a
	 * richer "viking ticker" look:
	 *   • outer dark drop-shadow halo
	 *   • dark navy fill with a subtle horizontal sheen band on top
	 *   • main gold border + thin warm inner highlight
	 *   • a small gold rivet on each short end (left & right)
	 */
	export type Props = Omit<SpriteProps, 'key'> & {
		assetKey: string;
		anchor?: PixiPoint;
		width: number;
		height: number;
		borderRadius?: number;
		backgroundColor?: number;
		backgroundAlpha?: number;
		borderColor?: number;
		borderWidth?: number;
		borderAlpha?: number;
	};
</script>

<script lang="ts">
	const {
		assetKey,
		anchor,
		width,
		height,
		borderRadius: _borderRadius,
		backgroundColor: _backgroundColor,
		backgroundAlpha: _backgroundAlpha,
		borderColor: _borderColor,
		borderWidth: _borderWidth,
		borderAlpha: _borderAlpha,
		...spriteProps
	}: Props = $props();
</script>

<UiAssetSprite {...spriteProps} {assetKey} {anchor} {width} {height} />
