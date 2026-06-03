import {
	portraitUiRuntime,
	UI_BASE_FONT_SIZE,
	WOODEN_PANEL_HEIGHT,
	WOODEN_PANEL_LABEL_FONT_MUL,
	WOODEN_PANEL_VALUE_FONT_MUL,
	type PortraitCanvasSizeType,
} from 'components-ui-pixi';
import {
	applyPortraitUiRuntime,
	isCompactPortraitHud,
	menuBetControlHitSize,
	menuIconHitSize,
	MENU_ICON_ASPECT,
	menuSpinHitSize,
	portraitPhoneUiTune,
} from 'components-ui-pixi/src/constants';

import { getOlympusFrameBounds } from './hudLandscapeLayout';
import type { LayoutType } from './constants';

/** Portrait HUD — ref markup: history/buy above frame; BALANCE|WIN|BET; icon row; spin row. */
export const OLYMPUS_PORTRAIT_HUD = {
	gapBelowFrame: 10,
	gapAboveIconRow: 12,
	/** Inset from layout bottom (ignore large generic bottomSafe). */
	bottomPad: 6,
	/** Gap between BALANCE|WIN|BET row and SPIN row. */
	gapPanelsToSpin: 24,
	/** Space between spin row and the four bar icons below. */
	gapIconToSpinRow: 12,
	/** Fine nudge SPIN row down (positive = lower on screen). */
	spinRowNudgeDown: 8,
	/** Slightly smaller bar controls (icons, spin, +/-). */
	controlMul: 0.86,
	innerWidthRatio: 0.94,
	panelGapX: 8,
	labelAbove: true as const,
	sizeMul: 1.02,
	fontMul: 1.08,
	/** Top slots — bottom edge sits just above the grid (per markup). */
	topGapAboveGrid: 8,
	/** History panel width (portrait); height cap = frame.height × ratio (~107px → ~214px). */
	topHistoryWidthRatio: 0.26,
	topHistoryHeightRatio: 0.28,
	/** Square-ish buy, right (red sketch). */
	topBuyWidthRatio: 0.27,
	topBuyHeightFromWidth: 0.94,
	buyIconPadRatio: 0.2,
	spinScale: 1.2,
	betControlScale: 0.8,
	bottomBarLeftPad: 6,
	bottomBarIconGap: 10,
};

type BoardLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
	scale?: number;
};

export type OlympusPortraitHudLayout = {
	uiScale: number;
	bottomReservePx: number;
	topReservePx: number;
	gridTopLimitY: number;
	plateWidth: number;
	plateHeight: number;
	labelAbove: true;
	balanceX: number;
	winX: number;
	betX: number;
	yPanels: number;
	settingsX: number;
	muteX: number;
	autoX: number;
	turboX: number;
	yIconRow: number;
	bottomBarIconSide: number;
	spinX: number;
	decreaseX: number;
	increaseX: number;
	ySpinRow: number;
	spinScale: number;
	betControlScale: number;
	buyX: number;
	buyY: number;
	buyScaleX: number;
	buyScaleY: number;
	tumbleHistoryX: number;
	tumbleHistoryY: number;
	historyPanelWidth: number;
	historyPanelHeight: number;
	buyPanelWidth: number;
	buyPanelHeight: number;
};

