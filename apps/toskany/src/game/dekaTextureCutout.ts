import type * as PIXI from 'pixi.js';

import {
	keyNeutralBlackMatteFromBorders,
	rewriteTextureWithPixelPass,
} from './textureMatteUtils';

/** Export matte is neutral near-black (RGB ≈ 0). */
export const DEKA_MATTE_MAX_RGB = 10;

/** Neutral matte only — dark brown shadows have R > B and must not be keyed. */
export const DEKA_MATTE_MAX_CHROMA = 6;

const cutoutApplied = new WeakSet<PIXI.Texture>();

const processDekaPixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyNeutralBlackMatteFromBorders(
		data,
		width,
		height,
		DEKA_MATTE_MAX_RGB,
		DEKA_MATTE_MAX_CHROMA,
	);
};

/**
 * Deka frames are exported with an opaque black matte (RGB 0) instead of alpha 0.
 * Only border-connected matte pixels are keyed — interior shadows stay solid.
 */
export const applyDekaBlackBackgroundCutout = (texture: PIXI.Texture): PIXI.Texture =>
	rewriteTextureWithPixelPass(texture, cutoutApplied, processDekaPixels);

export const applyDekaBlackBackgroundCutoutToAssets = (
	assets: Record<string, unknown>,
	keys: readonly string[],
) => {
	for (const key of keys) {
		const tex = assets[key] as PIXI.Texture | undefined;
		if (!tex?.source) continue;
		assets[key] = applyDekaBlackBackgroundCutout(tex);
	}
};
