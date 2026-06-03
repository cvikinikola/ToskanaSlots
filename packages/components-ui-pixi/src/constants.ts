import { WHITE } from 'constants-shared/colors';

export const UI_BASE_SIZE = 150;

export const UI_BASE_FONT_SIZE = UI_BASE_SIZE * 0.3;

export const UI_TEXT_STYLES = {
	labelStyle: {
		fontSize: UI_BASE_FONT_SIZE,
		fill: WHITE,
	},
	amountStyle: {
		fontSize: UI_BASE_FONT_SIZE,
		fill: WHITE,
	},
};

// desktop
export const DESKTOP_BASE_SIZE = UI_BASE_SIZE * 0.9;

export const DESKTOP_BACKGROUND_WIDTH_LIST = [
	DESKTOP_BASE_SIZE * (188 / 116),
	800,
	350,
	DESKTOP_BASE_SIZE * (340 / 116),
];

// portrait
export const PORTRAIT_BASE_SIZE = UI_BASE_SIZE * 1.32;

// landscape
export const LANDSCAPE_BASE_SIZE = UI_BASE_SIZE * 1.1;

export const LANDSCAPE_BACKGROUND_WIDTH_LIST = [
	LANDSCAPE_BASE_SIZE * (188 / 116),
	1000,
	LANDSCAPE_BASE_SIZE * (373 / 116),
];

// tablet
export const TABLET_BASE_SIZE = UI_BASE_SIZE * 1.2;

export const TABLET_BACKGROUND_WIDTH_LIST = [
	TABLET_BASE_SIZE * (188 / 116),
	650,
	350,
	TABLET_BASE_SIZE * (340 / 116),
];

/** Menu bar — normalized WebP aspect ratios (width / height). */
export const MENU_ICON_HEIGHT = UI_BASE_SIZE * 0.58;
export const MENU_SPIN_HEIGHT = UI_BASE_SIZE * 1.05;
export const MENU_ICON_GAP = 14;
export const MENU_CLUSTER_GAP = 18;
export const MENU_LEFT_SHIFT = 110;

export const MENU_ICON_ASPECT = {
	menu: 155 / 67,
	buyBonus: 115 / 67,
	autoSpin: 103 / 67,
	turbo: 183 / 67,
	stop: 158 / 67,
	square: 1,
} as const;

/** Bar row layout/render footprint (native sprites can be wider than this). */
export const menuBarLayoutAspect = (key: keyof typeof MENU_ICON_ASPECT) => {
	if (key === 'menu') return MENU_ICON_ASPECT.buyBonus;
	if (key === 'turbo') return MENU_ICON_ASPECT.autoSpin;
	return MENU_ICON_ASPECT[key];
};

export const menuIconHalfWidth = (aspect: number, scale = 1) =>
	(MENU_ICON_HEIGHT * scale * aspect) / 2;

export const menuIconHitSize = (aspect: number, pad = 6, scale = 1) => {
	const h = MENU_ICON_HEIGHT * scale;
	return {
		width: h * aspect + pad,
		height: h + pad,
	};
};

export const menuSpinHitSize = (pad = 8, scale = 1) => ({
	width: MENU_SPIN_HEIGHT * scale + pad,
	height: MENU_SPIN_HEIGHT * scale + pad,
});

/** STOP icon — scale width only (height stays menuIconHeight). */
export const MENU_STOP_WIDTH_RATIO = 0.62;

export const menuStopRenderWidth = (menuIconHeight: number) =>
	menuIconHeight * MENU_ICON_ASPECT.stop * MENU_STOP_WIDTH_RATIO;

export const menuStopHitSize = (pad = 6, scale = 1) =>
	menuIconHitSize(MENU_ICON_ASPECT.stop * MENU_STOP_WIDTH_RATIO, pad, scale);

/** Landscape uniform bar — +/- same height as MENU bar icons. */
export const LANDSCAPE_BET_CONTROL_RENDER_RATIO = 1;

/** Landscape spin — smaller than portrait so the grid dominates. */
export const LANDSCAPE_SPIN_RENDER_RATIO = 0.82;

/** BET +/- — square, same height as MENU / AUTO bar icons. */
export const menuBetControlHitSize = (pad = 4, scale = 1) => {
	const h = MENU_ICON_HEIGHT * scale;
	const effectivePad = portraitUiRuntime.uniformBarIcons ? 6 : pad;
	if (portraitUiRuntime.uniformBarIcons) {
		const side = h + effectivePad;
		return { width: side, height: side };
	}
	return { width: h + effectivePad, height: h + effectivePad };
};

/** auto / spin / turbo row with spin at center. */
export const actionClusterCenters = (spinCenterX: number) => {
	const spinX = spinCenterX;
	const autoX =
		spinX -
		MENU_SPIN_HEIGHT / 2 -
		MENU_CLUSTER_GAP -
		menuIconHalfWidth(MENU_ICON_ASPECT.autoSpin);
	const turboX =
		spinX +
		MENU_SPIN_HEIGHT / 2 +
		MENU_CLUSTER_GAP +
		menuIconHalfWidth(MENU_ICON_ASPECT.turbo);
	return { autoX, spinX, turboX };
};

