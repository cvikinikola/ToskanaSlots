import _ from 'lodash';
import type { RawSymbol, SymbolState } from './types';


export const SYMBOL_SIZE = 100;


export const REEL_PADDING = 0.53;


export const BOARD_DIMENSIONS = { x: 6, y: 5 };

export const SYMBOL_STEP_X = SYMBOL_SIZE * 1.15;

export const BOARD_SIZES = {
	width: SYMBOL_STEP_X * (BOARD_DIMENSIONS.x - 1) + SYMBOL_SIZE,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};


export const REEL_FRAME_SIZES = {
	width: SYMBOL_SIZE * 10.7,
	height: SYMBOL_SIZE * 7.25, // povećano za 0.5 * SYMBOL_SIZE
};


export const REEL_FRAME_OFFSET = {
	x: 0,
	y: 0,
};

export type BgConfig = {
	key: 'bg' | 'bg_landscape' | 'bg_portrait' | 'bg_freespins';
	native: { w: number; h: number };
};

export const BG_CONFIGS: Record<'landscape' | 'portrait' | 'freespins', BgConfig> = {
	landscape: { key: 'bg_landscape', native: { w: 2560, h: 1080 } },
	portrait: { key: 'bg_portrait', native: { w: 1024, h: 1536 } },
	freespins: { key: 'bg_freespins', native: { w: 1536, h: 1024 } },
};


export const getBgConfig = (
	layoutType: LayoutType,
	gameType: 'basegame' | 'freeSpins' = 'basegame',
): BgConfig => {
	if (gameType === 'freeSpins') return BG_CONFIGS.freespins;
	return layoutType === 'portrait' ? BG_CONFIGS.portrait : BG_CONFIGS.landscape;
};


export type LayoutType = 'desktop' | 'landscape' | 'tablet' | 'portrait';

export const BOARD_LAYOUT_BY_TYPE: Record<
	LayoutType,
	{ center: { x: number; y: number }; fit: { w: number; h: number } }
> = {

	desktop:   { center: { x: 0.510, y: 0.35 }, fit: { w: 0.68, h: 0.70 } },
	// QA: phone-landscape (e.g. iPhone 14 Pro Max 932×430). The shared
	// LayoutLandscape places:
	//   • bottom row (menu / buy bonus / balance / win / bet / +/-) at y≈867
	//   • right column (autospin / spin / turbo) centered around x≈1860
	// On this layout Thor + hammer 3D models are hidden (see Thor*3D.svelte)
	// so the board can use the central area without colliding. fit.h is the
	// active limit (REEL_FRAME aspect 10.7:7.25 ≈ 1.48 < main 1.78).
	// fit.h 0.68 → board H ≈ 740, bottom ≈ 432+370 = 802 (safe vs UI 867).
	// Board right edge ≈ 1502; with multiplier panel +120 main px ≈ 1622
	// (safe vs right column inner edge ≈ 1778).
	landscape: { center: { x: 0.500, y: 0.40 }, fit: { w: 0.84, h: 0.68 } },
	tablet:    { center: { x: 0.5, y: 0.44 }, fit: { w: 0.97, h: 0.68 } },
	portrait:  { center: { x: 0.5, y: 0.48 }, fit: { w: 1.2, h: 1.0 } },
};

export const getBoardCenterFraction = (layoutType: LayoutType) =>
	BOARD_LAYOUT_BY_TYPE[layoutType].center;

export const FRAME_PANEL_PAD = 24;


export const FRAME_PANEL_STYLE = {
	// Interior
	fillColor: 0x0a0c1a,
	fillAlpha: 0.94,
	innerTintColor: 0x1a2240,
	innerTintAlpha: 0.35,
	cornerRadius: 24,
	// Outer dark bevel (drop-shadow ring)
	bevelColor: 0x05060f,
	bevelAlpha: 0.85,
	bevelWidth: 10,
	bevelOffset: 6,
	// Main gold border
	strokeColor: 0xd4a64a,
	strokeWidth: 6,
	// Inner thin highlight stroke
	innerStrokeColor: 0xffe6a8,
	innerStrokeWidth: 1.5,
	innerStrokeInset: 8,
	innerStrokeRadius: 16,
	// Corner ornaments
	cornerOrnamentColor: 0xf4cf78,
	cornerOrnamentDark: 0x7a5a1f,
	cornerOrnamentSize: 18,
	cornerJewelColor: 0xff3b5c,
	cornerJewelHighlight: 0xffd0d8,
	// Top centre crown cartouche
	crownColor: 0xf4cf78,
	crownDark: 0x7a5a1f,
	crownJewelColor: 0x4ad6ff,
	crownJewelHighlight: 0xe6faff,
	crownWidth: 84,
	crownHeight: 22,
};


