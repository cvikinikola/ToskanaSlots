<script lang="ts">
	import { getContextApp } from 'pixi-svelte';

	import { applyLogoTextureCutoutToAssets } from '../game/logoTextureCutout';
	import { applyWinCelebrationTextureCutoutToAssets } from '../game/winCelebrationTextureCutout';

	const context = getContextApp();

	$effect(() => {
		const assets = context.stateApp.loadedAssets;
		if (!assets) return;
		applyLogoTextureCutoutToAssets(assets);
		applyWinCelebrationTextureCutoutToAssets(assets);
	});
</script>
