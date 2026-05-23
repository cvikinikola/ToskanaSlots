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
		anchor,
		width,
		height,
		borderRadius,
		backgroundColor = 0x0a0c1a,
		backgroundAlpha = 0.94,
		borderColor = 0xffd147,
		borderWidth = 2.5,
		borderAlpha = 1,
		...spriteProps
	}: Props = $props();
</script>

<UiAssetSprite {...spriteProps} assetKey="menu_panel_lg" {anchor} {width} {height} />