export const BOTTOM_UI_FRAC = 0.22;


export const BG_FILL_COLOR = 0x06091a;


export const getBgLayout = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
	gameType: 'basegame' | 'freeSpins' = 'basegame',
) => {
	const cfg = getBgConfig(layoutType, gameType);
	const cw = canvasSizes.width;
	const ch = canvasSizes.height;
	const scale = Math.max(cw / cfg.native.w, ch / cfg.native.h);
	const width = cfg.native.w * scale;
	const height = cfg.native.h * scale;
	return { x: cw / 2, y: ch / 2, width, height, cfg };
};


export const getBoardCenterMain = (
	mainLayout: { width: number; height: number },
	layoutType: LayoutType,
) => {
	const cfg = BOARD_LAYOUT_BY_TYPE[layoutType];
	const fitW = mainLayout.width * cfg.fit.w;
	const fitH = mainLayout.height * cfg.fit.h;
	const scale = Math.min(fitW / REEL_FRAME_SIZES.width, fitH / REEL_FRAME_SIZES.height);
	return {
		x: mainLayout.width * cfg.center.x,
		y: mainLayout.height * cfg.center.y,
		scale,
	};
};


export const getLoadingCenterFraction = (_layoutType: LayoutType) => {
	return { x: 0.5, y: 0.5 };
};


export const INITIAL_BOARD: RawSymbol[][] = [
	[
		{ name: 'H1' }, { name: 'L1' }, { name: 'H2' },
		{ name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H3' },
	],
	[
		{ name: 'L2' }, { name: 'H3' }, { name: 'L1' },
		{ name: 'H1' }, { name: 'L4' }, { name: 'H2' }, { name: 'L3' },
	],
	[
		{ name: 'H4' }, { name: 'L3' }, { name: 'H3' },
		{ name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H2' },
	],
	[
		{ name: 'L1' }, { name: 'H2' }, { name: 'L4' },
		{ name: 'H3' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' },
	],
	[
		{ name: 'H3' }, { name: 'L4' }, { name: 'H1' },
		{ name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' },
	],
	[
		{ name: 'L3' }, { name: 'H4' }, { name: 'L2' },
		{ name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L4' },
	],
];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';



export const SPIN_OPTIONS_DEFAULT = {
	symbolFallInSpeed: 5,
	symbolFallInInterval: 40,
	symbolFallInBounceSpeed: 2,
	symbolFallInBounceSizeMulti: 0.1,
	symbolFallOutSpeed: 8,
	symbolFallOutInterval: 20,
	reelFallInDelay: 60,
	reelPaddingMultiplierNormal: 1.5,
	reelPaddingMultiplierAnticipated: 3,
	reelFallOutDelay: 40,
};

export const SPIN_OPTIONS_FAST = {
	symbolFallInSpeed: 12,
	symbolFallInInterval: 20,
	symbolFallInBounceSpeed: 5,
	symbolFallInBounceSizeMulti: 0.05,
	symbolFallOutSpeed: 16,
	symbolFallOutInterval: 10,
	reelFallInDelay: 20,
	reelPaddingMultiplierNormal: 1,
	reelPaddingMultiplierAnticipated: 2,
	reelFallOutDelay: 20,
};



export const SYMBOL_COLORS: Record<string, number> = {
	H1: 0xd62828, // Odin's ruby      – deep red
	H2: 0x06aed5, // Thor's sapphire  – electric blue
	H3: 0x2ec27e, // Freya's emerald  – emerald green
	H4: 0x9b51e0, // Loki's amethyst  – royal purple
	L1: 0xf2c14e, // citrine          – warm gold
	L2: 0x4cc9f0, // aquamarine       – ice blue
	L3: 0xff7d3b, // garnet           – orange-red
	L4: 0xd0d6df, // moonstone        – pale silver
	S:  0xffb703, // Scatter (Viking warrior) – royal gold
	M:  0xfff3b0, // Multiplier (mead horn)   – pale gold
};


export const SYMBOL_WIN_TINT = 0xffffff;


export const SYMBOL_STATIC_TINT = 0xdddddd;


export const SCATTER_LAND_SOUND_MAP: Record<1 | 2 | 3 | 4 | 5, string> = {
	1: 'sfx_scatter_1',
	2: 'sfx_scatter_2',
	3: 'sfx_scatter_3',
	4: 'sfx_scatter_4',
	5: 'sfx_scatter_5',
};
