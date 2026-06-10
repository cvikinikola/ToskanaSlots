import type * as PIXI from 'pixi.js';

import {
	keyGlobalNeutralLightMattePixels,
	keyMagentaChromaPixels,
	keyNeutralBlackMatteFromBorders,
	keyNeutralLightMatteFromBorders,
	rewriteTextureWithPixelPass,
} from './textureMatteUtils';

export { isMagentaChromaPixel } from './textureMatteUtils';

export const LOGO_TEXTURE_KEYS = ['logo', 'logo_day'] as const;

const cutoutApplied = new WeakSet<PIXI.Texture>();

const processNightLogoPixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyMagentaChromaPixels(data);
	keyNeutralBlackMatteFromBorders(data, width, height);
};

/** Day logo export uses white/checkerboard matte instead of black. */
const processDayLogoPixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyMagentaChromaPixels(data);
	keyNeutralLightMatteFromBorders(data, width, height);
	// Outer halo + interior checkerboard baked into PNG.
	keyGlobalNeutralLightMattePixels(data, 168, 22);
	// Semi-transparent white fringe around letter edges.
	keyGlobalNeutralLightMattePixels(data, 148, 16);
};

export const applyLogoTextureCutout = (texture: PIXI.Texture, key: string): PIXI.Texture =>
	rewriteTextureWithPixelPass(
		texture,
		cutoutApplied,
		key === 'logo_day' ? processDayLogoPixels : processNightLogoPixels,
	);

export const applyLogoTextureCutoutToAssets = (
	assets: Record<string, unknown>,
	keys: readonly string[] = LOGO_TEXTURE_KEYS,
) => {
	for (const key of keys) {
		const tex = assets[key] as PIXI.Texture | undefined;
		if (!tex?.source) continue;
		assets[key] = applyLogoTextureCutout(tex, key);
	}
};
