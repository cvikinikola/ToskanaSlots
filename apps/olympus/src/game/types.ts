import type { CascadingReelSymbolState } from 'utils-slots';
import type config from './config';

// ─── Symbol types ─────────────────────────────────────────────────────────────

export type SymbolName = keyof typeof config.symbols;

export type RawSymbol = {
	/** Symbol identifier — must be one of GRID_SYMBOL_NAMES */
	name: SymbolName;
	/** Only present on 'S' (scatter) symbols */
	scatter?: boolean;
};

// ─── Game type ────────────────────────────────────────────────────────────────

export type GameType = keyof typeof config.paddingReels;

// ─── Board position ───────────────────────────────────────────────────────────

export type Position = {
	reel: number;
	row: number;
};

// ─── Symbol animation states ──────────────────────────────────────────────────

/**
 * States beyond the cascading reel's built-in states.
 * The component system uses these to trigger specific animations.
 */
export const EXTRA_SYMBOL_STATES = ['win', 'postWinStatic', 'explosion'] as const;

export type ExtraSymbolState = (typeof EXTRA_SYMBOL_STATES)[number];

export type SymbolState = CascadingReelSymbolState | ExtraSymbolState;
