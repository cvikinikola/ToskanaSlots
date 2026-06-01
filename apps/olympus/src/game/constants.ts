import _ from 'lodash';
import {
	landscapeBottomReservePx,
	landscapeRightReservePx,
	landscapeTopReservePx,
	portraitBottomReservePx,
} from 'components-ui-pixi';
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

/** menu_frame.png native size — used for aspect ratio and inset math. */
const REEL_FRAME_NATIVE = { width: 1491, height: 1205 };

/** Base frame size before the small display bump (grid is derived from this). */
const REEL_FRAME_BASE = {
	height: 925,
	width: Math.round(925 * (REEL_FRAME_NATIVE.width / REEL_FRAME_NATIVE.height)),
};

/** Tiny frame bump so symbols don't clip the border art (~2%). */
const REEL_FRAME_BUMP = 1.03;

/** Outer frame sprite in board-native pixels (before board scale). */
export const REEL_FRAME_SIZES = {
	height: Math.round(REEL_FRAME_BASE.height * REEL_FRAME_BUMP),
	width: Math.round(REEL_FRAME_BASE.width * REEL_FRAME_BUMP),
};

/**
 * Playable grid inset inside frame.png (fraction of frame width/height).
 */
export const REEL_FRAME_INSETS = {
	left: 0.087,
	right: 0.087,
	top: 0.15,
	bottom: 0.083,
};

/** Visible 7×7 play area — derived from base frame minus decorative borders. */
export const BOARD_SIZES = {
	width: REEL_FRAME_BASE.width * (1 - REEL_FRAME_INSETS.left - REEL_FRAME_INSETS.right),
	height: REEL_FRAME_BASE.height * (1 - REEL_FRAME_INSETS.top - REEL_FRAME_INSETS.bottom),
};

export const SYMBOL_CELL_WIDTH = BOARD_SIZES.width / BOARD_DIMENSIONS.x;
export const SYMBOL_CELL_HEIGHT = BOARD_SIZES.height / BOARD_DIMENSIONS.y;

/** Row height for cascade reels — equals one grid cell. */
export const SYMBOL_SIZE = SYMBOL_CELL_HEIGHT;

/** Horizontal distance between reel centres — equals one grid cell. */
export const SYMBOL_STEP_X = SYMBOL_CELL_WIDTH;

/** Extra nudge for frame artwork only (positive = down). Grid stays put. */
const REEL_FRAME_NUDGE_Y = 14;

/** Frame centre offset when top/bottom insets differ (title plaque at top). */
export const REEL_FRAME_OFFSET = {
	x: 0,
	y:
		(REEL_FRAME_SIZES.height * (REEL_FRAME_INSETS.bottom - REEL_FRAME_INSETS.top)) / 2 +
		REEL_FRAME_NUDGE_Y,
};

export const REEL_PADDING = 0.53;

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

export const BOARD_LAYOUT_BY_TYPE: Record<
	LayoutType,
	{ center: { x: number; y: number }; fit: { w: number; h: number } }
> = {
	desktop: { center: { x: 0.510, y: 0.35 }, fit: { w: 0.68, h: 0.70 } },
	landscape: { center: { x: 0.510, y: 0.35 }, fit: { w: 0.68, h: 0.70 } },
	tablet: { center: { x: 0.5, y: 0.44 }, fit: { w: 0.97, h: 0.68 } },
	portrait: { center: { x: 0.5, y: 0.42 }, fit: { w: 1.05, h: 0.84 } },
};

export type CanvasSizeType =
	| 'smallMobile'
	| 'mobile'
	| 'tablet'
	| 'largeTablet'
	| 'desktop';

/** Phone portrait — smaller grid, room for logo + bottom UI. */
const PORTRAIT_PHONE_BOARD: Partial<
	Record<CanvasSizeType, { center: { x: number; y: number }; fit: { w: number; h: number } }>
> = {
	smallMobile: { center: { x: 0.5, y: 0.38 }, fit: { w: 0.96, h: 0.7 } },
	mobile: { center: { x: 0.5, y: 0.39 }, fit: { w: 0.98, h: 0.74 } },
};

