import { getAudioDurationMs, preloadAudioDuration } from './audioDuration';
import type { WinLevelData } from './winLevelMap';

export const BRAVO_BIG_SUPER_SRC = '/assets/audio/Bravo_big_super.mp3';
export const BRAVO_MEGA_EPIC_SRC = '/assets/audio/Bravo_mega_epic_legendary.mp3';

export const BRAVO_BIG_SUPER_FALLBACK_MS = 4800;
export const BRAVO_MEGA_EPIC_FALLBACK_MS = 9000;

/** Share of the Bravo clip used for the amount count-up. */
export const GRID_WIN_COUNT_FRACTION = 0.85;

export const getGridWinCelebrationSoundSrc = (winLevelData: WinLevelData) =>
	winLevelData.alias === 'big' ? BRAVO_BIG_SUPER_SRC : BRAVO_MEGA_EPIC_SRC;

export const getGridWinCelebrationSoundName = (
	winLevelData: WinLevelData,
): 'sfx_bravo_big_super' | 'sfx_bravo_mega_epic' =>
	winLevelData.alias === 'big' ? 'sfx_bravo_big_super' : 'sfx_bravo_mega_epic';

export const preloadGridWinCelebrationDurations = () => {
	preloadAudioDuration(BRAVO_BIG_SUPER_SRC, BRAVO_BIG_SUPER_FALLBACK_MS);
	preloadAudioDuration(BRAVO_MEGA_EPIC_SRC, BRAVO_MEGA_EPIC_FALLBACK_MS);
};

export const getGridWinCelebrationDurationMs = (winLevelData: WinLevelData) =>
	getAudioDurationMs(
		getGridWinCelebrationSoundSrc(winLevelData),
		winLevelData.alias === 'big' ? BRAVO_BIG_SUPER_FALLBACK_MS : BRAVO_MEGA_EPIC_FALLBACK_MS,
	);