export const menuBuyCenters = (autoX: number, leftShift = MENU_LEFT_SHIFT) => {
	const buyX =
		autoX -
		menuIconHalfWidth(MENU_ICON_ASPECT.autoSpin) -
		MENU_CLUSTER_GAP -
		menuIconHalfWidth(MENU_ICON_ASPECT.buyBonus);
	const menuX =
		buyX -
		MENU_ICON_GAP -
		menuIconHalfWidth(MENU_ICON_ASPECT.buyBonus) -
		menuIconHalfWidth(MENU_ICON_ASPECT.menu);
	return { menuX: menuX - leftShift, buyX: buyX - leftShift };
};

/** Menu button — far left (center X of icon). */
export const MENU_BAR_LEFT_PAD = 40;

export const menuFarLeftX = (pad = MENU_BAR_LEFT_PAD) =>
	pad + menuIconHalfWidth(MENU_ICON_ASPECT.menu);

/** Panel plate sizing — shared height for balance / win / bet. */
export const PANEL_PLATE_TOP = 24;
/** Legacy wide plates; wooden_panel uses WOODEN_PANEL_* below. */
export const PANEL_PLATE_HEIGHT = UI_BASE_FONT_SIZE * 4.55;
export const PANEL_PLATE_WIDTH = UI_BASE_FONT_SIZE * 3 * (326 / 73);

/** Compact wooden ticker plates (menu_panel_balance asset). */
export const WOODEN_PANEL_WIDTH = UI_BASE_FONT_SIZE * 4.1;
export const WOODEN_PANEL_HEIGHT = UI_BASE_FONT_SIZE * 2.05;
export const WOODEN_PANEL_LABEL_Y_RATIO = -0.28;
export const WOODEN_PANEL_VALUE_Y_RATIO = 0.06;
export const WOODEN_PANEL_LABEL_FONT_MUL = 0.56;
export const WOODEN_PANEL_VALUE_FONT_MUL = 0.48;
export const WOODEN_PANEL_VALUE_WRAP_WIDTH_RATIO = 0.84;
export const WOODEN_PANEL_VALUE_MIN_FONT_MUL = 0.58;

/** Shrink font so a single-line value fits inside the wooden plate inner width. */
export const fitWoodenPanelValueFontSize = (
	value: string,
	plateWidth: number,
	baseFontSize: number,
) => {
	const innerWidth = plateWidth * WOODEN_PANEL_VALUE_WRAP_WIDTH_RATIO;
	const charWidth = baseFontSize * 0.52;
	const estimated = Math.max(1, value.length) * charWidth;
	if (estimated <= innerWidth) return baseFontSize;
	const fitted = innerWidth / (Math.max(1, value.length) * 0.52);
	const minSize = baseFontSize * WOODEN_PANEL_VALUE_MIN_FONT_MUL;
	return Math.max(minSize, fitted);
};

export const PANEL_INNER_CENTER_RATIO = 0.51;
export const PANEL_VALUE_Y = -PANEL_PLATE_TOP + PANEL_PLATE_HEIGHT * PANEL_INNER_CENTER_RATIO;
export const PANEL_VALUE_FONT_SIZE = UI_BASE_FONT_SIZE * 0.72;
export const PANEL_ROW_HALF_GAP = 500;
export const PANEL_DISPLAY_SCALE = 0.8;

export const PORTRAIT_EDGE_PAD = 36;
/** Gap between MENU ↔ AUTO and TURBO ↔ BUY (portrait compact row). */
export const PORTRAIT_EDGE_CLUSTER_GAP = 22;
/** Clear gap between BET plate edge and +/- (layout px). */
export const PORTRAIT_BET_CONTROL_GAP = 32;
/** Extra inset for plate art (grapes/frame) beyond plate width. */
export const PORTRAIT_BET_PLATE_ART_PAD = 14;
/** Gap between slot grid bottom and WIN panel on portrait / stacked layouts. */
export const PORTRAIT_WIN_GRID_GAP = 64;
/** WIN / balance / bet portals only (screenshot tuning). */
export const PORTRAIT_WIN_NUDGE_UP = 0;
export const PORTRAIT_WIN_BASE_Y = 670;
export const PORTRAIT_BUTTONS_BASE_Y = 412;
/** Inset from main-layout bottom (home indicator / safe area). */
export const PORTRAIT_BOTTOM_SAFE = 52;
/** Balance plate anchor Y (portrait main-layout px; ~24px above bet). */
export const PORTRAIT_BALANCE_Y = 322;
/** Portrait spin row — gap from spin edge to neighbour icon (main-layout px). */
export const PORTRAIT_SPIN_AUTO_GAP = 20;
export const PORTRAIT_SPIN_TURBO_GAP = 14;
export const PORTRAIT_TURBO_BUY_GAP = 26;
export type PortraitCanvasSizeType =
	| 'smallMobile'
	| 'mobile'
	| 'tablet'
	| 'largeTablet'
	| 'desktop';

