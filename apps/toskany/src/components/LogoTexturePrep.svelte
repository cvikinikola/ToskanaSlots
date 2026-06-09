<script lang="ts">
	import { getContextApp } from 'pixi-svelte';

	import { applyLogoTextureCutoutToAssets } from '../game/logoTextureCutout';

	const context = getContextApp();

	$effect(() => {
		const assets = context.stateApp.loadedAssets;
		if (!assets) return;
		applyLogoTextureCutoutToAssets(assets);
	});
</script>
