import { getDekaLayout, type DekaGameType } from './backgroundCharacter';
import type { LayoutType } from './constants';

/** Arm over reel frame, below bet controls. */
export const DEKA_OVERLAY_Z_INDEX = 25;

/** BET plate and +/- above beside deka. */
export const BET_CONTROLS_FOREGROUND_Z_INDEX = 60;

export type BetControlsSuppressState = {
	freeSpinIntroActive: boolean;
	freeSpinOutroActive: boolean;
	transitionActive: boolean;
};

export const isBetControlsSuppressed = (game: BetControlsSuppressState) =>
	game.freeSpinIntroActive || game.freeSpinOutroActive || game.transitionActive;

/** Hide beside/header deka during intro, outro, and transition panels. */
export const shouldShowDekaCharacter = (
	gameType: DekaGameType,
	suppress: BetControlsSuppressState,
) =>
	(gameType === 'basegame' || gameType === 'freeSpins') && !isBetControlsSuppressed(suppress);

/** Beside deka overlaps bet controls — draw them after the character overlay. */
export const isBetControlsInForeground = (
	canvasSizes: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
	layoutType: LayoutType,
	gameType: DekaGameType,
) => {
	if (gameType !== 'basegame' && gameType !== 'freeSpins') return false;
	return getDekaLayout(canvasSizes, mainLayout, layoutType, gameType)?.mode === 'beside';
};

export const shouldShowBetControls = (
	canvasSizes: { width: number; height: number },
	mainLayout: { width: number; height: number; scale: number },
	layoutType: LayoutType,
	gameType: DekaGameType,
	suppress: BetControlsSuppressState,
) => isBetControlsInForeground(canvasSizes, mainLayout, layoutType, gameType) && !isBetControlsSuppressed(suppress);