export type PortraitSpinGaps = {
	auto: number;
	turbo: number;
	turboBuy: number;
};

/** Phone spin-row gaps — tight enough to avoid overlap, not stretched apart. */
export const portraitMenuGaps = (sizeType: PortraitCanvasSizeType): PortraitSpinGaps => {
	switch (sizeType) {
		case 'smallMobile':
			return { auto: 34, turbo: 30, turboBuy: 12 };
		case 'mobile':
			return { auto: 34, turbo: 30, turboBuy: 14 };
		default:
			return {
				auto: PORTRAIT_SPIN_AUTO_GAP,
				turbo: PORTRAIT_SPIN_TURBO_GAP,
				turboBuy: PORTRAIT_TURBO_BUY_GAP,
			};
	}
};

type PortraitPhoneUiTune = {
	winBaseY: number;
	buttonsBaseY: number;
	balanceY: number;
	bottomSafe: number;
	winGridGap: number;
};

/** Square-ish portrait — maximise grid above compact HUD. */
const ALMOST_SQUARE_PORTRAIT_TUNE: PortraitPhoneUiTune = {
	winBaseY: 720,
	buttonsBaseY: 440,
	balanceY: 328,
	bottomSafe: 40,
	winGridGap: 14,
};

/** Mild portrait (ratio ≥ 0.72) — slightly larger grid. */
const NEAR_SQUARE_PORTRAIT_TUNE: PortraitPhoneUiTune = {
	winBaseY: 680,
	buttonsBaseY: 420,
	balanceY: 318,
	bottomSafe: 46,
	winGridGap: 22,
};

/** True when portrait HUD should shrink to give the grid more room. */
export const isCompactPortraitHud = (
	canvasRatioType: 'longWidth' | 'longHeight' | 'almostSquare',
	canvasRatio: number,
) =>
	canvasRatioType === 'almostSquare' ||
	(canvasRatioType === 'longHeight' && canvasRatio >= 0.72);

/** Portrait bottom UI — phone-first offsets (1920px-tall standard layout). */
export const portraitPhoneUiTune = (
	sizeType: PortraitCanvasSizeType,
	compactPortrait: 'almostSquare' | 'nearSquare' | false = false,
): PortraitPhoneUiTune => {
	if (compactPortrait === 'almostSquare') return ALMOST_SQUARE_PORTRAIT_TUNE;
	if (compactPortrait === 'nearSquare') return NEAR_SQUARE_PORTRAIT_TUNE;
	switch (sizeType) {
		case 'smallMobile':
			return {
				winBaseY: 638,
				buttonsBaseY: 386,
				balanceY: 298,
				bottomSafe: 92,
				winGridGap: 72,
			};
		case 'mobile':
			return {
				winBaseY: 652,
				buttonsBaseY: 398,
				balanceY: 308,
				bottomSafe: 74,
				winGridGap: 64,
			};
		default:
			return {
				winBaseY: PORTRAIT_WIN_BASE_Y,
				buttonsBaseY: PORTRAIT_BUTTONS_BASE_Y,
				balanceY: PORTRAIT_BALANCE_Y,
				bottomSafe: PORTRAIT_BOTTOM_SAFE,
				winGridGap: PORTRAIT_WIN_GRID_GAP,
			};
	}
};

/** Horizontal BET row: plate centre + +/- share one Y (legacy; prefer portraitUiRuntime). */
export const PORTRAIT_BET_ROW_HALF = Math.max(PANEL_PLATE_HEIGHT, MENU_ICON_HEIGHT) / 2;
export const PORTRAIT_BET_PLATE_Y = PANEL_PLATE_TOP - PANEL_PLATE_HEIGHT / 2;

export const PORTRAIT_BUTTON_ROW_HALF = MENU_SPIN_HEIGHT / 2 + 8;

/** Legacy edge anchors — prefer portraitActionAndEdgeCenters compact row. */
export const portraitEdgeButtonCenters = (
	layoutWidth: number,
	scale = portraitUiRuntime.scale,
) => {
	const menuLeftX = PORTRAIT_EDGE_PAD + menuIconHalfWidth(MENU_ICON_ASPECT.menu, scale);
	const buyX =
		layoutWidth - PORTRAIT_EDGE_PAD - menuIconHalfWidth(MENU_ICON_ASPECT.buyBonus, scale);
	return { menuLeftX, buyX };
};

const portraitEdgeClusterGap = (sizeType: PortraitCanvasSizeType) => {
	switch (sizeType) {
		case 'smallMobile':
			return 20;
		case 'mobile':
			return 21;
		default:
			return PORTRAIT_EDGE_CLUSTER_GAP;
	}
};

