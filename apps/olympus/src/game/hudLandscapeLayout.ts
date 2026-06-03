import {
	applyLandscapeUiRuntime,
	portraitUiRuntime,
	UI_BASE_FONT_SIZE,
	WOODEN_PANEL_HEIGHT,
	WOODEN_PANEL_LABEL_FONT_MUL,
	WOODEN_PANEL_VALUE_FONT_MUL,
	type LandscapeStackedLayout,
	type PortraitCanvasSizeType,
} from 'components-ui-pixi';
import {
	menuBetControlHitSize,
	menuIconHitSize,
	MENU_ICON_ASPECT,
	menuSpinHitSize,
} from 'components-ui-pixi/src/constants';
import { landscapePhoneUiTune } from 'components-ui-pixi/src/constants';

import {
	ALMOST_SQUARE_HUD_MUL,
	ALMOST_SQUARE_HUD_NUDGE_UP,
	ALMOST_SQUARE_SHELF,
	ALMOST_SQUARE_SPIN_MUL,
	FRAME_OFFSET_Y,
	FRAME_POSITION_ADJUSTMENT,
	getBoardFrameVisualSize,
	type LayoutType,
} from './constants';

/** Landscape-only: three equal portals in the shelf under the reel frame (see layout ref). */
export const LANDSCAPE_PANEL_SHELF = {
	gapBelowFrame: 2,
	gapAboveButtons: 12,
	innerWidthRatio: 0.94,
	panelGapX: 8,
	labelAboveGap: 6,
	/** Proportional bump for shelf portals (plates + type). */
	sizeMul: 1.12,
	fontMul: 1.22,
};

/** Side column (+ / SPIN / −) and BUY BONUS beside the frame (landscape ref). */
export const LANDSCAPE_SIDE_CONTROLS = {
	/** Layout bounds include grapevine ornament — inset to visible wood edge. */
	visibleFrameInsetX: 0.06,
	/** ~0px after wood; spinHugOverlap eats transparent spin padding. */
	gapFromFrame: 0,
	spinHugOverlap: 8,
	/** AUTO / TURBO stay clear of the spin column. */
	actionsGapFromSpinColumn: 10,
	/** Vertical gap between +/- and SPIN (px); hug eats icon padding. */
	stackGapPx: 0,
	stackHugPx: 22,
	/** SPIN much larger than +/- on the right stack. */
	spinScale: 1.58,
	betControlScale: 0.92,
	bottomActionGap: 8,
	/** Bottom bar — four equal squares (settings / mute / auto / turbo). */
	bottomBarLeftPad: 4,
	bottomBarIconGap: 8,
	bottomBarGapBelowPanels: 14,
};

/** Two separate left panels (landscape): BUY top, history lower-left (red markup). */
export const LANDSCAPE_LEFT_COLUMN = {
	gapFromFrame: 10,
	widthRatio: 0.26,
	heightMul: 2,
	alignTopRatio: 0.05,
	/** History panel height = buyPanelHeight × 2 (same width). */
	historyToBuyRatio: 2,
	buyHeightFromWidth: 0.36,
	buyIconPadRatio: 0.14,
	/** History sits on frame bottom — red lower box. */
	historyLiftFromBottom: 22,
};

type BoardLayout = {
	x: number;
	y: number;
	width: number;
	height: number;
	scale?: number;
};

export type OlympusFrameBounds = {
	centerX: number;
	centerY: number;
	bottomY: number;
	topY: number;
	width: number;
	height: number;
};

/** Frame bounds in game `mainLayout` space (matches BoardFrame.svelte). */
export const getOlympusFrameBounds = (
	boardLayout: BoardLayout,
	layoutType: LayoutType,
	almostSquare = false,
): OlympusFrameBounds => {
	const { width: frameWidth, height: frameHeight } = getBoardFrameVisualSize(
		boardLayout,
		layoutType,
		almostSquare,
	);
	const centerX = boardLayout.x * FRAME_POSITION_ADJUSTMENT;
	const centerY = boardLayout.y * FRAME_POSITION_ADJUSTMENT + FRAME_OFFSET_Y;

	return {
		centerX,
		centerY,
		bottomY: centerY + frameHeight / 2,
		topY: centerY - frameHeight / 2,
		width: frameWidth,
		height: frameHeight,
	};
};