/** Phone landscape — centred grid, stacked panels + buttons below. */
const LANDSCAPE_PHONE_BOARD: Partial<
	Record<CanvasSizeType, { center: { x: number; y: number }; fit: { w: number; h: number } }>
> = {
	smallMobile: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.88, h: 0.96 } },
	mobile: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.90, h: 0.96 } },
	tablet: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.92, h: 0.98 } },
	largeTablet: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.94, h: 0.98 } },
	desktop: { center: { x: 0.5, y: 0.5 }, fit: { w: 0.96, h: 0.98 } },
};

/** Canvas-height tiers — grid fills band above compact HUD. */
const landscapeBoardLayoutByHeight = (canvasHeight: number) => {
	if (canvasHeight >= 1000)
		return { center: { x: 0.5, y: 0.5 }, fit: { w: 0.96, h: 0.98 } };
	if (canvasHeight >= 820)
		return { center: { x: 0.5, y: 0.5 }, fit: { w: 0.94, h: 0.96 } };
	if (canvasHeight >= 680)
		return { center: { x: 0.5, y: 0.5 }, fit: { w: 0.90, h: 0.94 } };
	return { center: { x: 0.5, y: 0.5 }, fit: { w: 0.86, h: 0.90 } };
};

/** Square-ish landscape — grid uses almost all space above HUD. */
const ALMOST_SQUARE_LANDSCAPE_BOARD = {
	center: { x: 0.5, y: 0.5 },
	fit: { w: 0.99, h: 1.0 },
};

/** Square-ish portrait — grid uses almost all space above HUD. */
const ALMOST_SQUARE_PORTRAIT_BOARD = {
	center: { x: 0.5, y: 0.44 },
	fit: { w: 1.08, h: 0.96 },
};

/** Mild portrait (ratio ≥ 0.72) — larger grid, still room for HUD. */
const NEAR_SQUARE_PORTRAIT_BOARD = {
	center: { x: 0.5, y: 0.43 },
	fit: { w: 1.05, h: 0.92 },
};

const portraitSquareBoost = (
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare',
	canvasRatio?: number,
) => {
	if (canvasRatioType === 'almostSquare') return ALMOST_SQUARE_PORTRAIT_BOARD;
	if (canvasRatioType === 'longHeight' && canvasRatio != null && canvasRatio >= 0.72) {
		return NEAR_SQUARE_PORTRAIT_BOARD;
	}
	return undefined;
};

const compactPortraitHud = (
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare',
	canvasRatio?: number,
): 'almostSquare' | 'nearSquare' | false => {
	if (canvasRatioType === 'almostSquare') return 'almostSquare';
	if (canvasRatioType === 'longHeight' && canvasRatio != null && canvasRatio >= 0.72) {
		return 'nearSquare';
	}
	return false;
};

const landscapeBoardLayout = (
	canvasSizeType?: CanvasSizeType,
	canvasHeight?: number,
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare',
) => {
	const base = BOARD_LAYOUT_BY_TYPE.landscape;
	const fromSize = canvasSizeType ? LANDSCAPE_PHONE_BOARD[canvasSizeType] : undefined;
	const fromHeight = canvasHeight ? landscapeBoardLayoutByHeight(canvasHeight) : undefined;
	const fromAlmostSquare =
		canvasRatioType === 'almostSquare' ? ALMOST_SQUARE_LANDSCAPE_BOARD : undefined;
	return { ...base, ...fromSize, ...fromHeight, ...fromAlmostSquare };
};

const portraitBoardLayout = (
	canvasSizeType?: CanvasSizeType,
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare',
	canvasRatio?: number,
) => {
	const base = BOARD_LAYOUT_BY_TYPE.portrait;
	const phone = canvasSizeType ? PORTRAIT_PHONE_BOARD[canvasSizeType] : undefined;
	const fromSquare = portraitSquareBoost(canvasRatioType, canvasRatio);
	return phone
		? { ...base, ...phone, ...fromSquare }
		: fromSquare
			? { ...base, ...fromSquare }
			: base;
};

export const getBoardCenterFraction = (layoutType: LayoutType) =>
	BOARD_LAYOUT_BY_TYPE[layoutType].center;

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