export const portraitActionClusterCenters = (
	spinCenterX: number,
	gaps: Pick<PortraitSpinGaps, 'auto' | 'turbo'> = {
		auto: PORTRAIT_SPIN_AUTO_GAP,
		turbo: PORTRAIT_SPIN_TURBO_GAP,
	},
	scale = portraitUiRuntime.scale,
) => {
	const spinX = spinCenterX;
	const spinHalf = (MENU_SPIN_HEIGHT * scale) / 2;
	const autoHalf = menuIconHalfWidth(MENU_ICON_ASPECT.autoSpin, scale);
	const turboHalf = menuIconHalfWidth(menuBarLayoutAspect('turbo'), scale);
	/** Same SPIN↔neighbor edge gap as turbo; auto is narrower so center sits further left. */
	const autoGap = gaps.turbo + turboHalf - autoHalf;
	const autoX = spinX - spinHalf - autoGap - autoHalf;
	const turboX = spinX + spinHalf + gaps.turbo + turboHalf;
	return { autoX, spinX, turboX };
};

type PortraitActionRowLayout = {
	menuLeftX: number;
	buyX: number;
	autoX: number;
	spinX: number;
	turboX: number;
};

const portraitActionRowLayout = (
	layoutWidth: number,
	sizeType: PortraitCanvasSizeType,
	spinGaps: Pick<PortraitSpinGaps, 'auto' | 'turbo'>,
	edgeGap: number,
	scale: number,
): PortraitActionRowLayout => {
	const cx = layoutWidth * 0.5;
	const { autoX, spinX, turboX } = portraitActionClusterCenters(cx, spinGaps, scale);

	const autoHalf = menuIconHalfWidth(MENU_ICON_ASPECT.autoSpin, scale);
	const turboHalf = menuIconHalfWidth(menuBarLayoutAspect('turbo'), scale);
	const menuHalf = menuIconHalfWidth(menuBarLayoutAspect('menu'), scale);
	const buyHalf = menuIconHalfWidth(MENU_ICON_ASPECT.buyBonus, scale);

	const menuLeftX = autoX - autoHalf - edgeGap - menuHalf;
	const buyX = turboX + turboHalf + edgeGap + buyHalf;

	return { menuLeftX, buyX, autoX, spinX, turboX };
};

const portraitActionRowFits = (
	layout: PortraitActionRowLayout,
	layoutWidth: number,
	scale: number,
) => {
	const menuHalf = menuIconHalfWidth(menuBarLayoutAspect('menu'), scale);
	const buyHalf = menuIconHalfWidth(MENU_ICON_ASPECT.buyBonus, scale);
	const rowLeft = layout.menuLeftX - menuHalf;
	const rowRight = layout.buyX + buyHalf;
	return rowLeft >= PORTRAIT_EDGE_PAD && rowRight <= layoutWidth - PORTRAIT_EDGE_PAD;
};

/**
 * Portrait action row — MENU hugs AUTO, BUY hugs TURBO; gaps shrink only if row overflows.
 */
export const portraitActionAndEdgeCenters = (
	layoutWidth: number,
	sizeType: PortraitCanvasSizeType = 'desktop',
) => {
	applyPortraitUiRuntime(sizeType, layoutWidth);
	const scale = portraitUiRuntime.scale;
	const targetGaps = portraitMenuGaps(sizeType);
	let spinGaps = { auto: targetGaps.auto, turbo: targetGaps.turbo };
	let edgeGap = portraitEdgeClusterGap(sizeType);

	let layout = portraitActionRowLayout(layoutWidth, sizeType, spinGaps, edgeGap, scale);

	for (let i = 0; i < 48 && !portraitActionRowFits(layout, layoutWidth, scale); i += 1) {
		if (edgeGap > 10) {
			edgeGap -= 1;
		} else if (spinGaps.turbo > 12) {
			spinGaps = { auto: spinGaps.auto - 1, turbo: spinGaps.turbo - 1 };
		} else {
			break;
		}
		layout = portraitActionRowLayout(layoutWidth, sizeType, spinGaps, edgeGap, scale);
	}

	const menuHalf = menuIconHalfWidth(menuBarLayoutAspect('menu'), scale);
	let menuLeftX = layout.menuLeftX;
	if (menuLeftX - menuHalf < PORTRAIT_EDGE_PAD) {
		menuLeftX = PORTRAIT_EDGE_PAD + menuHalf;
	}

	return { ...layout, menuLeftX };
};

/** Standard portrait main-layout height (matches utils-layout STANDARD_MAIN_SIZES_MAP). */
export const PORTRAIT_STANDARD_HEIGHT = 1920;

const portraitRowGap = (
	sizeType: PortraitCanvasSizeType,
	compactPortrait: 'almostSquare' | 'nearSquare' | false = false,
) => {
	if (compactPortrait === 'almostSquare') return { stack: 12, buttonsWin: 16 };
	if (compactPortrait === 'nearSquare') return { stack: 16, buttonsWin: 22 };
	switch (sizeType) {
		case 'smallMobile':
			return { stack: 16, buttonsWin: 36 };
		case 'mobile':
			return { stack: 18, buttonsWin: 32 };
		default:
			return { stack: 22, buttonsWin: 28 };
	}
};

export type PortraitUiRuntime = {
	scale: number;
	plateWidth: number;
	plateHeight: number;
	plateTop: number;
	plateValueY: number;
	plateValueFontSize: number;
	/** Set on Olympus landscape shelf; overrides label size when present. */
	plateLabelFontSize?: number;
	betPlateY: number;
	menuIconHeight: number;
	menuSpinHeight: number;
	betRowHalf: number;
	buttonRowHalf: number;
	/** Landscape bar row — square icons, same size (spin excluded). */
	uniformBarIcons: boolean;
};

