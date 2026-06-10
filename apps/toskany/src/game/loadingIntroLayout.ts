import {
	BG_FILL_COLOR,
	getBgLayout,
	type LayoutType,
} from './constants';
import {
	getReelFrameCanvasRect,
	LOGO_FRAME_GAP_FRAC,
	type ReelFrameCanvasRect,
} from './backgroundCharacter';

/** Native size of `frame_full.png` — both intro frames render at this aspect. */
export const INTRO_FRAME_NATIVE = { w: 1024, h: 768 } as const;
export const INTRO_FRAME_ASPECT = INTRO_FRAME_NATIVE.h / INTRO_FRAME_NATIVE.w;
export const INTRO_FRAME_SWAP_MS = 5000;
export const INTRO_BG_SWAP_MS = 5000;
/** Crossfade duration for intro bg / frame / logo swaps. */
export const INTRO_CROSSFADE_MS = 700;

/** Match in-game gold typography (TumbleWin / FS panels). */
export const INTRO_GOLD = 0xffd147;
export const INTRO_GOLD_BRIGHT = 0xffd86b;
export const INTRO_CREAM = 0xf5e7c0;
export const INTRO_TEXT_STROKE = 0x2e180f;

/** logo_tuscany_harvest*.png native aspect (612×408). */
export const LOGO_ASPECT = 408 / 612;

/** Intro screen — day/night logo keys (swap with backgrounds). */
export const INTRO_LOGO_DAY_KEY = 'logo_day' as const;
export const INTRO_LOGO_NIGHT_KEY = 'logo' as const;

/** Bigger than in-game `LOGO_FRAME_WIDTH_FRAC` (0.4) for intro hero. */
export const INTRO_LOGO_FRAME_WIDTH_FRAC = 0.52;

/** Day logo artwork reads higher in the PNG — intro-only nudge (in-game unchanged). */
const INTRO_DAY_LOGO_OFFSET_Y_FRAC = 0.06;

/** Desktop top-right logo — wider than in-game `LOGO_WIDTH_FRAC.desktop`. */
const INTRO_DESKTOP_LOGO_WIDTH_FRAC = 0.22;

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const fitFontSizeToWidth = (text: string, baseSize: number, maxWidth: number) => {
	const estimated = text.length * baseSize * 0.52;
	if (estimated <= maxWidth) return baseSize;
	return baseSize * (maxWidth / estimated);
};

export type IntroLogoLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
	anchor: { x: number; y: number };
};

const applyIntroDayLogoOffset = (logo: IntroLogoLayout): IntroLogoLayout => ({
	...logo,
	y: logo.y + logo.height * INTRO_DAY_LOGO_OFFSET_Y_FRAC,
});

export const getIntroFrameAnchoredLogo = (frame: ReelFrameCanvasRect): IntroLogoLayout => {
	const width = frame.width * INTRO_LOGO_FRAME_WIDTH_FRAC;
	const height = width * LOGO_ASPECT;
	const gap = frame.width * LOGO_FRAME_GAP_FRAC;
	return {
		x: frame.right + gap,
		y: frame.top,
		width,
		height,
		anchor: { x: 0, y: 0 },
	};
};

const getDesktopIntroLogo = (
	cw: number,
	ch: number,
): IntroLogoLayout => {
	const width = cw * INTRO_DESKTOP_LOGO_WIDTH_FRAC;
	const height = width * LOGO_ASPECT;
	return {
		x: cw - 20,
		y: Math.max(10, ch * 0.016),
		width,
		height,
		anchor: { x: 1, y: 0 },
	};
};

const getPortraitIntroLogo = (
	cw: number,
	ch: number,
	frameW: number,
	frameH: number,
	centerY: number,
): IntroLogoLayout => {
	const topPad = Math.max(12, ch * 0.03);
	const logoGap = Math.max(8, ch * 0.012);
	let width = Math.min(cw * 0.84, frameW * 0.96);
	let height = width * LOGO_ASPECT;
	const spaceAbove = centerY - frameH * 0.5 - topPad - logoGap;

	if (height > spaceAbove && spaceAbove > 0) {
		height = Math.max(spaceAbove, ch * 0.06);
		width = height / LOGO_ASPECT;
	}

	const idealY = centerY - frameH * 0.5 - logoGap - height * 0.5;
	return {
		x: cw * 0.5,
		y: Math.max(topPad + height * 0.5, idealY),
		width,
		height,
		anchor: { x: 0.5, y: 0.5 },
	};
};

export type IntroTextLayout = {
	centerX: number;
	taglineY: number;
	actionY: number;
	taglineFontSize: number;
	actionFontSize: number;
	strokeWidth: number;
};

