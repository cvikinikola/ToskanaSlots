import _ from 'lodash';
import type { RawSymbol, SymbolState } from './types';

export const BOARD_DIMENSIONS = { x: 7, y: 7 };

/** Only symbols allowed on the 7×7 grid (keep in sync with mock-rgs/math/symbols.js). */
export const GRID_SYMBOL_NAMES = [
	'H1',
	'H2',
	'H3',
	'H4',
	'L1',
	'L2',
	'L3',
	'S',
] as const;

export type GridSymbolName = (typeof GRID_SYMBOL_NAMES)[number];

const GRID_SYMBOL_SET = new Set<string>(GRID_SYMBOL_NAMES);

export const isGridSymbol = (name: string): name is GridSymbolName =>
	GRID_SYMBOL_SET.has(name.toUpperCase());

/** Fallback when book data contains a legacy/invalid symbol (e.g. M). */
export const sanitizeRawSymbol = (raw: { name?: string; scatter?: boolean }): import('./types').RawSymbol => {
	const name = String(raw?.name ?? '').toUpperCase();
	if (name === 'S') return { name: 'S', scatter: true };
	if (isGridSymbol(name) && name !== 'S') return { name: name as Exclude<GridSymbolName, 'S'> };
	return { name: 'L1' };
};

export const sanitizePaddedBoard = (board: import('./types').RawSymbol[][]): import('./types').RawSymbol[][] =>
	board.map((reel) => reel.map((sym) => sanitizeRawSymbol(sym)));

/** Cluster: 7×7 grid at 80px cells → 560×560 play area. */
export const SYMBOL_SIZE = 80;

export const BOARD_SIZES = {
	width: SYMBOL_SIZE * BOARD_DIMENSIONS.x,
	height: SYMBOL_SIZE * BOARD_DIMENSIONS.y,
};

/** Cluster: inset within 560 box so symbols sit inside the frame window. */
export const REEL_PADDING = 0.53;

export const SYMBOL_STEP_X = SYMBOL_SIZE;
export const SYMBOL_CELL_WIDTH = SYMBOL_SIZE;
export const SYMBOL_CELL_HEIGHT = SYMBOL_SIZE;

/** menu_frame.png — frame scales around the 560×560 board (cluster frame_bg ratios). */
const REEL_FRAME_NATIVE = { width: 1491, height: 1205 };
const REEL_FRAME_BASE = {
	height: 925,
	width: Math.round(925 * (REEL_FRAME_NATIVE.width / REEL_FRAME_NATIVE.height)),
};
const REEL_FRAME_BUMP = 1.03;

export const REEL_FRAME_SIZES = {
	height: Math.round(REEL_FRAME_BASE.height * REEL_FRAME_BUMP),
	width: Math.round(REEL_FRAME_BASE.width * REEL_FRAME_BUMP),
};

/** Cluster frame_bg aspect; used by ReelFramePanel and art reference. */
export const FRAME_BG_RATIO = REEL_FRAME_SIZES.width / BOARD_SIZES.width;
export const FRAME_SPRITE_SCALE = { width: 1.07, height: 1.19 };
export const FRAME_POSITION_ADJUSTMENT = 1.01;

/** Uniform frame scale bump (width + height). */
export const FRAME_SIZE_MUL = 1.04;

/** Nudge frame vs grid (px, main-layout). Negative = frame up, symbols unchanged. */
export const FRAME_OFFSET_Y = -18;

/**
 * Extra frame height (main-layout px; scales with MainContainer).
 * Anchor 0.5 at board centre — only height changes, X/Y stay cluster-aligned.
 */
export const FRAME_EXTEND_TOP = 20;
export const FRAME_EXTEND_BOTTOM = 50;

/** Cluster BoardFrame: frame_bg.png width ratio (937/806). */
export const CLUSTER_FRAME_BG_RATIO = 937 / 806;

/** Scatter (S) renders slightly larger than paying symbols. */
export const SCATTER_SYMBOL_SIZE_SCALE = 1.2;