/** Updated by LayoutPortrait each frame — buttons/panels read scaled sizes. */
export const portraitUiRuntime: PortraitUiRuntime = {
	scale: 1,
	plateWidth: WOODEN_PANEL_WIDTH,
	plateHeight: WOODEN_PANEL_HEIGHT,
	plateTop: PANEL_PLATE_TOP,
	plateValueY: PANEL_VALUE_Y,
	plateValueFontSize: PANEL_VALUE_FONT_SIZE,
	betPlateY: PANEL_PLATE_TOP - PANEL_PLATE_HEIGHT / 2,
	menuIconHeight: MENU_ICON_HEIGHT,
	menuSpinHeight: MENU_SPIN_HEIGHT,
	betRowHalf: Math.max(PANEL_PLATE_HEIGHT, MENU_ICON_HEIGHT) / 2,
	buttonRowHalf: MENU_SPIN_HEIGHT / 2 + 8,
	uniformBarIcons: false,
};

export const portraitUiScale = (
	sizeType: PortraitCanvasSizeType,
	layoutWidth: number,
): number => {
	const base =
		sizeType === 'smallMobile' ? 0.84 : sizeType === 'mobile' ? 0.92 : 1;
	const plateW = WOODEN_PANEL_WIDTH * base;
	const iconHalf = (MENU_ICON_HEIGHT * base) / 2;
	const defaultControl =
		plateW * 0.5 + PORTRAIT_BET_PLATE_ART_PAD + iconHalf + PORTRAIT_BET_CONTROL_GAP;
	const maxControl = Math.max(
		defaultControl,
		layoutWidth * 0.5 - PORTRAIT_EDGE_PAD - iconHalf,
	);
	if (defaultControl > maxControl) {
		return base * Math.max(0.78, maxControl / defaultControl);
	}
	return base;
};

/** Compact HUD scale — grid must read larger than buttons/panels. */
export const landscapeUiScale = (
	sizeType: PortraitCanvasSizeType,
	layoutWidth: number,
): number => {
	const base = portraitUiScale(sizeType, layoutWidth);
	const mul =
		sizeType === 'desktop' || sizeType === 'largeTablet'
			? 0.72
			: sizeType === 'tablet'
				? 0.76
				: sizeType === 'mobile'
					? 0.8
					: 0.84;
	return base * mul;
};

export const applyPortraitUiRuntime = (
	sizeType: PortraitCanvasSizeType,
	layoutWidth: number,
	compactPortrait: 'almostSquare' | 'nearSquare' | false = false,
) => {
	let scale = portraitUiScale(sizeType, layoutWidth);
	if (compactPortrait) scale *= 0.9;
	const plateHeight = WOODEN_PANEL_HEIGHT * scale;
	const plateWidth = WOODEN_PANEL_WIDTH * scale;
	const menuIconHeight = MENU_ICON_HEIGHT * scale;
	const menuSpinHeight = MENU_SPIN_HEIGHT * scale;
	const plateTop = PANEL_PLATE_TOP * scale;
	const betRowHalf = Math.max(plateHeight, menuIconHeight) / 2 + 6 * scale;
	const buttonRowHalf = menuSpinHeight / 2 + 8 * scale;

	portraitUiRuntime.scale = scale;
	portraitUiRuntime.plateWidth = Math.round(plateWidth);
	portraitUiRuntime.plateHeight = Math.round(plateHeight);
	portraitUiRuntime.plateTop = plateTop;
	portraitUiRuntime.plateValueY = 0;
	portraitUiRuntime.plateValueFontSize = UI_BASE_FONT_SIZE * WOODEN_PANEL_VALUE_FONT_MUL * scale;
	portraitUiRuntime.plateLabelFontSize = undefined;
	portraitUiRuntime.betPlateY = 0;
	portraitUiRuntime.menuIconHeight = menuIconHeight;
	portraitUiRuntime.menuSpinHeight = menuSpinHeight;
	portraitUiRuntime.betRowHalf = betRowHalf;
	portraitUiRuntime.buttonRowHalf = buttonRowHalf;
	portraitUiRuntime.uniformBarIcons = false;
};

