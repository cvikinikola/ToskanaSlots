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
	CLUSTER_FRAME_BG_RATIO,
	FRAME_EXTEND_BOTTOM,
	FRAME_EXTEND_TOP,
	FRAME_OFFSET_Y,
	FRAME_POSITION_ADJUSTMENT,
	FRAME_SIZE_MUL,
	FRAME_SPRITE_SCALE,
	getFrameHeightMul,
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
	fontMul: 1.12,
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
	buyBelowTopRatio: 0.1,
	buyLeftOfFrame: 10,
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
): OlympusFrameBounds => {
	const playScale = boardLayout.scale ?? 1;
	const frameHeightMul = getFrameHeightMul(layoutType);
	const baseFrameHeight = boardLayout.width * FRAME_SPRITE_SCALE.height;
	const frameHeight =
		(baseFrameHeight + FRAME_EXTEND_TOP + FRAME_EXTEND_BOTTOM) *
		FRAME_SIZE_MUL *
		frameHeightMul *
		playScale;
	const frameWidth =
		boardLayout.width *
		CLUSTER_FRAME_BG_RATIO *
		FRAME_SPRITE_SCALE.width *
		FRAME_SIZE_MUL *
		playScale;
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
	settingsX: number;
	muteX: number;
	yBottomBarIcons: number;
	bottomBarIconSide: number;
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

	applyLandscapeUiRuntime(sizeType, main.width, almostSquare);

	const frame = getOlympusFrameBounds(boardLayout, layoutType);
	const tune = landscapePhoneUiTune(sizeType, almostSquare);
	const uiScale = portraitUiRuntime.scale;
	const { buttonRowHalf } = portraitUiRuntime;
	const shelf = LANDSCAPE_PANEL_SHELF;

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
			bandHeight * 0.9 * shelf.sizeMul,
			WOODEN_PANEL_HEIGHT * uiScale * 1.28 * shelf.sizeMul,
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

	const side = LANDSCAPE_SIDE_CONTROLS;
	const frameLeft = frame.centerX - frame.width / 2;
	const frameRight = frame.centerX + frame.width / 2;

	const buyHit = menuIconHitSize(MENU_ICON_ASPECT.buyBonus, 6, uiScale);
	const buyX = frameLeft - side.buyLeftOfFrame - buyHit.width / 2;
	const buyY = frame.topY + frame.height * side.buyBelowTopRatio + buyHit.height / 2;

	const spinHit = menuSpinHitSize(8, uiScale);
	const betHit = menuBetControlHitSize(6, uiScale);
	const spinHalfW = (spinHit.width / 2) * side.spinScale;
	const spinHalfH = (spinHit.height / 2) * side.spinScale;
	const betHalf = (betHit.height / 2) * side.betControlScale;
	const stackTight = side.stackGapPx - side.stackHugPx;

	const frameVisualRight = frameRight - frame.width * side.visibleFrameInsetX;
	const spinStackX =
		frameVisualRight +
		side.gapFromFrame -
		side.spinHugOverlap +
		spinHalfW;
	const spinY = frame.centerY;
	const increaseY = spinY - spinHalfH - betHalf - stackTight;
	const decreaseY = spinY + spinHalfH + betHalf + stackTight;

	const squareHit = menuBetControlHitSize(6, uiScale);
	const squareHalf = squareHit.width / 2;
	const squareStep = squareHalf * 2 + side.bottomBarIconGap;
	const bottomBarIconSide = squareHit.width - 12;

	const panelBottomY = yPanels + plateHeight / 2;
	const yBottomBarIcons = panelBottomY + side.bottomBarGapBelowPanels + squareHalf;

	const settingsX = frameInnerLeft + side.bottomBarLeftPad + squareHalf;
	const muteX = settingsX + squareStep;

	const frameInnerRight = frame.centerX + innerWidth / 2;
	const turboX = frameInnerRight - side.bottomBarLeftPad - squareHalf;
	const autoX = turboX - squareStep;

	const spinColOuter = spinStackX + spinHalfW + side.actionsGapFromSpinColumn;

	const gridTopLimitY = frame.topY - tune.winGridGap;
	const bottomReservePx = main.height - gridTopLimitY + 8;
	const rightReservePx = Math.max(0, main.width - spinColOuter + 12);

	return {
		uiScale,
		bottomReservePx,
		rightReservePx,
		topReservePx: tune.topSafe,
		yPanels,
		yButtons,
		balanceX,
		winX,
		betX,
		plateWidth,
		plateHeight,
		labelAbove: true,
		buyX,
		buyY,
		settingsX,
		muteX,
		yBottomBarIcons,
		bottomBarIconSide,
		autoX,
		turboX,
		spinStackX,
		spinY,
		increaseY,
		decreaseY,
		spinScale: side.spinScale,
		betControlScale: side.betControlScale,
	};
};