/** Map a point from mainLayout space to canvas space (centred MainContainer). */
export const mainLayoutPointToCanvas = (
	point: { x: number; y: number },
	canvasSizes: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
) => ({
	x: canvasSizes.width * 0.5 + (point.x - mainLayout.width * 0.5) * mainLayout.scale,
	y: canvasSizes.height * 0.5 + (point.y - mainLayout.height * 0.5) * mainLayout.scale,
});

export type BgConfig = {
	key: 'bg' | 'bg_landscape' | 'bg_portrait' | 'bg_freespins';
	native: { w: number; h: number };
};

export const BG_CONFIGS: Record<'landscape' | 'portrait' | 'freespins', BgConfig> = {
	landscape: { key: 'bg_landscape', native: { w: 2560, h: 1080 } },
	portrait: { key: 'bg_portrait', native: { w: 1024, h: 1536 } },
	freespins: { key: 'bg_freespins', native: { w: 1672, h: 941 } },
};

export const getBgConfig = (
	layoutType: LayoutType,
	gameType: 'basegame' | 'freeSpins' = 'basegame',
): BgConfig => {
	if (gameType === 'freeSpins') return BG_CONFIGS.freespins;
	return layoutType === 'portrait' ? BG_CONFIGS.portrait : BG_CONFIGS.landscape;
};

export type LayoutType = 'desktop' | 'landscape' | 'tablet' | 'portrait';

/** Slightly smaller play area on wide / large screens (grid + frame scale together). */
export const getPlayAreaScale = (
	layoutType: LayoutType,
	canvasSizes: { width: number; height: number },
): number => {
	if (layoutType !== 'landscape' && layoutType !== 'desktop') return 1;

	const maxSide = Math.max(canvasSizes.width, canvasSizes.height);
	if (maxSide >= 1400) return 0.88;
	if (maxSide >= 1100) return 0.92;
	return 0.95;
};

/** Landscape/desktop: trim frame height so the cluster block looks less tall. */
export const getFrameHeightMul = (layoutType: LayoutType): number =>
	layoutType === 'landscape' || layoutType === 'desktop' ? 0.96 : 1;

/** Grid frame sprite — replace portrait/landscape PNGs when art is ready. */
export type FrameAssetKey = 'menu_frame' | 'menu_frame_portrait' | 'menu_frame_landscape';

export const getFrameAssetKey = (layoutType: LayoutType): FrameAssetKey => {
	if (layoutType === 'portrait') return 'menu_frame_portrait';
	if (layoutType === 'landscape') return 'menu_frame_landscape';
	return 'menu_frame';
};

/** 3-D overlays only — board position comes from cluster-style boardLayout(). */
export const BOARD_LAYOUT_BY_TYPE: Record<
	LayoutType,
	{ center: { x: number; y: number }; fit: { w: number; h: number } }
> = {
	desktop: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.68, h: 0.70 } },
	landscape: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.68, h: 0.70 } },
	tablet: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.97, h: 0.68 } },
	portrait: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.72, h: 0.50 } },
};

/** Cluster-style: frame/grid anchor at geometric centre of main layout. */
export const getBoardCenterFraction = (_layoutType: LayoutType) => ({ x: 0.5, y: 0.5 });

export const FRAME_PANEL_PAD = 24;