export const applyLandscapeUiRuntime = (
	sizeType: PortraitCanvasSizeType,
	layoutWidth: number,
	almostSquare = false,
) => {
	let scale = landscapeUiScale(sizeType, layoutWidth);
	if (almostSquare) scale *= 0.88;
	const plateHeight = WOODEN_PANEL_HEIGHT * scale;
	const plateWidth = WOODEN_PANEL_WIDTH * scale;
	const menuIconHeight = MENU_ICON_HEIGHT * scale;
	const menuSpinHeight = MENU_SPIN_HEIGHT * scale * LANDSCAPE_SPIN_RENDER_RATIO;
	const plateTop = PANEL_PLATE_TOP * scale;
	const betRowHalf = Math.max(plateHeight, menuIconHeight) / 2 + 4 * scale;
	const buttonRowHalf = menuSpinHeight / 2 + 6 * scale;

	portraitUiRuntime.scale = scale;
	portraitUiRuntime.plateWidth = Math.round(plateWidth);
	portraitUiRuntime.plateHeight = Math.round(plateHeight);
	portraitUiRuntime.plateTop = plateTop;
	portraitUiRuntime.plateValueY = 0;
	portraitUiRuntime.plateValueFontSize = UI_BASE_FONT_SIZE * WOODEN_PANEL_VALUE_FONT_MUL * scale;
	portraitUiRuntime.plateLabelFontSize = undefined;
	portraitUiRuntime.betPlateY = 0;
	portraitUiRuntime.menuIconHeight = menuIconHeight;
	portraitUiRuntime.menuSpinHeight = menuSpinHeight;
	portraitUiRuntime.betRowHalf = betRowHalf;
	portraitUiRuntime.buttonRowHalf = buttonRowHalf;
	portraitUiRuntime.uniformBarIcons = true;
};

/** Clamp +/- so BET row stays inside layout width. */
export const portraitBetControlX = (
	layoutWidth: number,
	sizeType: PortraitCanvasSizeType = 'desktop',
) => {
	applyPortraitUiRuntime(sizeType, layoutWidth);
	const { plateWidth, menuIconHeight } = portraitUiRuntime;
	const iconHalf = menuIconHeight / 2;
	const gap = PORTRAIT_BET_CONTROL_GAP;
	const defaultX =
		plateWidth * 0.5 + PORTRAIT_BET_PLATE_ART_PAD + iconHalf + gap;
	const maxX = layoutWidth * 0.5 - PORTRAIT_EDGE_PAD - iconHalf;
	return Math.min(defaultX, maxX);
};

export type PortraitStackedLayout = {
	yWin: number;
	yButtons: number;
	yBalance: number;
	yBetRow: number;
	/** Grid frame bottom must stay above this Y (main-layout coords). */
	gridTopLimitY: number;
	bottomReservePx: number;
	winGridGap: number;
};

/**
 * Portrait bottom HUD — positions computed bottom-up with minimum row gaps.
 * Also exposes gridTopLimitY / bottomReservePx for game board clamping.
 */
export const portraitStackedLayout = (
	sizeType: PortraitCanvasSizeType,
	layoutHeight: number,
	layoutWidth: number,
	compactPortrait: 'almostSquare' | 'nearSquare' | false = false,
): PortraitStackedLayout => {
	applyPortraitUiRuntime(sizeType, layoutWidth, compactPortrait);
	const tune = portraitPhoneUiTune(sizeType, compactPortrait);
	const gaps = portraitRowGap(sizeType, compactPortrait);
	const {
		betRowHalf,
		buttonRowHalf,
		plateHeight,
		plateTop,
	} = portraitUiRuntime;

	const yBetRow = layoutHeight - tune.bottomSafe - betRowHalf;
	const yBalance = yBetRow - betRowHalf - gaps.stack - plateHeight / 2;
	const yButtons = yBalance - plateHeight / 2 - gaps.stack - buttonRowHalf;
	const yWin = yButtons - buttonRowHalf - gaps.buttonsWin - plateHeight / 2;

	const gridTopLimitY = yWin - plateTop - tune.winGridGap;
	const bottomReservePx = layoutHeight - gridTopLimitY + (compactPortrait ? 8 : 16);

	return {
		yWin: yWin - PORTRAIT_WIN_NUDGE_UP,
		yButtons,
		yBalance,
		yBetRow,
		gridTopLimitY,
		bottomReservePx,
		winGridGap: tune.winGridGap,
	};
};

/** Reserve px from layout bottom — import in game board layout (portrait). */
export const portraitBottomReservePx = (
	sizeType: PortraitCanvasSizeType,
	layoutHeight: number = PORTRAIT_STANDARD_HEIGHT,
	layoutWidth = 1080,
	compactPortrait: 'almostSquare' | 'nearSquare' | false = false,
) => portraitStackedLayout(sizeType, layoutHeight, layoutWidth, compactPortrait).bottomReservePx;

/** Portrait — WIN / BALANCE / BET panels (spin row unchanged). */
export const portraitUiLayout = (
	layoutHeight: number,
	sizeType: PortraitCanvasSizeType = 'desktop',
	layoutWidth = 1080,
) => {
	const layout = portraitStackedLayout(sizeType, layoutHeight, layoutWidth);
	return {
		yWin: layout.yWin,
		yButtons: layout.yButtons,
		yBalance: layout.yBalance,
		yBetRow: layout.yBetRow,
	};
};

/** Standard landscape main-layout size (matches utils-layout STANDARD_MAIN_SIZES_MAP). */
export const LANDSCAPE_STANDARD_WIDTH = 1920;
export const LANDSCAPE_STANDARD_HEIGHT = 1080;

type LandscapeActionRowLayout = {
	menuLeftX: number;
	autoX: number;
	spinX: number;
	turboX: number;
	buyX: number;
	decreaseX: number;
	increaseX: number;
};

