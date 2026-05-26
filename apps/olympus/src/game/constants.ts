import _ from 'lodash';
import type { RawSymbol, SymbolState } from './types';

// ─── Board dimensions ─────────────────────────────────────────────────────────

/** Pixel size of a single symbol cell */
export const SYMBOL_SIZE = 100;

/** Visual padding as a fraction of SYMBOL_SIZE (centres the reel strip) */
export const REEL_PADDING = 0.53;

/** Visible grid: 6 reels × 5 rows */
export const BOARD_DIMENSIONS = { x: 6, y: 5 };

export const SYMBOL_STEP_X = SYMBOL_SIZE * 1.15;

export const BOARD_SIZES = {
	width: SYMBOL_STEP_X * (BOARD_DIMENSIONS.x - 1) + SYMBOL_SIZE,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

/** Artwork footprint for the wide menuBar/frame.png reel surround. */
export const REEL_FRAME_SIZES = {
	width: SYMBOL_SIZE * 10.7,
	height: SYMBOL_SIZE * 7.25, // povećano za 0.5 * SYMBOL_SIZE
};

/** Native offset for the wide frame art relative to the slot grid centre. */
export const REEL_FRAME_OFFSET = {
	x: 0,
	y: 0,
};

/**
 * Background artwork — per-orientation configs.
 *
 * The bg image is treated as **pure decorative scenery** (castle, sky,
 * lightning, Thor). The reel "frame" is NOT taken from the painted
 * artwork — it is rendered as a separate `ReelFramePanel` (dark rounded
 * panel + gold stroke) sized exactly around the live 6×5 grid. This way
 * the layout is fully deterministic on every viewport and the bg can be
 * swapped at any time without breaking alignment.
 *
 *   • Wide / desktop / tablet / landscape → `bg_landscape` (2560×1080).
 *   • Phone-portrait                       → `bg_portrait`  (1024×1536).
 *   • Free spins                           → `bg_freespins` (legacy).
 */
export type BgConfig = {
	key: 'bg' | 'bg_landscape' | 'bg_portrait' | 'bg_freespins';
	native: { w: number; h: number };
};

export const BG_CONFIGS: Record<'landscape' | 'portrait' | 'freespins', BgConfig> = {
	landscape: { key: 'bg_landscape', native: { w: 2560, h: 1080 } },
	portrait: { key: 'bg_portrait', native: { w: 1024, h: 1536 } },
	freespins: { key: 'bg_freespins', native: { w: 1536, h: 1024 } },
};

/** Pick the right bg config for the current viewport + game phase. */
export const getBgConfig = (
	layoutType: LayoutType,
	gameType: 'basegame' | 'freeSpins' = 'basegame',
): BgConfig => {
	if (gameType === 'freeSpins') return BG_CONFIGS.freespins;
	return layoutType === 'portrait' ? BG_CONFIGS.portrait : BG_CONFIGS.landscape;
};

// ─── Board placement (purely layout-driven) ───────────────────────────────────
/**
 * Per-orientation board placement inside `mainLayout`.
 *   • `center` — board centre as fraction of mainLayout (x, y).
 *   • `fit`    — max width/height the board may occupy as fraction of
 *                mainLayout. Board is uniformly scaled to fit inside this
 *                rectangle while preserving its native 6×5 aspect.
 */
export type LayoutType = 'desktop' | 'landscape' | 'tablet' | 'portrait';

export const BOARD_LAYOUT_BY_TYPE: Record<
	LayoutType,
	{ center: { x: number; y: number }; fit: { w: number; h: number } }
> = {
	// On desktop/landscape the bottom UI strip eats ~BOTTOM_UI_FRAC (0.22)
	// of the canvas, so the playfield's vertical mid-point sits at
	// (1 - 0.22) / 2 ≈ 0.39 and the board may use at most ~0.66 of the
	// canvas height before the gold frame would clip the BALANCE / WIN /
	// BET row. Width is also tightened so the frame stays well clear of
	// the side art (castle / Thor) at typical 16:9 ratios.
	// Tighter desktop/landscape sizing: matches the original sprite-frame
	// footprint (~45% canvas width, ~55% canvas height) and sits clearly
	// above the BALANCE / WIN / BET row + button row at the bottom.
	desktop:   { center: { x: 0.5, y: 0.35 }, fit: { w: 0.68, h: 0.70 } },
	landscape: { center: { x: 0.5, y: 0.35 }, fit: { w: 0.68, h: 0.70 } },
	tablet:    { center: { x: 0.5, y: 0.44 }, fit: { w: 0.97, h: 0.68 } },
	portrait:  { center: { x: 0.5, y: 0.44 }, fit: { w: 0.99, h: 0.68 } },
};

export const getBoardCenterFraction = (layoutType: LayoutType) =>
	BOARD_LAYOUT_BY_TYPE[layoutType].center;

/**
 * Outer padding of the painted reel-frame panel around the live symbols
 * (in board-native pixels — same coordinate space as `BOARD_SIZES`).
 * Used by `ReelFramePanel` so the gold border sits cleanly OUTSIDE the
 * symbol cells without clipping them.
 */
export const FRAME_PANEL_PAD = 24;

/**
 * Visual style of the drawn reel-frame panel (sits behind the board).
 *
 * "Royale" multi-layer look — deep navy interior, double gold border with
 * a thin inner highlight, jewel-studded corner medallions and a small
 * crown cartouche centred on the top edge. All purely vector so it stays
 * crisp at every scale and needs no extra art assets.
 */
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

// ─── Responsive bg layout ─────────────────────────────────────────────────────
/**
 * Vertical fraction of the canvas reserved for the bottom UI strip
 * (BALANCE / WIN / BET row + button row).
 */
export const BOTTOM_UI_FRAC = 0.22;

/** Solid colour shown behind the bg sprite while the texture loads. */
export const BG_FILL_COLOR = 0x06091a;

/**
 * Cover-fits the bg sprite to the full canvas — pure scenery, no
 * frame-anchoring tricks. The reel frame is rendered separately by
 * `ReelFramePanel` so this just needs to fill every pixel.
 */
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

/**
 * Live board centre / pivot / scale in MAIN-LOCAL coordinates.
 *
 * Driven entirely by `mainLayout` + `layoutType` (no dependence on the
 * bg artwork) — so the 6×5 grid sits at a deterministic, well-tested
 * spot inside the playfield on every viewport, and the matching
 * `ReelFramePanel` always wraps it perfectly.
 */
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

/** Loading-screen content centre — visually centred on the canvas, so
 * the title logo sits in the middle of the screen rather than tracking
 * the (now lifted) board centre.
 */
export const getLoadingCenterFraction = (_layoutType: LayoutType) => {
	return { x: 0.5, y: 0.5 };
};

// ─── Initial board ────────────────────────────────────────────────────────────
/**
 * 6 reels × 7 symbols each (5 visible + 1 top padding + 1 bottom padding).
 * Padding symbols are hidden by the board mask during gameplay.
 * Layout: [topPadding, row0, row1, row2, row3, row4, bottomPadding]
 */
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

/** State all reel symbols start in before the first spin */
export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

// ─── Cascade (fall) physics ───────────────────────────────────────────────────

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

// ─── Symbol placeholder colours (Viking gem palette) ─────────────────────────
/**
 * Castle of Valhalla – placeholder gem colours per symbol.
 * Replace with real spine/sprite assets when artwork is ready.
 * High-tier symbols are the four Norse rune-gems, low-tier are royal-cut jewels.
 */
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

/** Colour overlay applied when a symbol is in the 'win' animation state */
export const SYMBOL_WIN_TINT = 0xffffff;

/** Colour when in 'static' state */
export const SYMBOL_STATIC_TINT = 0xdddddd;

// ─── Sound map for scatter landings ──────────────────────────────────────────

export const SCATTER_LAND_SOUND_MAP: Record<1 | 2 | 3 | 4 | 5, string> = {
	1: 'sfx_scatter_1',
	2: 'sfx_scatter_2',
	3: 'sfx_scatter_3',
	4: 'sfx_scatter_4',
	5: 'sfx_scatter_5',
};