export const FRAME_PANEL_STYLE = {
	fillColor: 0x0a0c1a,
	fillAlpha: 0.94,
	innerTintColor: 0x1a2240,
	innerTintAlpha: 0.35,
	cornerRadius: 24,
	bevelColor: 0x05060f,
	bevelAlpha: 0.85,
	bevelWidth: 10,
	bevelOffset: 6,
	strokeColor: 0xd4a64a,
	strokeWidth: 6,
	innerStrokeColor: 0xffe6a8,
	innerStrokeWidth: 1.5,
	innerStrokeInset: 8,
	innerStrokeRadius: 16,
	cornerOrnamentColor: 0xf4cf78,
	cornerOrnamentDark: 0x7a5a1f,
	cornerOrnamentSize: 18,
	cornerJewelColor: 0xff3b5c,
	cornerJewelHighlight: 0xffd0d8,
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

export const getLoadingCenterFraction = (_layoutType: LayoutType) => {
	return { x: 0.5, y: 0.5 };
};

export const INITIAL_BOARD: RawSymbol[][] = [
	[
		{ name: 'H1' },
		{ name: 'L1' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' },
		{ name: 'H3' },
	],
	[
		{ name: 'L2' },
		{ name: 'H3' }, { name: 'L1' }, { name: 'H1' }, { name: 'L3' }, { name: 'H2' }, { name: 'L2' }, { name: 'H4' },
		{ name: 'L3' },
	],
	[
		{ name: 'H4' },
		{ name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H2' }, { name: 'L3' },
		{ name: 'H2' },
	],
	[
		{ name: 'L1' },
		{ name: 'H2' }, { name: 'L3' }, { name: 'H3' }, { name: 'L2' }, { name: 'H4' }, { name: 'L2' }, { name: 'H1' },
		{ name: 'L2' },
	],
	[
		{ name: 'H3' },
		{ name: 'L2' }, { name: 'H1' }, { name: 'L2' }, { name: 'H2' }, { name: 'L3' }, { name: 'H4' }, { name: 'L1' },
		{ name: 'H4' },
	],
	[
		{ name: 'L3' },
		{ name: 'H4' }, { name: 'L2' }, { name: 'H1' }, { name: 'L1' }, { name: 'H3' }, { name: 'L2' }, { name: 'H2' },
		{ name: 'L1' },
	],
	[
		{ name: 'H2' },
		{ name: 'L1' }, { name: 'H1' }, { name: 'L3' }, { name: 'L2' }, { name: 'H3' }, { name: 'L1' }, { name: 'H4' },
		{ name: 'L3' },
	],
];

export const REEL_LENGTH = BOARD_DIMENSIONS.y + 2;

/** Matches createReelForCascading fallIn column start delay. */
export const getCascadingReelFallInDelayMs = (
	reelIndex: number,
	spinOptions: Pick<typeof SPIN_OPTIONS_DEFAULT, 'reelFallInDelay' | 'reelPaddingMultiplierNormal'>,
	reelLength = REEL_LENGTH,
) => {
	const basePadding = reelLength * spinOptions.reelPaddingMultiplierNormal;
	const paddingSize = (reelIndex + 1) * basePadding;
	const fallInDelayMultiplier = paddingSize / reelLength - 1;
	return spinOptions.reelFallInDelay * fallInDelayMultiplier;
};

/** Bottom visible row index — stop sound fires once per column when this row settles. */
export const BOTTOM_ROW_INDEX = BOARD_DIMENSIONS.y - 1;

/** Lead stop SFX slightly before visual impact to compensate for audio output latency. */
export const STOP_SOUND_LEAD_MS = 40;

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

/** Symbol / tumble animation timings (ms). */
export const SYMBOL_WIN_DURATION_MS = 450;
export const SYMBOL_EXPLOSION_DURATION_MS = 450;
export const SYMBOL_LAND_DURATION_MS = 150;

const SPIN_OPTIONS_SHARED = {
	reelFallInDelay: 80,
	reelPaddingMultiplierNormal: 1.25,
	reelPaddingMultiplierAnticipated: 18,
	reelFallOutDelay: 145,
};

export const SPIN_OPTIONS_DEFAULT = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 3.5,
	symbolFallInInterval: 30,
	symbolFallInBounceSpeed: 0.15,
	symbolFallInBounceSizeMulti: 0.5,
	symbolFallOutSpeed: 3.5,
	symbolFallOutInterval: 20,
};

export const SPIN_OPTIONS_FAST = {
	...SPIN_OPTIONS_SHARED,
	symbolFallInSpeed: 7,
	symbolFallInInterval: 0,
	symbolFallInBounceSpeed: 0.3,
	symbolFallInBounceSizeMulti: 0.25,
	symbolFallOutSpeed: 7,
	symbolFallOutInterval: 0,
};

export const SYMBOL_COLORS: Record<string, number> = {
	H1: 0xd62828,
	H2: 0x06aed5,
	H3: 0x2ec27e,
	H4: 0x9b51e0,
	L1: 0xf2c14e,
	L2: 0x4cc9f0,
	L3: 0xff7d3b,
	S: 0xffb703,
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
