import {
	getBgLayout,
	getBoardCenterMain,
	REEL_FRAME_SIZES,
	type LayoutType,
} from './constants';

export type DekaGameType = 'basegame' | 'freeSpins';

/** Native pixel size — all deka v2 frames share the same 1536×1024 canvas. */
export const DEKA_NATIVE = { w: 1536, h: 1024 } as const;

// ─── Idle breathing (container scale, pivot at feet) ─────────────────────────
export const BREATH_SCALE_MIN = 1.0;
export const BREATH_SCALE_MAX = 1.005;
export const BREATH_DURATION_MS = 4000;

// ─── Blink (instant alpha swap) ───────────────────────────────────────────────
export const BLINK_INTERVAL_MIN_MS = 3000;
export const BLINK_INTERVAL_MAX_MS = 5000;
export const BLINK_HOLD_MS = 110;

// ─── Toast (crossfade — full redraw, never hard-cut) ─────────────────────────
export const TOAST_INTERVAL_MIN_MS = 9000;
export const TOAST_INTERVAL_MAX_MS = 11000;
export const TOAST_CROSSFADE_MS = 400;
export const TOAST_HOLD_MS = 1500;

// ─── BESIDE placement (fractions relative to cover-fit background rect) ───────
/** Horizontal position — 0 = bg left edge, 1 = bg right edge (feet anchor point). */
export const DEKA_X_FRAC = 0.86;
/**
 * Almost-square horizontal screens (tablet layout, ratio ≈ 0.8–1.3, w > h).
 * Slightly left of DEKA_X_FRAC — tuned at ~1019×906 reference.
 */
export const DEKA_BESIDE_TABLET_X_FRAC = 0.824;
/** Distance inset from bg bottom edge (fraction of bg height). */
export const DEKA_BOTTOM_INSET_FRAC = 0.02;
/** Deka sprite height as fraction of background height (desktop baseline). */
export const DEKA_HEIGHT_FRAC = 0.8;

/** Global size multiplier applied everywhere (0.8 = 20% smaller). */
export const DEKA_GLOBAL_SCALE = 0.8;

/** Warm tint — tones down blown highlights and fringe bleed on cutout PNGs. */
export const DEKA_SPRITE_TINT = 0xe0d8d0;

/** ColorMatrix brightness for deka layers (1 = unchanged, lower = darker). */
export const DEKA_BRIGHTNESS = 0.9;

/** Reference viewport at which deka renders at full designed size (desktop baseline). */
export const DEKA_REF_CANVAS_WIDTH = 1422;
export const DEKA_REF_CANVAS_HEIGHT = 800;

/** Min scale so deka stays readable on very small viewports. */
export const DEKA_MIN_SCREEN_SCALE = 0.55;

/**
 * Sakrij deku samo na ovom viewport profilu (~851×829, tablet skoro kvadrat).
 * Uski opseg da 748×682, 917×906 i širi tablet ostaju netaknuti.
 */
export const DEKA_HIDE_VIEWPORT = {
	minWidth: 820,
	maxWidth: 880,
	minHeight: 800,
	maxHeight: 860,
} as const;

export const isDekaHiddenViewport = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
) =>
	layoutType === 'tablet' &&
	canvasSizes.width >= DEKA_HIDE_VIEWPORT.minWidth &&
	canvasSizes.width <= DEKA_HIDE_VIEWPORT.maxWidth &&
	canvasSizes.height >= DEKA_HIDE_VIEWPORT.minHeight &&
	canvasSizes.height <= DEKA_HIDE_VIEWPORT.maxHeight;

/**
 * BESIDE mode hides when the sprite's right edge would exceed the canvas.
 * With anchor (0.5, 1): rightEdge = x + width / 2.
 */
export const DEKA_BESIDE_EDGE_PAD_PX = 4;

// ─── HEADER placement (portrait — sky slot top-right, anchored to frame) ─────
/** Sprite height as fraction of reel-frame height (portrait). */
export const DEKA_HEADER_HEIGHT_FRAC = 0.65;
/** Waist-up clip — fraction of sprite height kept visible. */
export const DEKA_HEADER_VISIBLE_HEIGHT_FRAC = 0.56;
/** Offset from frame top-right after waist alignment (+Y = lower onto frame wood). */
export const DEKA_HEADER_OFFSET_X_FRAC = -0.22;
export const DEKA_HEADER_OFFSET_Y_FRAC = 0.03;
export const DEKA_HEADER_Z_INDEX = -9;
export const DEKA_BESIDE_Z_INDEX = -9;

export type DekaDisplayMode = 'beside' | 'header' | 'hidden';

export type DekaLayout = {
	mode: DekaDisplayMode;
	x: number;
	y: number;
	width: number;
	height: number;
	layoutScale: number;
	anchor: { x: number; y: number };
	zIndex: number;
	visibleHeightFrac: number;
};

/** Scales deka down proportionally when either canvas dimension is below reference. */
export const getDekaScreenScale = (canvasSizes: { width: number; height: number }) => {
	const sx = canvasSizes.width / DEKA_REF_CANVAS_WIDTH;
	const sy = canvasSizes.height / DEKA_REF_CANVAS_HEIGHT;
	return Math.min(1, Math.max(DEKA_MIN_SCREEN_SCALE, Math.min(sx, sy)));
};