const getIntroTextLayout = (
	cw: number,
	ch: number,
	options: {
		isStacked: boolean;
		frameCenterX: number;
		frameBottom: number;
		frameWidth: number;
		frameHeight: number;
		/** Phone landscape — font/gaps track reel frame scale, not full canvas. */
		gridAnchored?: boolean;
	},
): IntroTextLayout => {
	const {
		isStacked,
		frameCenterX,
		frameBottom,
		frameWidth,
		frameHeight,
		gridAnchored = false,
	} = options;

	const maxTextW = gridAnchored
		? frameWidth * 0.98
		: cw * (isStacked ? 0.94 : 0.88);

	const taglineBase = gridAnchored
		? clamp(frameWidth * 0.044, 10, 34)
		: clamp(ch * (isStacked ? 0.036 : 0.032), 16, 46);
	const actionBase = gridAnchored
		? clamp(frameWidth * 0.04, 9, 32)
		: clamp(ch * (isStacked ? 0.034 : 0.03), 14, 42);

	let taglineFontSize = fitFontSizeToWidth(
		'WIN UP TO 25,000× BET',
		taglineBase,
		maxTextW,
	);
	let actionFontSize = fitFontSizeToWidth(
		'PRESS ANYWHERE TO START',
		Math.min(actionBase, taglineFontSize * 0.96),
		maxTextW,
	);

	const taglineGap = gridAnchored
		? Math.max(5, frameHeight * 0.028)
		: Math.max(10, ch * 0.016);
	const lineGap = gridAnchored
		? Math.max(10, frameHeight * 0.055)
		: Math.max(22, ch * (isStacked ? 0.038 : 0.042));

	// Keep copy inside viewport on short landscape screens.
	if (gridAnchored) {
		const bottomPad = Math.max(8, ch * 0.03);
		const spaceBelow = ch - frameBottom - bottomPad;
		const needed = taglineGap + taglineFontSize + lineGap + actionFontSize;
		if (needed > spaceBelow && spaceBelow > 0) {
			const scale = spaceBelow / needed;
			taglineFontSize *= scale;
			actionFontSize *= scale;
		}
	}

	const taglineY = frameBottom + taglineGap + taglineFontSize * 0.2;
	const actionY = taglineY + lineGap;

	return {
		centerX: frameCenterX,
		taglineY,
		actionY,
		taglineFontSize,
		actionFontSize,
		strokeWidth: clamp(taglineFontSize * 0.11, 2, 6),
	};
};

export type IntroLayout = {
	bgDay: ReturnType<typeof getBgLayout>;
	bgNight: ReturnType<typeof getBgLayout>;
	frameW: number;
	frameH: number;
	centerX: number;
	centerY: number;
	logoDay: IntroLogoLayout;
	logoNight: IntroLogoLayout;
	text: IntroTextLayout;
};

export const getIntroLayout = (
	canvas: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
	layoutType: LayoutType,
): IntroLayout => {
	const bgDay = getBgLayout(canvas, layoutType, 'freeSpins');
	const bgNight = getBgLayout(canvas, layoutType, 'basegame');
	const isStacked = layoutType === 'portrait' || layoutType === 'tablet';
	const cw = canvas.width;
	const ch = canvas.height;
	const logoOnRight = layoutType === 'desktop' || layoutType === 'landscape';

	if (logoOnRight) {
		const frameRect = getReelFrameCanvasRect(canvas, mainLayout, layoutType);
		const centerX = (frameRect.left + frameRect.right) * 0.5;
		const centerY = (frameRect.top + frameRect.bottom) * 0.5;
		const logo =
			layoutType === 'landscape'
				? getIntroFrameAnchoredLogo(frameRect)
				: getDesktopIntroLogo(cw, ch);

		const text = getIntroTextLayout(cw, ch, {
			isStacked: false,
			frameCenterX: centerX,
			frameBottom: frameRect.bottom,
			frameWidth: frameRect.width,
			frameHeight: frameRect.height,
			gridAnchored: layoutType === 'landscape',
		});

		return {
			bgDay,
			bgNight,
			frameW: frameRect.width,
			frameH: frameRect.height,
			centerX,
			centerY,
			logoDay: applyIntroDayLogoOffset(logo),
			logoNight: logo,
			text,
		};
	}

	const maxWFrac = isStacked ? 0.94 : 0.54;
	const maxHFrac = isStacked ? 0.4 : 0.8;

	let frameW = cw * maxWFrac;
	let frameH = frameW * INTRO_FRAME_ASPECT;
	if (frameH > ch * maxHFrac) {
		frameH = ch * maxHFrac;
		frameW = frameH / INTRO_FRAME_ASPECT;
	}

	const centerX = cw * 0.5;
	const centerY = ch * (isStacked ? 0.44 : 0.5);
	const frameBottom = centerY + frameH * 0.5;
	const logo = getPortraitIntroLogo(cw, ch, frameW, frameH, centerY);
	const text = getIntroTextLayout(cw, ch, {
		isStacked: true,
		frameCenterX: centerX,
		frameBottom,
		frameWidth: frameW,
		frameHeight: frameH,
	});

	return {
		bgDay,
		bgNight,
		frameW,
		frameH,
		centerX,
		centerY,
		logoDay: applyIntroDayLogoOffset(logo),
		logoNight: logo,
		text,
	};
};

export { BG_FILL_COLOR };