/** Portrait top band — logo / title (fraction of main layout height). */
const PORTRAIT_STACKED_TOP_FRAC = 140 / 1422;

const stackedLayoutReserves = (
	mainHeight: number,
	layoutType: LayoutType,
	canvasSizeType?: CanvasSizeType,
	mainWidth = 1600,
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare',
	canvasRatio?: number,
): { top: number; bottom: number; right: number } => {
	if (layoutType === 'portrait') {
		const sizeType = canvasSizeType ?? 'desktop';
		const compact = compactPortraitHud(canvasRatioType, canvasRatio);
		return {
			top:
				compact === 'almostSquare'
					? mainHeight * 0.04
					: compact === 'nearSquare'
						? mainHeight * 0.06
						: mainHeight * PORTRAIT_STACKED_TOP_FRAC,
			bottom: portraitBottomReservePx(
				sizeType,
				mainHeight,
				mainWidth,
				compact || false,
			),
			right: 0,
		};
	}
	if (layoutType === 'landscape') {
		const sizeType = canvasSizeType ?? 'desktop';
		const almostSquare = canvasRatioType === 'almostSquare';
		return {
			top: landscapeTopReservePx(sizeType, mainHeight, almostSquare),
			bottom: landscapeBottomReservePx(sizeType, mainHeight, mainWidth, almostSquare),
			right: 0,
		};
	}
	if (layoutType === 'tablet') {
		return { top: 110, bottom: 400, right: 0 };
	}
	return { top: 48, bottom: 0, right: 0 };
};

const maxBoardScaleForBand = (
	bandHeight: number,
	topReserve: number,
	bottomReserve: number,
) =>
	Math.max(0, (bandHeight - topReserve - bottomReserve) / REEL_FRAME_SIZES.height);

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

export type BoardCenterViewport = {
	canvasSizes: { width: number; height: number };
	/** MainContainer scale from stateLayoutDerived.mainLayout(). */
	mainScale: number;
	canvasSizeType?: CanvasSizeType;
	canvasHeight?: number;
	canvasRatioType?: 'longWidth' | 'longHeight' | 'almostSquare';
	canvasRatio?: number;
};