const landscapeBarHitHalf = (aspect: number, uiScale: number) =>
	menuIconHitSize(aspect, 6, uiScale).width / 2;

const landscapeBetHitHalf = (uiScale: number) =>
	menuBetControlHitSize(6, uiScale).width / 2;

const landscapeActionRowHalfWidths = (uiScale: number) => [
	landscapeBarHitHalf(menuBarLayoutAspect('menu'), uiScale),
	landscapeBarHitHalf(MENU_ICON_ASPECT.buyBonus, uiScale),
	landscapeBarHitHalf(MENU_ICON_ASPECT.autoSpin, uiScale),
	menuSpinHitSize(8, uiScale).width / 2,
	landscapeBarHitHalf(menuBarLayoutAspect('turbo'), uiScale),
	landscapeBetHitHalf(uiScale),
	landscapeBetHitHalf(uiScale),
];

const landscapeActionRowWidth = (halves: number[], gap: number) => {
	const body = halves.reduce((sum, half) => sum + half * 2, 0);
	return body + gap * (halves.length - 1);
};

const landscapeActionRowFromGap = (halves: number[], gap: number) => {
	let cursor = 0;
	const centers: number[] = [];
	for (let i = 0; i < halves.length; i += 1) {
		const half = halves[i]!;
		centers.push(cursor + half);
		cursor += half * 2;
		if (i < halves.length - 1) cursor += gap;
	}
	const rowLeft = centers[0]! - halves[0]!;
	const rowRight = centers[centers.length - 1]! + halves[halves.length - 1]!;
	return { centers, rowCenter: (rowLeft + rowRight) / 2 };
};

/**
 * Landscape action row — centred row matching reference order:
 * MENU | BUY | AUTO | SPIN | TURBO | − | +
 */
/** Action row centred on `centerX`, clamped to `maxRowWidth`. */
export const landscapeActionRowCentersAt = (
	centerX: number,
	maxRowWidth: number,
	sizeType: PortraitCanvasSizeType,
	uiScale: number,
): LandscapeActionRowLayout => {
	const halves = landscapeActionRowHalfWidths(uiScale);
	const rowMaxWidth = Math.max(maxRowWidth - PORTRAIT_EDGE_PAD * 2, halves[0]! * 4);

	let gap = sizeType === 'smallMobile' ? 4 : sizeType === 'mobile' ? 5 : 6;

	for (let i = 0; i < 48 && landscapeActionRowWidth(halves, gap) > rowMaxWidth; i += 1) {
		if (gap > 3) gap -= 1;
		else break;
	}

	const { centers, rowCenter } = landscapeActionRowFromGap(halves, gap);
	const shift = centerX - rowCenter;

	return {
		menuLeftX: centers[0]! + shift,
		buyX: centers[1]! + shift,
		autoX: centers[2]! + shift,
		spinX: centers[3]! + shift,
		turboX: centers[4]! + shift,
		decreaseX: centers[5]! + shift,
		increaseX: centers[6]! + shift,
	};
};

export const landscapeActionRowCenters = (
	layoutWidth: number,
	sizeType: PortraitCanvasSizeType,
	uiScale: number,
): LandscapeActionRowLayout =>
	landscapeActionRowCentersAt(layoutWidth * 0.5, layoutWidth, sizeType, uiScale);

/** BALANCE / WIN / BET centred on `centerX`, spread within `maxRowWidth`. */
export const landscapePanelRowCentersAt = (
	centerX: number,
	maxRowWidth: number,
	uiScale: number,
	sizeType: PortraitCanvasSizeType,
	panelSpread: number,
) => {
	const plateWidth = WOODEN_PANEL_WIDTH * uiScale;
	const minPlateGap = sizeType === 'smallMobile' ? 14 : 18;
	const minCenterGap = plateWidth + minPlateGap;

	const rowMaxWidth = Math.max(maxRowWidth - PORTRAIT_EDGE_PAD * 2, plateWidth * 3);
	const maxCenterGap = Math.max(minCenterGap, (rowMaxWidth - plateWidth) / 2);
	const centerGap = minCenterGap + (maxCenterGap - minCenterGap) * panelSpread;

	return {
		balanceX: centerX - centerGap,
		winX: centerX,
		betX: centerX + centerGap,
	};
};

/** BALANCE / WIN / BET — no overlap, modest spread (not full screen width). */
const landscapePanelRowCenters = (
	layoutWidth: number,
	uiScale: number,
	sizeType: PortraitCanvasSizeType,
	panelSpread: number,
) => landscapePanelRowCentersAt(layoutWidth * 0.5, layoutWidth, uiScale, sizeType, panelSpread);

type LandscapePhoneUiTune = {
	bottomSafe: number;
	rowGap: number;
	topSafe: number;
	winGridGap: number;
	/** 0 = tight panels, 1 = full-width spread */
	panelSpread: number;
};

/** Square-ish landscape — maximise grid, minimal HUD gap. */
const ALMOST_SQUARE_LANDSCAPE_TUNE: LandscapePhoneUiTune = {
	bottomSafe: 4,
	rowGap: 4,
	topSafe: 4,
	winGridGap: 2,
	panelSpread: 0.03,
};