export const getReelFrameCanvasRect = (
	canvasSizes: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
	layoutType: LayoutType,
) => {
	const board = getBoardCenterMain(mainLayout, layoutType);
	const frameScale = board.scale * mainLayout.scale;
	const width = REEL_FRAME_SIZES.width * frameScale;
	const height = REEL_FRAME_SIZES.height * frameScale;
	const cx =
		canvasSizes.width * 0.5 + (board.x - mainLayout.width * 0.5) * mainLayout.scale;
	const cy =
		canvasSizes.height * 0.5 + (board.y - mainLayout.height * 0.5) * mainLayout.scale;
	return {
		left: cx - width / 2,
		right: cx + width / 2,
		top: cy - height / 2,
		bottom: cy + height / 2,
		width,
		height,
	};
};

export const getBesideDekaRect = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
	gameType: DekaGameType = 'basegame',
) => {
	const bg = getBgLayout(canvasSizes, layoutType, gameType);
	const screenScale = getDekaScreenScale(canvasSizes);
	const height = bg.height * DEKA_HEIGHT_FRAC * screenScale * DEKA_GLOBAL_SCALE;
	const width = DEKA_NATIVE.w * (height / DEKA_NATIVE.h);
	const xFrac = getBesideDekaXFrac(canvasSizes, layoutType);
	const x = bg.x - bg.width * 0.5 + bg.width * xFrac;
	const y = bg.y + bg.height * 0.5 - bg.height * DEKA_BOTTOM_INSET_FRAC;
	return { x, y, width, height, screenScale };
};

/** Right edge of BESIDE sprite in canvas space (anchor 0.5, 1). */
export const getBesideDekaRightEdge = (beside: { x: number; width: number }) =>
	beside.x + beside.width * 0.5;

export const besideDekaClipsCanvas = (
	beside: { x: number; width: number },
	canvasWidth: number,
) => getBesideDekaRightEdge(beside) > canvasWidth - DEKA_BESIDE_EDGE_PAD_PX;

/** Tablet / kockasti horizontal — iste proporcije kao ~1019×906 (ratio 0.8–1.3). */
export const isAlmostSquareHorizontal = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
) =>
	layoutType === 'tablet' &&
	canvasSizes.width > canvasSizes.height;

export const getBesideDekaXFrac = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
) => (isAlmostSquareHorizontal(canvasSizes, layoutType) ? DEKA_BESIDE_TABLET_X_FRAC : DEKA_X_FRAC);

/**
 * Display mode:
 * - portrait → header (tumble panels gore)
 * - desktop / phone-landscape → beside (uvek, originalna pozicija)
 * - tablet horizontal (width > height) → beside — browser landscape / kockasti širok
 * - tablet kvadratni (width ≤ height) → hidden — nema mesta pored grida
 */
export const getDekaDisplayMode = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
	_gameType: DekaGameType = 'basegame',
): DekaDisplayMode => {
	if (layoutType === 'portrait') return 'header';
	if (isDekaHiddenViewport(canvasSizes, layoutType)) return 'hidden';
	if (layoutType === 'desktop' || layoutType === 'landscape') return 'beside';
	if (canvasSizes.width > canvasSizes.height) return 'beside';
	return 'hidden';
};

export const getDekaLayout = (
	canvasSizes: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
	layoutType: LayoutType,
	gameType: DekaGameType = 'basegame',
): DekaLayout | null => {
	const mode = getDekaDisplayMode(canvasSizes, layoutType, gameType);
	const beside = getBesideDekaRect(canvasSizes, layoutType, gameType);

	if (mode === 'hidden') return null;

	if (mode === 'header') {
		const frame = getReelFrameCanvasRect(canvasSizes, mainLayout, layoutType);
		const height = frame.height * DEKA_HEADER_HEIGHT_FRAC;
		const width = DEKA_NATIVE.w * (height / DEKA_NATIVE.h);
		/** Waist line of masked bust — anchor (1,1) is sprite feet; lift by hidden leg portion. */
		const waistAnchorLift = height * (1 - DEKA_HEADER_VISIBLE_HEIGHT_FRAC);
		return {
			mode,
			x: frame.right - frame.width * DEKA_HEADER_OFFSET_X_FRAC,
			y: frame.top + waistAnchorLift + frame.height * DEKA_HEADER_OFFSET_Y_FRAC,
			width,
			height,
			layoutScale: 1,
			anchor: { x: 1, y: 1 },
			zIndex: DEKA_HEADER_Z_INDEX,
			visibleHeightFrac: DEKA_HEADER_VISIBLE_HEIGHT_FRAC,
		};
	}

	return {
		mode,
		x: beside.x,
		y: beside.y,
		width: beside.width,
		height: beside.height,
		layoutScale: 1,
		anchor: { x: 0.5, y: 1 },
		zIndex: DEKA_BESIDE_Z_INDEX,
		visibleHeightFrac: 1,
	};
};

/** @deprecated Use getBesideDekaRect / getDekaLayout. */
export const isDekaVisible = (layoutType: LayoutType) => layoutType !== 'portrait';

/** @deprecated Use getBesideDekaRect / getDekaLayout. */
export const getDekaRect = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
	gameType: DekaGameType = 'basegame',
) => {
	const beside = getBesideDekaRect(canvasSizes, layoutType, gameType);
	return { ...beside, bg: getBgLayout(canvasSizes, layoutType, gameType) };
};

export const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

/** Sine in-out (GSAP `sine.inOut` equivalent). */
export const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
