<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { getContextApp } from 'pixi-svelte';

	const ctx = getContextApp();

	/**
	 * Walks the loaded sprite assets and enables mipmap generation +
	 * linear (trilinear) filtering on each TextureSource. This produces
	 * crisp downscaling of high-resolution PNGs (1024px source → ~190px
	 * device px) without the soft bilinear minification artefacts that
	 * Pixi defaults to.
	 */
	function tuneTexture(t: unknown) {
		if (!t || !(t as PIXI.Texture).source) return;
		const src = (t as PIXI.Texture).source as PIXI.TextureSource & {
			autoGenerateMipmaps?: boolean;
			updateMipmaps?: () => void;
			style?: {
				scaleMode?: string;
				magFilter?: string;
				minFilter?: string;
				mipmapFilter?: string;
				maxAnisotropy?: number;
			};
		};
		try {
			// Mipmap with NEAREST mip selection + linear in-level filtering +
			// max anisotropy. Picking a single mip level (no blend) keeps the
			// downscaled PNG visibly sharp instead of the soft trilinear look.
			src.autoGenerateMipmaps = true;
			if (src.style) {
				src.style.scaleMode = 'linear';
				src.style.magFilter = 'linear';
				src.style.minFilter = 'linear';
				src.style.mipmapFilter = 'nearest';
				src.style.maxAnisotropy = 16;
			}
			src.updateMipmaps?.();
		} catch (e) {
			console.warn('[MipmapEnabler] failed for texture', e);
		}
	}

	$effect(() => {
		const assets = ctx.stateApp?.loadedAssets;
		if (!assets) return;
		for (const [key, val] of Object.entries(assets)) {
			if (
				key.startsWith('sym_') ||
				key === 'warrior' ||
				key === 'logo' ||
				key === 'logo_day' ||
				key.startsWith('menu_')
			) {
				tuneTexture(val);
			}
		}
	});
</script>
