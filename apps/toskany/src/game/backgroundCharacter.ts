import { getBgLayout, type LayoutType } from './constants';

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

// ─── Placement (fractions relative to cover-fit background rect) ──────────────
/** Horizontal position — 0 = bg left edge, 1 = bg right edge (feet anchor point). */
export const DEKA_X_FRAC = 0.86;
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

/** Reference canvas height — deka scales down proportionally below this. */
export const DEKA_REF_CANVAS_HEIGHT = 800;

/** Min scale so deka stays readable on very small landscape viewports. */
export const DEKA_MIN_SCREEN_SCALE = 0.55;

export const isDekaVisible = (layoutType: LayoutType) => layoutType !== 'portrait';

export const getDekaScreenScale = (
	canvasSizes: { height: number },
	layoutType: LayoutType,
) => {
	if (!isDekaVisible(layoutType)) return 0;
	const t = canvasSizes.height / DEKA_REF_CANVAS_HEIGHT;
	return Math.min(1, Math.max(DEKA_MIN_SCREEN_SCALE, t));
};

export const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export const getDekaRect = (
	canvasSizes: { width: number; height: number },
	layoutType: LayoutType,
	gameType: DekaGameType = 'basegame',
) => {
	const bg = getBgLayout(canvasSizes, layoutType, gameType);
	const screenScale = getDekaScreenScale(canvasSizes, layoutType);
	const height = bg.height * DEKA_HEIGHT_FRAC * screenScale * DEKA_GLOBAL_SCALE;
	const width = DEKA_NATIVE.w * (height / DEKA_NATIVE.h);
	const x = bg.x - bg.width * 0.5 + bg.width * DEKA_X_FRAC;
	const y = bg.y + bg.height * 0.5 - bg.height * DEKA_BOTTOM_INSET_FRAC;
	return { x, y, width, height, bg, screenScale };
};

/** Sine in-out (GSAP `sine.inOut` equivalent). */
export const sineInOut = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
