import type * as PIXI from 'pixi.js';

import {
	keyGlobalNeutralLightMattePixels,
	keyMagentaChromaPixels,
	keyNeutralBlackMatteFromBorders,
	rewriteTextureWithPixelPass,
} from './textureMatteUtils';

export const WIN_BADGE_TEXTURE_KEYS = ['win_big', 'win_super', 'win_mega'] as const;
export const WIN_CONGRATULATIONS_TEXTURE_KEY = 'win_congratulations';

const cutoutApplied = new WeakSet<PIXI.Texture>();

const processWinBadgePixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyMagentaChromaPixels(data);
	keyNeutralBlackMatteFromBorders(data, width, height);
	// Interior checkerboard + white fringe (same class of export artifact as logo_day).
	keyGlobalNeutralLightMattePixels(data);
};

const processCongratulationsPixels = (data: Uint8ClampedArray, width: number, height: number) => {
	keyMagentaChromaPixels(data);
	keyNeutralBlackMatteFromBorders(data, width, height);
};

export const applyWinBadgeTextureCutout = (texture: PIXI.Texture): PIXI.Texture =>
	rewriteTextureWithPixelPass(texture, cutoutApplied, processWinBadgePixels);

export const applyWinCongratulationsTextureCutout = (texture: PIXI.Texture): PIXI.Texture =>
	rewriteTextureWithPixelPass(texture, cutoutApplied, processCongratulationsPixels);

export const applyWinCelebrationTextureCutoutToAssets = (assets: Record<string, unknown>) => {
	for (const key of WIN_BADGE_TEXTURE_KEYS) {
		const tex = assets[key] as PIXI.Texture | undefined;
		if (!tex?.source) continue;
		assets[key] = applyWinBadgeTextureCutout(tex);
	}

	const congrats = assets[WIN_CONGRATULATIONS_TEXTURE_KEY] as PIXI.Texture | undefined;
	if (congrats?.source) {
		assets[WIN_CONGRATULATIONS_TEXTURE_KEY] = applyWinCongratulationsTextureCutout(congrats);
	}
};
