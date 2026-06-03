import _ from 'lodash';
import { Tween } from 'svelte/motion';

import { stateBet } from 'state-shared';
import { createEnhanceBoard, createReelForCascading } from 'utils-slots';
import { createGetWinLevelDataByWinLevelAlias } from 'utils-shared/winLevel';

import type { GameType, RawSymbol, SymbolState } from './types';
import { stateLayoutDerived } from './stateLayout';
import { winLevelMap } from './winLevelMap';
import { eventEmitter } from './eventEmitter';
import {
	SYMBOL_SIZE,
	BOARD_SIZES,
	INITIAL_BOARD,
	BOARD_DIMENSIONS,
	SPIN_OPTIONS_DEFAULT,
	SPIN_OPTIONS_FAST,
	INITIAL_SYMBOL_STATE,
	SCATTER_LAND_SOUND_MAP,
	BOTTOM_ROW_INDEX,
	getPlayAreaScale,
} from './constants';

// ─── Symbol land callbacks ────────────────────────────────────────────────────

const onSymbolLand = ({
	rawSymbol,
	symbolIndexOfBoard,
}: {
	rawSymbol: RawSymbol;
	symbolIndexOfBoard?: number;
}) => {
	if (symbolIndexOfBoard === BOTTOM_ROW_INDEX) {
		eventEmitter.broadcast({
			type: 'soundReelStop',
			forcePlay: !stateBet.isTurbo,
		});
	}

	if (rawSymbol.name === 'S') {
		eventEmitter.broadcast({ type: 'soundScatterCounterIncrease' });
		eventEmitter.broadcast({
			type: 'soundOnce',
			name: SCATTER_LAND_SOUND_MAP[scatterLandIndex()],
		});
	}

	if (rawSymbol.name === 'M') {
		eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_landing' });
	}
};

// ─── Board (cascade reels) ────────────────────────────────────────────────────

const board = _.range(BOARD_DIMENSIONS.x).map((reelIndex) => {
	const reel = createReelForCascading<RawSymbol, SymbolState>({
		reelIndex,
		symbolHeight: SYMBOL_SIZE,
		initialSymbols: INITIAL_BOARD[reelIndex],
		initialSymbolState: INITIAL_SYMBOL_STATE,
		onReelSpinStart: () => {
			if (reelIndex === 0) {
				eventEmitter.broadcast({ type: 'soundReelSpin' });
			}
		},
		onReelStopping: () => {},
		onSymbolLand,
	});

	reel.reelState.spinOptions = () =>
		reel.reelState.spinType === 'fast' ? SPIN_OPTIONS_FAST : SPIN_OPTIONS_DEFAULT;

	return reel;
});

// ─── Exported reel/symbol types ───────────────────────────────────────────────

export type Reel = (typeof board)[number];
export type ReelSymbol = Reel['reelState']['symbols'][number];

// ─── Tumble board types ───────────────────────────────────────────────────────

/**
 * A symbol inside the tumble overlay boards.
 * `symbolY` is a Svelte Tween so position animates smoothly.
 */
export type TumbleSymbol = {
	symbolY: Tween<number>;
	rawSymbol: RawSymbol;
	symbolState: SymbolState;
	oncomplete: () => void;
};

// ─── Global state ($state is reactive in Svelte 5) ────────────────────────────

export const stateGame = $state({
	board,
	gameType: 'basegame' as GameType,
	/** Symbols currently on the board during a tumble (base layer) */
	tumbleBoardBase: [] as TumbleSymbol[][],
	/** Symbols falling in from the top during a tumble (adding layer) */
	tumbleBoardAdding: [] as TumbleSymbol[][],
	/** Accumulated global multiplier (active during free spins) */
	globalMultiplier: 1,
	/** Scatter land counter for progressive scatter landing sounds */
	scatterCounter: 0,
	/** 3-D model loading gates; loading screen waits for these before start. */
	// hammer3DReady: false,
	thor3DReady: false,
	/** True while full-screen Pixi transition/intro panels should own the scene. */
	transitionActive: false,
	freeSpinIntroActive: false,
	/** True while the free-spin outro panel is visible (used by 3-D overlays to dim) */
	freeSpinOutroActive: false,
});

// ─── Derived computations ─────────────────────────────────────────────────────

const boardLayout = () => ({
	x: stateLayoutDerived.mainLayout().width * 0.5,
	y: stateLayoutDerived.mainLayout().height * 0.5,
	anchor: { x: 0.5, y: 0.5 },
	pivot: { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 },
	scale: getPlayAreaScale(
		stateLayoutDerived.layoutType(),
		stateLayoutDerived.canvasSizes(),
	),
	...BOARD_SIZES,
});

/**
 * Returns the current visible board as a raw 2D array of RawSymbol.
 * Used by the tumble board to snapshot the current board state.
 */
const boardRaw = () =>
	board.map((reel) => reel.reelState.symbols.map((reelSymbol) => reelSymbol.rawSymbol));

/**
 * Combines tumbleBoardAdding (falling in) and tumbleBoardBase (existing)
 * into a single array per reel for rendering during a tumble.
 */
const tumbleBoardCombined = () =>
	stateGame.tumbleBoardBase.map((tumbleReelBase, reelIndex) => {
		const tumbleReelAdding = stateGame.tumbleBoardAdding[reelIndex] ?? [];
		return [...tumbleReelAdding, ...tumbleReelBase];
	});

const scatterLandIndex = () => {
	if (stateGame.scatterCounter > 5) return 5;
	if (stateGame.scatterCounter < 1) return 1;
	return stateGame.scatterCounter as 1 | 2 | 3 | 4 | 5;
};

// ─── Enhanced board (spin/pre-spin/settle) ────────────────────────────────────

const { enhanceBoard } = createEnhanceBoard();
const enhancedBoard = enhanceBoard({ board: stateGame.board });

// ─── Win level helper ─────────────────────────────────────────────────────────

export const { getWinLevelDataByWinLevelAlias } = createGetWinLevelDataByWinLevelAlias({
	winLevelMap,
});

// ─── Exported derived state ───────────────────────────────────────────────────

export const stateGameDerived = {
	onSymbolLand,
	boardLayout,
	boardRaw,
	tumbleBoardCombined,
	scatterLandIndex,
	enhancedBoard,
	getWinLevelDataByWinLevelAlias,
};
