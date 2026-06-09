import type * as PIXI from 'pixi.js';

import {
	keyNeutralBlackMatteFromBorders,
	rewriteTextureWithPixelPass,
} from './textureMatteUtils';

export const LOGO_TEXTURE_KEYS = ['logo', 'logo_day'] as const;

const cutoutApplied = new WeakSet<PIXI.Texture>();

/**
 * Export chroma-key fringe (#FF00FF family). Grape purple stays — lower R/B, higher G.
 */
export const isMagentaChromaPixel = (r: number, g: number, b: number, a: number) => {
	if (a < 8) return false;
	if (r < 130 || b < 130) return false;
	if (g > 95) return false;
	if (r - g < 70 || b - g < 70) return false;
	return true;
};

const keyMagentaChromaPixels = (data: Uint8ClampedArray) => {
	for (let i = 0; i < data.length; i += 4) {
		if (isMagentaChromaPixel(data[i], data[i + 1], data[i + 2], data[i + 3])) {
			data[i] = 0;
			data[i + 1] = 0;
			data[i + 2] = 0;
			data[i + 3] = 0;
		}
	}
};

const processLogoPixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyMagentaChromaPixels(data);
	keyNeutralBlackMatteFromBorders(data, width, height);
};

export const applyLogoTextureCutout = (texture: PIXI.Texture): PIXI.Texture =>
	rewriteTextureWithPixelPass(texture, cutoutApplied, processLogoPixels);

export const applyLogoTextureCutoutToAssets = (
	assets: Record<string, unknown>,
	keys: readonly string[] = LOGO_TEXTURE_KEYS,
) => {
	for (const key of keys) {
		const tex = assets[key] as PIXI.Texture | undefined;
		if (!tex?.source) continue;
		assets[key] = applyLogoTextureCutout(tex);
	}
};
