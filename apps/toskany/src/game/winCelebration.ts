import { bookEventAmountToBetAmountMultiplier } from 'utils-shared/amount';

import { winLevelMap, type WinLevelData } from './winLevelMap';

/** Presentation length — matched to Bravo clip lengths (big shorter, super/mega longer). */
export const BIG_WIN_CELEBRATION_MS_BIG = 4800;
export const BIG_WIN_CELEBRATION_MS_SUPER_MEGA = 9000;

export const getCelebrationDuration = (winLevelData: WinLevelData) =>
	winLevelData.alias === 'big'
		? BIG_WIN_CELEBRATION_MS_BIG
		: BIG_WIN_CELEBRATION_MS_SUPER_MEGA;

export const getCelebrationSoundName = (
	winLevelData: WinLevelData,
): 'sfx_bravo_big_super' | 'sfx_bravo_mega_epic' =>
	winLevelData.alias === 'big' ? 'sfx_bravo_big_super' : 'sfx_bravo_mega_epic';

const CELEBRATION_ALIASES = new Set(['big', 'superwin', 'mega']);

export const isBaseBigWinCelebration = (winLevelData: WinLevelData | undefined) =>
	winLevelData?.type === 'big' && CELEBRATION_ALIASES.has(winLevelData.alias);

export const winCelebrationImageKey = (
	winLevelData: WinLevelData,
): 'win_big' | 'win_super' | 'win_mega' => {
	if (winLevelData.alias === 'superwin') return 'win_super';
	if (winLevelData.alias === 'mega') return 'win_mega';
	return 'win_big';
};

/** Min bet multipliers for grid BIG / SUPER / MEGA celebration tiers. */
export const WIN_TIER_BIG_MIN = 10;
export const WIN_TIER_SUPER_MIN = 30;
export const WIN_TIER_MEGA_MIN = 100;

/** 10×–30× / 30×–100× / 100×+ bet thresholds for BIG / SUPER / MEGA art. */
export const getCelebrationTierByAmount = (amount: number): WinLevelData | undefined => {
	const mult = bookEventAmountToBetAmountMultiplier(amount);
	if (mult >= WIN_TIER_MEGA_MIN) return winLevelMap[8];
	if (mult >= WIN_TIER_SUPER_MIN) return winLevelMap[7];
	if (mult >= WIN_TIER_BIG_MIN) return winLevelMap[6];
	return undefined;
};

export type SpinEndMultiplyData = {
	raw: number;
	multiplied: number;
	multiplier: number;
};

/**
 * Final per-spin win for grid celebration tier (BIG/SUPER/MEGA).
 * Free-spin books often defer globalMult until spin end — `totalWin` in winInfo
 * can be pre-global while the panel later count-ups to tumbleTotal × globalMult.
 */
export const resolveGridWinCelebrationAmount = (
	tumbleWinBookEventAmount: number,
	spinEndMultiply: SpinEndMultiplyData | null,
): number => {
	let final = tumbleWinBookEventAmount;
	if (!spinEndMultiply) return final;

	const { raw, multiplied, multiplier } = spinEndMultiply;
	final = Math.max(final, multiplied);

	if (multiplier > 1 && raw > 0) {
		final = Math.max(final, Math.round(raw * multiplier));
	}

	return final;
};