export const getOlympusPortraitHudLayout = (context: {
	stateLayoutDerived: {
		mainLayout: () => { width: number; height: number };
		mainLayoutStandard: () => { width: number; height: number };
		canvasSizeType: () => PortraitCanvasSizeType;
		canvasRatioType: () => string;
		canvasRatio: () => number;
		layoutType: () => LayoutType;
	};
	stateGameDerived: { boardLayout: () => BoardLayout };
}): OlympusPortraitHudLayout => {
	const sizeType = context.stateLayoutDerived.canvasSizeType();
	const ratioType = context.stateLayoutDerived.canvasRatioType();
	const ratio = context.stateLayoutDerived.canvasRatio();
	const stdMain = context.stateLayoutDerived.mainLayoutStandard();
	const compactPortrait = isCompactPortraitHud(ratioType, ratio)
		? ratioType === 'almostSquare'
			? ('almostSquare' as const)
			: ('nearSquare' as const)
		: false;

	applyPortraitUiRuntime(sizeType, stdMain.width, compactPortrait);

	const main = context.stateLayoutDerived.mainLayout();
	const almostSquare = ratioType === 'almostSquare';
	const boardLayout = context.stateGameDerived.boardLayout();
	const layoutType = context.stateLayoutDerived.layoutType();
	const frame = getOlympusFrameBounds(boardLayout, layoutType);
	const tune = portraitPhoneUiTune(sizeType, almostSquare);
	const hud = OLYMPUS_PORTRAIT_HUD;
	const uiScale = portraitUiRuntime.scale;
	const controlScale = uiScale * hud.controlMul;

	const innerWidth = frame.width * hud.innerWidthRatio;
	let plateWidth = Math.round(
		((innerWidth - hud.panelGapX * 2) / 3) * hud.sizeMul,
	);
	const rowWidth = plateWidth * 3 + hud.panelGapX * 2;
	if (rowWidth > innerWidth) {
		plateWidth = Math.floor((innerWidth - hud.panelGapX * 2) / 3);
	}
	const plateHeight = Math.round(
		Math.min(
			frame.height * 0.09 * hud.sizeMul,
			WOODEN_PANEL_HEIGHT * uiScale * 1.2 * hud.sizeMul,
		),
	);

	portraitUiRuntime.plateWidth = plateWidth;
	portraitUiRuntime.plateHeight = plateHeight;
	portraitUiRuntime.plateValueFontSize =
		UI_BASE_FONT_SIZE * WOODEN_PANEL_VALUE_FONT_MUL * uiScale * hud.fontMul;
	portraitUiRuntime.plateLabelFontSize =
		UI_BASE_FONT_SIZE * WOODEN_PANEL_LABEL_FONT_MUL * uiScale * hud.fontMul;

	const frameInnerLeft = frame.centerX - innerWidth / 2;
	const balanceX = frameInnerLeft + plateWidth / 2;
	const winX = balanceX + plateWidth + hud.panelGapX;
	const betX = winX + plateWidth + hud.panelGapX;
	const yPanels = frame.bottomY + hud.gapBelowFrame + plateHeight / 2;

	const squareHit = menuBetControlHitSize(6, controlScale);
	const squareHalf = squareHit.width / 2;
	const squareStep = squareHalf * 2 + hud.bottomBarIconGap;
	const bottomBarIconSide = squareHit.width - 12;

	const spinHit = menuSpinHitSize(8, controlScale);
	const spinHalfW = (spinHit.width / 2) * hud.spinScale;
	const spinHalfH = (spinHit.height / 2) * hud.spinScale;
	const betHalf = (squareHit.height / 2) * hud.betControlScale;
	const stackTight = 4;

	const yIconRow = main.height - hud.bottomPad - squareHalf;
	const ySpinFromIcons =
		yIconRow - squareHalf - hud.gapIconToSpinRow - spinHalfH;
	const panelsBottom = frame.bottomY + hud.gapBelowFrame + plateHeight;
	const ySpinMin = panelsBottom + hud.gapPanelsToSpin + spinHalfH;
	const ySpinRow = Math.max(ySpinFromIcons, ySpinMin) + hud.spinRowNudgeDown;

	const settingsX = frameInnerLeft + hud.bottomBarLeftPad + squareHalf;
	const muteX = settingsX + squareStep;
	const frameInnerRight = frame.centerX + innerWidth / 2;
	const turboX = frameInnerRight - hud.bottomBarLeftPad - squareHalf;
	const autoX = turboX - squareStep;

	const spinX = frame.centerX;
	const decreaseX = spinX - spinHalfW - betHalf - stackTight;
	const increaseX = spinX + spinHalfW + betHalf + stackTight;

	const historyPanelWidth = Math.round(frame.width * hud.topHistoryWidthRatio);
	const buyPanelWidth = Math.round(frame.width * hud.topBuyWidthRatio);
	const rowStrideEst =
		historyPanelWidth * 0.17 + historyPanelWidth * 0.045;
	const historyContentHeight = 5 * rowStrideEst + historyPanelWidth * 0.12;
	const historyPanelHeight = Math.round(
		Math.min(
			frame.height * hud.topHistoryHeightRatio,
			Math.max(historyContentHeight, frame.height * 0.11),
		),
	);
	const buyPanelHeight = Math.round(buyPanelWidth * hud.topBuyHeightFromWidth);

	const panelBottomY = frame.topY - hud.topGapAboveGrid;
	const tumbleHistoryX = frameInnerLeft + historyPanelWidth / 2;
	const tumbleHistoryY = panelBottomY - historyPanelHeight / 2;
	const buyX = frameInnerRight - buyPanelWidth / 2;
	const buyY = panelBottomY - buyPanelHeight / 2;

	const buyHit = menuIconHitSize(MENU_ICON_ASPECT.buyBonus, 6, controlScale);
	const buyInner = 1 - hud.buyIconPadRatio;
	const buyScaleX = (buyPanelWidth * buyInner) / buyHit.width;
	const buyScaleY = (buyPanelHeight * buyInner) / buyHit.height;

	const topHudTop = Math.min(
		tumbleHistoryY - historyPanelHeight / 2,
		buyY - buyPanelHeight / 2,
	);
	const gridTopLimitY = topHudTop - tune.winGridGap;
	const topReservePx = Math.max(0, frame.topY - topHudTop + 8);
	const bottomReservePx = main.height - gridTopLimitY + 12;

	return {
		uiScale,
		bottomReservePx,
		topReservePx,
		gridTopLimitY,
		plateWidth,
		plateHeight,
		labelAbove: hud.labelAbove,
		balanceX,
		winX,
		betX,
		yPanels,
		settingsX,
		muteX,
		autoX,
		turboX,
		yIconRow,
		bottomBarIconSide,
		spinX,
		decreaseX,
		increaseX,
		ySpinRow,
		spinScale: hud.spinScale,
		betControlScale: hud.betControlScale,
		buyX,
		buyY,
		buyScaleX,
		buyScaleY,
		tumbleHistoryX,
		tumbleHistoryY,
		historyPanelWidth,
		historyPanelHeight,
		buyPanelWidth,
		buyPanelHeight,
	};
};
