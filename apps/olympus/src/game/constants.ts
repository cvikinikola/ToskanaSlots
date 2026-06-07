import _ from 'lodash';
import type { RawSymbol, SymbolState } from './types';
import { getDestroyAnimDurationMs } from './destroyAnim';


export const SYMBOL_SIZE = 100;

/** Base drawn sprite size before per-symbol scale tweaks. */
export const SYMBOL_SPRITE_BASE = SYMBOL_SIZE * 1.04;

/** Ostale voćkice (vino, sir, masline, …) — sym_h1, sym_h2, sym_h4, sym_l2. */
export const SYMBOL_SPRITE_SCALE = 0.95;

/** Grožđe (sym_h3 crno, sym_h4 crveno, sym_l1 belo) — manja od ostalih voćkica. */
export const GRAPE_SYMBOL_SPRITE_SCALE = 0.882;
export const GRAPE_SYMBOL_NAMES = new Set(['H3', 'H4', 'L1']);

/** Belo grožđe (L1) — 4% manje od sym_h3. */
export const GREEN_GRAPE_SYMBOL_SPRITE_SCALE = GRAPE_SYMBOL_SPRITE_SCALE * 0.96;

export const SYMBOL_SPRITE_SCALE_BY_NAME: Record<string, number> = {
	L1: GREEN_GRAPE_SYMBOL_SPRITE_SCALE,
	H4: SYMBOL_SPRITE_SCALE * 0.90, // sym_h4 — samo ovo voće −3%
};

export const SYMBOL_DRAW_MAX_SCALE = SYMBOL_SPRITE_SCALE;

/** Largest half-height/width of any symbol sprite (px). */
export const SYMBOL_DRAW_HALF = (SYMBOL_SPRITE_BASE * SYMBOL_DRAW_MAX_SCALE) / 2;

export const BOARD_DIMENSIONS = { x: 7, y: 7 };


/** Okvir kraći samo po dužini (širina); visina i mreža 7×7 ostaju iste. */
export const REEL_FRAME_LENGTH_SCALE = 0.85;

const REEL_FRAME_BASE_WIDTH = SYMBOL_SIZE * 10.7;
const REEL_FRAME_BASE_HEIGHT = SYMBOL_SIZE * 7.25;

/** Fit na ekran — ne menja se, da voćkice zadrže istu veličinu. */
export const REEL_FRAME_LAYOUT_SIZES = {
	width: REEL_FRAME_BASE_WIDTH,
	height: REEL_FRAME_BASE_HEIGHT,
};

/** Crtani okvir + sidrenje panela (MULTIPLIER, TUMBLE HISTORY, …). */
export const REEL_FRAME_SIZES = {
	width: REEL_FRAME_BASE_WIDTH * REEL_FRAME_LENGTH_SCALE,
	height: REEL_FRAME_BASE_HEIGHT,
};

/**
 * Playable width inside menu_frame (horizontal). Tune if symbols sit inside/outside
 * the gold border — higher = grid reaches closer to the frame inner edge.
 */
export const REEL_FRAME_INNER_WIDTH_RATIO = 0.91;

export const BOARD_INNER_WIDTH = REEL_FRAME_SIZES.width * REEL_FRAME_INNER_WIDTH_RATIO;

/** Horizontal pitch — outer sprite edges stay inside inner frame width. */
export const REEL_STEP_X =
	(BOARD_INNER_WIDTH - 2 * SYMBOL_DRAW_HALF) / (BOARD_DIMENSIONS.x - 1);

/** Playable height inside menu_frame — lower = more vertical inset (symbols off the wall). */
export const REEL_FRAME_INNER_HEIGHT_RATIO = 0.93;

export const BOARD_INNER_HEIGHT = REEL_FRAME_SIZES.height * REEL_FRAME_INNER_HEIGHT_RATIO;

/** Vertical pitch — outer sprite edges stay inside inner frame height. */
export const REEL_STEP_Y =
	(BOARD_INNER_HEIGHT - 2 * SYMBOL_DRAW_HALF) / (BOARD_DIMENSIONS.y - 1);

/** Aligns reel `(i+0.5)×step` layout with `SYMBOL_DRAW_HALF + i×step`. */
export const BOARD_SYMBOL_OFFSET_Y = SYMBOL_DRAW_HALF - REEL_STEP_Y * 0.5;

