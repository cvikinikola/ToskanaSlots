import { getAudioDurationMs, preloadAudioDuration } from './audioDuration';

/** Free-spin outro sting — duration drives panel + count-up timing. */
export const FREE_SPIN_OUTRO_MUSIC_SRC = '/assets/audio/Vinyl%20Jackpot.mp3';

/** Matches Vinyl Jackpot.mp3 (00:00:10) if metadata is unavailable. */
export const FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS = 10_000;

/** Share of the track used for the balance count-up; remainder holds the final amount. */
export const FREE_SPIN_OUTRO_COUNT_FRACTION = 0.88;

export const preloadFreeSpinOutroMusicDuration = () => {
	preloadAudioDuration(FREE_SPIN_OUTRO_MUSIC_SRC, FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS);
};

export const getFreeSpinOutroMusicDurationMs = () =>
	getAudioDurationMs(FREE_SPIN_OUTRO_MUSIC_SRC, FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS);
