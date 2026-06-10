import { stateUi } from 'state-shared';

import { getDekaLayout, type DekaGameType } from './backgroundCharacter';import type { LayoutType } from './constants';
import { stateGame } from './stateGame.svelte';

/** Arm over reel frame, below bet controls. */
export const DEKA_OVERLAY_Z_INDEX = 25;

/** BET plate and +/- above beside deka. */
export const BET_CONTROLS_FOREGROUND_Z_INDEX = 60;

/** Side menu open — drop foreground z-index; controls stay in layout under dim overlay. */
export const shouldSuspendForegroundForMenu = (menuOpen: boolean) => menuOpen;

export type BetControlsSuppressState = {
	freeSpinIntroActive: boolean;
	freeSpinOutroActive: boolean;
	transitionActive: boolean;
};

export const isBetControlsSuppressed = (game: BetControlsSuppressState) =>
	game.freeSpinIntroActive || game.freeSpinOutroActive || game.transitionActive;

/** Read suppress flags directly so Svelte 5 tracks each field in $effect/$derived. */
export const readBetControlsSuppressState = (
	game: BetControlsSuppressState,
): BetControlsSuppressState => ({
	freeSpinIntroActive: game.freeSpinIntroActive,
	freeSpinOutroActive: game.freeSpinOutroActive,
	transitionActive: game.transitionActive,
});

/** Panel intro/outro/transition — hide BET +/- and deka outside UiFadeContainer. */
export const isPanelChromeSuppressed = () => isBetControlsSuppressed(readBetControlsSuppressState(stateGame));

/** Foreground BET/deka follow menu bar fade + intro/outro/transition panels. */
export const isMenuBarChromeVisible = () =>
	stateUi.pixiMenuBarVisible && !isPanelChromeSuppressed();

export const applyPanelChromeUiState = () => {
	const visible = isMenuBarChromeVisible();
	stateUi.betControlsHidden = !visible;
	if (!visible) stateUi.amountBetInForeground = false;
};

/** Hide beside/header deka during intro, outro, and transition panels. */
export const shouldShowDekaCharacter = (
	gameType: DekaGameType,
	_suppress?: BetControlsSuppressState,
) => (gameType === 'basegame' || gameType === 'freeSpins') && isMenuBarChromeVisible();

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
	menuOpen: boolean,
) =>
	isBetControlsInForeground(canvasSizes, mainLayout, layoutType, gameType) &&
	isMenuBarChromeVisible() &&
	!shouldSuspendForegroundForMenu(menuOpen);

export const syncBetControlsUiState = (options: {
	canvasSizes: { width: number; height: number };
	mainLayout: { width: number; height: number; scale: number };
	layoutType: LayoutType;
	gameType: DekaGameType;
	suppress: BetControlsSuppressState;
	menuOpen: boolean;
}) => {
	const { canvasSizes, mainLayout, layoutType, gameType, suppress, menuOpen } = options;
	const menuBarChromeVisible = isMenuBarChromeVisible();
	return {
		betControlsHidden: !menuBarChromeVisible,
		amountBetInForeground: shouldShowBetControls(
			canvasSizes,
			mainLayout,
			layoutType,
			gameType,
			suppress,
			menuOpen,
		),
	};
};