export type OlympusLandscapeHudLayout = Omit<
	LandscapeStackedLayout,
	'buyX' | 'spinX' | 'decreaseX' | 'increaseX' | 'menuLeftX'
> & {
	plateWidth: number;
	plateHeight: number;
	labelAbove: true;
	buyX: number;
	buyY: number;
	buyScaleX: number;
	buyScaleY: number;
	leftColumnWidth: number;
	buyPanelHeight: number;
	historyPanelHeight: number;
	tumbleHistoryX: number;
	tumbleHistoryY: number;
	settingsX: number;
	muteX: number;
	yBottomBarIcons: number;
	bottomBarIconSide: number;
	/** Gap between mute and auto — current win / free spins left. */
	shelfInfoCenterX: number;
	shelfInfoWidth: number;
	spinStackX: number;
	spinY: number;
	increaseY: number;
	decreaseY: number;
	spinScale: number;
	betControlScale: number;
};

const barHitHalf = (aspect: number, uiScale: number) =>
	menuIconHitSize(aspect, 6, uiScale).width / 2;

/**
 * Landscape HUD: panels under frame; BUY top-left; +/SPIN/− on the right; MENU/AUTO/TURBO bottom.
 */
export const getOlympusLandscapeHudLayout = (context: {
	stateLayoutDerived: {
		mainLayout: () => { width: number; height: number };
		canvasSizeType: () => PortraitCanvasSizeType;
		canvasRatioType: () => string;
		layoutType: () => LayoutType;
	};
	stateGameDerived: { boardLayout: () => BoardLayout };
}): OlympusLandscapeHudLayout => {
	const main = context.stateLayoutDerived.mainLayout();
	const sizeType = context.stateLayoutDerived.canvasSizeType();
	const almostSquare = context.stateLayoutDerived.canvasRatioType() === 'almostSquare';
	const boardLayout = context.stateGameDerived.boardLayout();
	const layoutType = context.stateLayoutDerived.layoutType();

	// Do not pass almostSquare into shared runtime (it applies 0.88 shrink). Olympus bumps below.
	applyLandscapeUiRuntime(sizeType, main.width, false);
	// Local scale only — never mutate portraitUiRuntime.scale (portrait reads it for button sizes).
	const uiScale =
		portraitUiRuntime.scale * (almostSquare ? ALMOST_SQUARE_HUD_MUL : 1);

	const frame = getOlympusFrameBounds(boardLayout, layoutType, almostSquare);
	const tune = landscapePhoneUiTune(sizeType, almostSquare);
	const { buttonRowHalf } = portraitUiRuntime;
	const squareHud = almostSquare ? 1.15 : 1;
	const shelf = almostSquare
		? {
				...LANDSCAPE_PANEL_SHELF,
				innerWidthRatio: ALMOST_SQUARE_SHELF.innerWidthRatio,
				panelGapX: ALMOST_SQUARE_SHELF.panelGapX,
				sizeMul:
					LANDSCAPE_PANEL_SHELF.sizeMul * squareHud * ALMOST_SQUARE_SHELF.plateSizeMul,
				fontMul:
					LANDSCAPE_PANEL_SHELF.fontMul * squareHud * ALMOST_SQUARE_SHELF.valueFontMul,
			}
		: {
				...LANDSCAPE_PANEL_SHELF,
				sizeMul: LANDSCAPE_PANEL_SHELF.sizeMul * squareHud,
				fontMul: LANDSCAPE_PANEL_SHELF.fontMul * squareHud,
			};
	const side = {
		...LANDSCAPE_SIDE_CONTROLS,
		spinScale:
			LANDSCAPE_SIDE_CONTROLS.spinScale * (almostSquare ? ALMOST_SQUARE_SPIN_MUL : 1),
		bottomBarIconGap: LANDSCAPE_SIDE_CONTROLS.bottomBarIconGap * squareHud,
	};

	const yButtons = main.height - tune.bottomSafe - buttonRowHalf;

	const innerWidth = frame.width * shelf.innerWidthRatio;
	let plateWidth = Math.round(
		((innerWidth - shelf.panelGapX * 2) / 3) * shelf.sizeMul,
	);
	const rowWidth = plateWidth * 3 + shelf.panelGapX * 2;
	if (rowWidth > innerWidth) {
		plateWidth = Math.floor((innerWidth - shelf.panelGapX * 2) / 3);
	}
	const bandTop = frame.bottomY + shelf.gapBelowFrame;
	const bandBottom = yButtons - buttonRowHalf - shelf.gapAboveButtons;
	const bandHeight = Math.max(48, bandBottom - bandTop);
	const plateHeight = Math.round(
		Math.min(
			bandHeight *
				(almostSquare ? 0.98 : 0.9) *
				shelf.sizeMul *
				(almostSquare ? ALMOST_SQUARE_SHELF.plateHeightMul : 1),
			WOODEN_PANEL_HEIGHT *
				uiScale *
				(almostSquare ? 1.44 : 1.28) *
				shelf.sizeMul,
		),
	);

	portraitUiRuntime.plateWidth = plateWidth;
	portraitUiRuntime.plateHeight = plateHeight;
	portraitUiRuntime.plateValueFontSize =
		UI_BASE_FONT_SIZE * WOODEN_PANEL_VALUE_FONT_MUL * uiScale * shelf.fontMul;
	portraitUiRuntime.plateLabelFontSize =
		UI_BASE_FONT_SIZE * WOODEN_PANEL_LABEL_FONT_MUL * uiScale * shelf.fontMul;

	const yPanels = bandTop + plateHeight / 2;

	const frameInnerLeft = frame.centerX - innerWidth / 2;
	const balanceX = frameInnerLeft + plateWidth / 2;
	const winX = balanceX + plateWidth + shelf.panelGapX;
	const betX = winX + plateWidth + shelf.panelGapX;

	const frameLeft = frame.centerX - frame.width / 2;
	const frameRight = frame.centerX + frame.width / 2;

	const leftCol = LANDSCAPE_LEFT_COLUMN;
	const leftColumnWidth = Math.round(frame.height * leftCol.widthRatio);
	const buyPanelHeight = Math.round(
		leftColumnWidth * leftCol.buyHeightFromWidth * leftCol.heightMul,
	);
	const historyPanelHeight = Math.round(
		buyPanelHeight * leftCol.historyToBuyRatio,
	);
	const leftColumnCenterX = frameLeft - leftCol.gapFromFrame - leftColumnWidth / 2;
	const buyY = frame.topY + Math.round(frame.height * leftCol.alignTopRatio) + buyPanelHeight / 2;
	const buyX = leftColumnCenterX;
	const tumbleHistoryX = leftColumnCenterX;
	const tumbleHistoryY =
		frame.bottomY - leftCol.historyLiftFromBottom - historyPanelHeight / 2;
	const buyHit = menuIconHitSize(MENU_ICON_ASPECT.buyBonus, 6, uiScale);
	const buyInner = 1 - leftCol.buyIconPadRatio;
	const buyScaleX = (leftColumnWidth * buyInner) / buyHit.width;
	const buyScaleY = (buyPanelHeight * buyInner) / buyHit.height;

	const squareHit = menuBetControlHitSize(6, uiScale);
	const squareHalf = squareHit.width / 2;
	const squareStep = squareHalf * 2 + side.bottomBarIconGap;
	const bottomBarIconSide = squareHit.width - 12;

	const spinHit = menuSpinHitSize(8, uiScale);
	const spinHalfW = (spinHit.width / 2) * side.spinScale;
	const spinHalfH = (spinHit.height / 2) * side.spinScale;
	/** Same hit box as bottom bar icons — no extra 0.92 shrink on square landscape. */
	const betHalf = almostSquare ? squareHalf : (squareHit.height / 2) * side.betControlScale;
	const stackTight = side.stackGapPx - side.stackHugPx;

	const frameVisualRight = frameRight - frame.width * side.visibleFrameInsetX;
	const spinStackX =
		frameVisualRight +
		side.gapFromFrame -
		side.spinHugOverlap +
		spinHalfW;
	const spinY = frame.centerY;

	/** Square landscape: hug +/- to visible SPIN art (hit boxes are much larger). */
	const stackTouchGap = ALMOST_SQUARE_SHELF.stackTouchGapPx;
	const spinVisualHalfH =
		(portraitUiRuntime.menuSpinHeight / 2) *
		side.spinScale *
		ALMOST_SQUARE_SHELF.spinVisualHalfMul;
	const betVisualHalf = bottomBarIconSide / 2;
	const increaseY = almostSquare
		? spinY - spinVisualHalfH - betVisualHalf - stackTouchGap
		: spinY - spinHalfH - betHalf - stackTight;
	const decreaseY = almostSquare
		? spinY + spinVisualHalfH + betVisualHalf + stackTouchGap
		: spinY + spinHalfH + betHalf + stackTight;

	const panelBottomY = yPanels + plateHeight / 2;
	const yBottomBarIcons = panelBottomY + side.bottomBarGapBelowPanels + squareHalf;

	const settingsX = frameInnerLeft + side.bottomBarLeftPad + squareHalf;
	const muteX = settingsX + squareStep;

	const frameInnerRight = frame.centerX + innerWidth / 2;
	const turboX = frameInnerRight - side.bottomBarLeftPad - squareHalf;
	const autoX = turboX - squareStep;

	const shelfInfoGap = 10;
	const shelfInfoLeft = muteX + squareHalf + shelfInfoGap;
	const shelfInfoRight = autoX - squareHalf - shelfInfoGap;
	const shelfInfoCenterX = (shelfInfoLeft + shelfInfoRight) / 2;
	const shelfInfoWidth = Math.max(48, shelfInfoRight - shelfInfoLeft);

	const spinColOuter = spinStackX + spinHalfW + side.actionsGapFromSpinColumn;

	const gridTopLimitY = frame.topY - tune.winGridGap;
	const bottomReservePx = main.height - gridTopLimitY + 8;
	const rightReservePx = Math.max(0, main.width - spinColOuter + 12);

	const hudNudgeUp = almostSquare ? ALMOST_SQUARE_HUD_NUDGE_UP : 0;

	return {
		uiScale,
		bottomReservePx,
		rightReservePx,
		topReservePx: tune.topSafe,
		yPanels: yPanels - hudNudgeUp,
		yButtons: yButtons - hudNudgeUp,
		balanceX,
		winX,
		betX,
		plateWidth,
		plateHeight,
		labelAbove: true,
		buyX,
		buyY,
		buyScaleX,
		buyScaleY,
		leftColumnWidth,
		buyPanelHeight,
		historyPanelHeight,
		tumbleHistoryX,
		tumbleHistoryY,
		settingsX,
		muteX,
		yBottomBarIcons: yBottomBarIcons - hudNudgeUp,
		bottomBarIconSide,
		shelfInfoCenterX,
		shelfInfoWidth,
		autoX,
		turboX,
		spinStackX,
		spinY: spinY - hudNudgeUp,
		increaseY: increaseY - hudNudgeUp,
		decreaseY: decreaseY - hudNudgeUp,
		spinScale: side.spinScale,
		betControlScale: almostSquare ? 1 : side.betControlScale,
	};
};