export const getBoardCenterMain = (
	mainLayout: { width: number; height: number },
	layoutType: LayoutType,
	viewport?: BoardCenterViewport,
) => {
	const cfg =
		layoutType === 'portrait'
			? portraitBoardLayout(
					viewport?.canvasSizeType,
					viewport?.canvasRatioType,
					viewport?.canvasRatio,
				)
			: layoutType === 'landscape'
				? landscapeBoardLayout(
						viewport?.canvasSizeType,
						viewport?.canvasHeight,
						viewport?.canvasRatioType,
					)
				: BOARD_LAYOUT_BY_TYPE[layoutType];

	const { top: topReserve, bottom: bottomReserve, right: rightReserve } =
		stackedLayoutReserves(
			mainLayout.height,
			layoutType,
			viewport?.canvasSizeType,
			mainLayout.width,
			viewport?.canvasRatioType,
			viewport?.canvasRatio,
		);

	const effectiveBottomReserve = bottomReserve;

	const playWidth = Math.max(mainLayout.width - rightReserve, mainLayout.width * 0.55);
	const fitW = playWidth * cfg.fit.w;
	const fitH = mainLayout.height * cfg.fit.h;
	let scale = Math.min(fitW / REEL_FRAME_SIZES.width, fitH / REEL_FRAME_SIZES.height);

	scale = Math.min(
		scale,
		maxBoardScaleForBand(mainLayout.height, topReserve, effectiveBottomReserve),
	);

	if (viewport && viewport.mainScale > 0) {
		const visibleMainH = viewport.canvasSizes.height / viewport.mainScale;
		scale = Math.min(
			scale,
			maxBoardScaleForBand(visibleMainH, topReserve, effectiveBottomReserve),
		);
	}

	const frameTopFromCenter = (s: number) =>
		s * (REEL_FRAME_OFFSET.y - REEL_FRAME_SIZES.height / 2);
	const frameBottomFromCenter = (s: number) =>
		s * (REEL_FRAME_OFFSET.y + REEL_FRAME_SIZES.height / 2);

	let y: number;

	if (layoutType === 'landscape') {
		let minCenterY = topReserve - frameTopFromCenter(scale);
		let maxCenterY =
			mainLayout.height - effectiveBottomReserve - frameBottomFromCenter(scale);

		if (minCenterY > maxCenterY) {
			scale = maxBoardScaleForBand(
				viewport && viewport.mainScale > 0
					? viewport.canvasSizes.height / viewport.mainScale
					: mainLayout.height,
				topReserve,
				effectiveBottomReserve,
			);
			minCenterY = topReserve - frameTopFromCenter(scale);
			maxCenterY =
				mainLayout.height - effectiveBottomReserve - frameBottomFromCenter(scale);
		}

		y =
			minCenterY <= maxCenterY
				? (minCenterY + maxCenterY) / 2
				: minCenterY;
	} else {
		y = mainLayout.height * cfg.center.y;

		let minY = topReserve - frameTopFromCenter(scale);
		let maxY =
			mainLayout.height - effectiveBottomReserve - frameBottomFromCenter(scale);

		if (viewport && viewport.mainScale > 0) {
			const visibleMainH = viewport.canvasSizes.height / viewport.mainScale;
			const cropTop =
				layoutType === 'landscape'
					? Math.max(0, mainLayout.height - visibleMainH)
					: Math.max(0, (mainLayout.height - visibleMainH) * 0.5);
			const minYVisible = cropTop + topReserve - frameTopFromCenter(scale);
			minY = Math.max(minY, minYVisible);
		}

		if (minY > maxY) {
			scale = maxBoardScaleForBand(
				viewport && viewport.mainScale > 0
					? viewport.canvasSizes.height / viewport.mainScale
					: mainLayout.height,
				topReserve,
				effectiveBottomReserve,
			);
			minY = topReserve - frameTopFromCenter(scale);
			maxY = mainLayout.height - effectiveBottomReserve - frameBottomFromCenter(scale);
			if (viewport && viewport.mainScale > 0) {
				const visibleMainH = viewport.canvasSizes.height / viewport.mainScale;
				const cropTop =
					layoutType === 'landscape'
						? Math.max(0, mainLayout.height - visibleMainH)
						: Math.max(0, (mainLayout.height - visibleMainH) * 0.5);
				minY = Math.max(minY, cropTop + topReserve - frameTopFromCenter(scale));
			}
		}

		if (y < minY) y = minY;
		if (y > maxY) y = maxY;
	}

	if (layoutType === 'landscape' && viewport && viewport.mainScale > 0) {
		const visibleMainH = viewport.canvasSizes.height / viewport.mainScale;
		const cropTop = Math.max(0, mainLayout.height - visibleMainH);
		const minCenterY = cropTop + topReserve - frameTopFromCenter(scale);
		const maxCenterY =
			mainLayout.height - effectiveBottomReserve - frameBottomFromCenter(scale);
		if (y < minCenterY) y = minCenterY;
		if (y > maxCenterY) y = maxCenterY;
	}

	return {
		x: playWidth * cfg.center.x,
		y,
		scale,
	};
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

export const INITIAL_SYMBOL_STATE: SymbolState = 'static';

/** Symbol / tumble animation timings (ms). */
export const SYMBOL_WIN_DURATION_MS = 680;
export const SYMBOL_EXPLOSION_DURATION_MS = 720;
export const SYMBOL_LAND_DURATION_MS = 220;
export const TUMBLE_SLIDE_DURATION_MS = 420;

export const SPIN_OPTIONS_DEFAULT = {
	symbolFallInSpeed: 2.8,
	symbolFallInInterval: 140,
	symbolFallInBounceSpeed: 1.1,
	symbolFallInBounceSizeMulti: 0.1,
	symbolFallOutSpeed: 4.2,
	symbolFallOutInterval: 75,
	reelFallInDelay: 220,
	reelPaddingMultiplierNormal: 1.5,
	reelPaddingMultiplierAnticipated: 3,
	reelFallOutDelay: 150,
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
