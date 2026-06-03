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

/** Cluster default — keeps even gaps between columns. */
export const REEL_PADDING = 0.53;

export const SYMBOL_STEP_X = SYMBOL_SIZE;
export const SYMBOL_CELL_WIDTH = SYMBOL_SIZE;
export const SYMBOL_CELL_HEIGHT = SYMBOL_SIZE;

/** Portrait main-layout width — square frame fills this (see menuBar/frame.png). */
export const OLYMPUS_PORTRAIT_FRAME_SIDE = 800;

/** Native grid frame art — `static/assets/sprites/menuBar/frame.png`. */
export const MENU_FRAME_NATIVE = { width: 500, height: 500 };

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

/** Icon size vs 80px cell (512px art transparent margins). */
export const SYMBOL_SPRITE_FILL = 1.14;

/** Portrait: outer frame side ÷ 560px grid (grid/voćke scale separately). */
export const PORTRAIT_FRAME_TO_GRID = 1.22;

/** Portrait: frame-only shrink so vine border is not clipped on screen edges. */
export const PORTRAIT_FRAME_EDGE_INSET = 0.93;

/** Square frame.png display side ÷ board width (ReelFramePanel). */
export const FRAME_BG_RATIO = PORTRAIT_FRAME_TO_GRID * FRAME_SIZE_MUL;

/** Nudge grid vs frame (main-layout px). +Y = symbols down. */
export const GRID_NUDGE_Y = 4;

/** Shift grid up as fraction of board height (frame unchanged). -0.02 = 2% up. */
export const GRID_OFFSET_Y_RATIO = -0.02;

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

/** Square / kockasti monitor (utils-layout `almostSquare`, landscape branch). */
export const isAlmostSquareCanvas = (canvasSizes: { width: number; height: number }) => {
	const r = canvasSizes.width / (canvasSizes.height || 1);
	return r >= 0.85 && r <= 1.2;
};

/** Grid + frame boost on square landscape — portrait untouched. */
export const ALMOST_SQUARE_PLAY_AREA_MUL = 1.61;

/** HUD icons/plates on square landscape (offsets shared `applyLandscapeUiRuntime` 0.88 shrink). */
export const ALMOST_SQUARE_HUD_MUL = 1.56;

/** Extra SPIN scale on square landscape (right column only). */
export const ALMOST_SQUARE_SPIN_MUL = 1.32;

/** Wider/taller BALANCE | WIN | BET shelf on square landscape (labels above plates). */
export const ALMOST_SQUARE_SHELF = {
	innerWidthRatio: 0.98,
	panelGapX: 4,
	plateSizeMul: 1.15,
	plateHeightMul: 1.24,
	valueFontMul: 1.05,
	/** Visual edge gap between +/- and SPIN on square landscape (px; negative = overlap padding). */
	stackTouchGapPx: -6,
	/** SPIN sprite has transparent rim — shrink visual half for stack math. */
	spinVisualHalfMul: 0.86,
} as const;

/** Shift bottom HUD cluster up on square landscape (px; avoids canvas clip at bottom). */
export const ALMOST_SQUARE_HUD_NUDGE_UP = 14;

/** Slightly smaller play area on wide cinematic screens only (not square). */
export const getPlayAreaScale = (
	layoutType: LayoutType,
	canvasSizes: { width: number; height: number },
): number => {
	if (layoutType !== 'landscape' && layoutType !== 'desktop') return 1;
	if (isAlmostSquareCanvas(canvasSizes)) return 1;

	const maxSide = Math.max(canvasSizes.width, canvasSizes.height);
	if (maxSide >= 1400) return 0.88;
	if (maxSide >= 1100) return 0.92;
	return 0.95;
};

/** Portrait: zoom grid + frame together (symbols keep even spacing). */
export const GRID_DISPLAY_SCALE: Partial<Record<LayoutType, number>> = {
	portrait: 1.17,
	tablet: 1.02,
};

/** Uniform portrait bump — grid, voćke, and frame scale together. */
export const PORTRAIT_PLAY_AREA_MUL = 1.1;

export const getBoardDisplayScale = (
	layoutType: LayoutType,
	canvasSizes: { width: number; height: number },
) => {
	const base =
		getPlayAreaScale(layoutType, canvasSizes) * (GRID_DISPLAY_SCALE[layoutType] ?? 1);
	if (layoutType === 'portrait') return base * PORTRAIT_PLAY_AREA_MUL;
	if (
		isAlmostSquareCanvas(canvasSizes) &&
		(layoutType === 'landscape' || layoutType === 'desktop' || layoutType === 'tablet')
	) {
		return base * ALMOST_SQUARE_PLAY_AREA_MUL;
	}
	return base;
};

/** Landscape/desktop: trim frame height so the cluster block looks less tall. */
export const getFrameHeightMul = (layoutType: LayoutType): number =>
	layoutType === 'landscape' || layoutType === 'desktop' ? 0.96 : 1;

/** Display size for BoardFrame (local px; BoardFrame Container applies boardLayout.scale). */
export const getBoardFrameDisplaySize = (
	boardLayout: { width: number; scale?: number },
	layoutType: LayoutType,
	almostSquare = false,
): { width: number; height: number } => {
	const frameHeightMul = getFrameHeightMul(layoutType);
	const squareFrame =
		layoutType === 'portrait' || (layoutType === 'landscape' && almostSquare);
	const mul = squareFrame
		? PORTRAIT_FRAME_TO_GRID * PORTRAIT_FRAME_EDGE_INSET
		: PORTRAIT_FRAME_TO_GRID * FRAME_SIZE_MUL * frameHeightMul;
	const side = boardLayout.width * mul;
	return { width: side, height: side };
};

/** Frame bounds in main-layout space (includes board scale). */
export const getBoardFrameVisualSize = (
	boardLayout: { width: number; scale?: number },
	layoutType: LayoutType,
	almostSquare = false,
) => {
	const { width, height } = getBoardFrameDisplaySize(boardLayout, layoutType, almostSquare);
	const s = boardLayout.scale ?? 1;
	return { width: width * s, height: height * s };
};

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