export const BOARD_SIZES = {
	width: BOARD_INNER_WIDTH,
	height: BOARD_INNER_HEIGHT,
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
	// Vineyard background (same asset; native matches PNG aspect for cover-fit).
	landscape: { key: 'bg_landscape', native: { w: 320, h: 178 } },
	portrait: { key: 'bg_portrait', native: { w: 320, h: 178 } },
	freespins: { key: 'bg_freespins', native: { w: 320, h: 178 } },
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
	portrait:  { center: { x: 0.5, y: 0.43 }, fit: { w: 1.2, h: 1.0 } },
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

/** Looping vineyard background (MP4, muted autoplay). */
export const BG_VIDEO_BASE_SRC = '/assets/sprites/menuBar/bg_night.mp4';
export const BG_VIDEO_FREESPIN_SRC = '/assets/sprites/thor/bg_landscape.mp4';


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
	const scale = Math.min(
		fitW / REEL_FRAME_LAYOUT_SIZES.width,
		fitH / REEL_FRAME_LAYOUT_SIZES.height,
	);
	return {
		x: mainLayout.width * cfg.center.x,
		y: mainLayout.height * cfg.center.y,
		scale,
	};
};


export const getLoadingCenterFraction = (_layoutType: LayoutType) => {
	return { x: 0.5, y: 0.5 };
};


/** Per reel: top padding + 7 visible rows + bottom padding (9 symbols). */
export const INITIAL_BOARD: RawSymbol[][] = [
	[
		{ name: 'H1' }, { name: 'L1' }, { name: 'H2' },
		{ name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'H1' },
	],
	[
		{ name: 'L2' }, { name: 'H3' }, { name: 'L1' },
		{ name: 'H1' }, { name: 'L1' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' },
	],
	[
		{ name: 'H4' }, { name: 'L3' }, { name: 'H3' },
		{ name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H2' }, { name: 'L1' }, { name: 'H4' },
	],
	[
		{ name: 'L1' }, { name: 'H2' }, { name: 'L1' },
		{ name: 'H3' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' },
	],
	[
		{ name: 'H3' }, { name: 'L1' }, { name: 'H1' },
		{ name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L3' }, { name: 'H3' },
	],
	[
		{ name: 'L3' }, { name: 'H4' }, { name: 'L2' },
		{ name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L1' }, { name: 'H2' }, { name: 'L3' },
	],
	[
		{ name: 'H2' }, { name: 'L1' }, { name: 'H1' },
		{ name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L1' }, { name: 'H2' },
	],
];

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';



export const SPIN_OPTIONS_DEFAULT = {
	symbolFallInSpeed: 3,
	symbolFallInInterval: 65,
	symbolFallInBounceSpeed: 1.2,
	symbolFallInBounceSizeMulti: 0.1,
	symbolFallOutSpeed: 5,
	symbolFallOutInterval: 35,
	reelFallInDelay: 100,
	reelPaddingMultiplierNormal: 1.5,
	reelPaddingMultiplierAnticipated: 3,
	reelFallOutDelay: 70,
};

export const SPIN_OPTIONS_FAST = {
	symbolFallInSpeed: 8,
	symbolFallInInterval: 35,
	symbolFallInBounceSpeed: 3,
	symbolFallInBounceSizeMulti: 0.05,
	symbolFallOutSpeed: 10,
	symbolFallOutInterval: 18,
	reelFallInDelay: 40,
	reelPaddingMultiplierNormal: 1,
	reelPaddingMultiplierAnticipated: 2,
	reelFallOutDelay: 35,
};

/** Cascade / tumble animation timings (ms). */
export const TUMBLE_OPTIONS = {
	/**
	 * Constant fall velocity (px per ms) for cascade refill — mirrors a regular
	 * spin where every symbol shares one speed and arrives staggered by distance.
	 * Lower = slower. Replaces the old fixed-duration drop, which made far-falling
	 * refill symbols race ahead of short-dropping kept symbols.
	 */
	fallSpeedPxPerMs: 0.6,
	/** Floor so a 1-row drop still reads as a deliberate move. */
	fallMinDurationMs: 150,
	/**
	 * Stagger (ms) between consecutive new-refill fruits in the same column so
	 * they land bottom→top IN ORDER (never "istumbano"). They still fall
	 * continuously (no freezing) — only their start is offset by this amount.
	 */
	refillStaggerMs: 90,
	/** Pause after win flash so the tumble-win panel is readable before destroy. */
	winSettleHoldMs: 650,
	winSettleHoldTurboMs: 280,
	explosionDurationMs: getDestroyAnimDurationMs(false),
	explosionDurationTurboMs: getDestroyAnimDurationMs(true),
	winDurationMs: 650,
	winDurationTurboMs: 500,
	landDurationMs: 200,
};

export const SYMBOL_COLORS: Record<string, number> = {
	H1: 0xd62828, // Red Wine Bottle – deep red
	H2: 0x06aed5, // Pecorino Cheese – warm blue
	H3: 0x2ec27e, // Black Grapes – emerald green
	H4: 0x9b51e0, // Red Grapes – royal purple
	L1: 0xf2c14e, // White Grapes – warm gold
	L2: 0x4cc9f0, // Olives – ice blue
	L3: 0xff7d3b, // Sunflower – orange
	L4: 0xd0d6df, // legacy L4 – pale silver
	S:  0xffb703, // Vinar scatter – royal gold
	M:  0xfff3b0, // Multiplier UI – pale gold
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