/** Phone landscape — stacked HUD under centred grid (layoutType landscape = phone only). */
export const landscapePhoneUiTune = (
	sizeType: PortraitCanvasSizeType,
	almostSquare = false,
): LandscapePhoneUiTune => {
	if (almostSquare) return ALMOST_SQUARE_LANDSCAPE_TUNE;
	switch (sizeType) {
		case 'smallMobile':
			return { bottomSafe: 6, rowGap: 6, topSafe: 8, winGridGap: 4, panelSpread: 0.04 };
		case 'mobile':
			return { bottomSafe: 8, rowGap: 6, topSafe: 10, winGridGap: 6, panelSpread: 0.05 };
		case 'tablet':
			return { bottomSafe: 8, rowGap: 8, topSafe: 12, winGridGap: 8, panelSpread: 0.06 };
		case 'largeTablet':
			return { bottomSafe: 10, rowGap: 8, topSafe: 14, winGridGap: 10, panelSpread: 0.08 };
		case 'desktop':
			return { bottomSafe: 10, rowGap: 8, topSafe: 16, winGridGap: 10, panelSpread: 0.08 };
		default:
			return { bottomSafe: 10, rowGap: 8, topSafe: 14, winGridGap: 8, panelSpread: 0.06 };
	}
};

export type LandscapeStackedLayout = {
	uiScale: number;
	bottomReservePx: number;
	rightReservePx: number;
	topReservePx: number;
	/** BALANCE / WIN / BET row — directly under the grid. */
	yPanels: number;
	/** MENU / AUTO / SPIN / TURBO / BUY / +/- row — bottom. */
	yButtons: number;
	balanceX: number;
	winX: number;
	betX: number;
	menuLeftX: number;
	buyX: number;
	autoX: number;
	spinX: number;
	turboX: number;
	decreaseX: number;
	increaseX: number;
};

/**
 * Phone landscape HUD — grid centred above, then panels, then action row.
 * Order (top → bottom): frame → BALANCE WIN BET → MENU AUTO SPIN TURBO BUY + -
 */
export const landscapeStackedLayout = (
	sizeType: PortraitCanvasSizeType,
	layoutHeight: number,
	layoutWidth: number,
	almostSquare = false,
): LandscapeStackedLayout => {
	applyLandscapeUiRuntime(sizeType, layoutWidth, almostSquare);
	const uiScale = portraitUiRuntime.scale;
	const { plateHeight, plateTop, buttonRowHalf } = portraitUiRuntime;
	const tune = landscapePhoneUiTune(sizeType, almostSquare);

	const yButtons = layoutHeight - tune.bottomSafe - buttonRowHalf;
	const yPanels = yButtons - buttonRowHalf - tune.rowGap - plateHeight / 2;

	// Panel anchor is centre — include plateTop (grape art above centre).
	const panelTopY = yPanels - plateHeight / 2 - plateTop;
	const gridTopLimitY = panelTopY - tune.winGridGap;
	const bottomReservePx = layoutHeight - gridTopLimitY + 8;

	const { menuLeftX, buyX, autoX, spinX, turboX, decreaseX, increaseX } =
		landscapeActionRowCenters(layoutWidth, sizeType, uiScale);
	const { balanceX, winX, betX } = landscapePanelRowCenters(
		layoutWidth,
		uiScale,
		sizeType,
		tune.panelSpread,
	);

	return {
		uiScale,
		bottomReservePx,
		rightReservePx: 0,
		topReservePx: tune.topSafe,
		yPanels,
		yButtons,
		balanceX,
		winX,
		betX,
		menuLeftX,
		buyX,
		autoX,
		spinX,
		turboX,
		decreaseX,
		increaseX,
	};
};

/** Reserve px from layout bottom — import in game board layout (landscape). */
export const landscapeBottomReservePx = (
	sizeType: PortraitCanvasSizeType,
	layoutHeight: number,
	layoutWidth = LANDSCAPE_STANDARD_WIDTH,
	almostSquare = false,
) => {
	const layout = landscapeStackedLayout(sizeType, layoutHeight, layoutWidth, almostSquare);
	return layout.bottomReservePx;
};

export const landscapeTopReservePx = (
	sizeType: PortraitCanvasSizeType,
	layoutHeight: number,
	almostSquare = false,
) => {
	const layout = landscapeStackedLayout(
		sizeType,
		layoutHeight,
		LANDSCAPE_STANDARD_WIDTH,
		almostSquare,
	);
	return layout.topReservePx;
};

export const landscapeRightReservePx = (
	sizeType: PortraitCanvasSizeType,
	gameLayoutWidth: number,
) => {
	const wRatio = gameLayoutWidth / LANDSCAPE_STANDARD_WIDTH;
	const layout = landscapeStackedLayout(
		sizeType,
		LANDSCAPE_STANDARD_HEIGHT,
		LANDSCAPE_STANDARD_WIDTH,
	);
	return layout.rightReservePx * wRatio;
};
