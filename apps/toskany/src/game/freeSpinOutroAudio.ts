/** Free-spin outro sting — duration drives panel + count-up timing. */
export const FREE_SPIN_OUTRO_MUSIC_SRC = '/assets/audio/Vinyl%20Jackpot.mp3';

/** Matches Vinyl Jackpot.mp3 (00:00:10) if metadata is unavailable. */
export const FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS = 10_000;

/** Share of the track used for the balance count-up; remainder holds the final amount. */
export const FREE_SPIN_OUTRO_COUNT_FRACTION = 0.88;

let cachedDurationMs: number | null = null;

export const preloadFreeSpinOutroMusicDuration = () => {
	void getFreeSpinOutroMusicDurationMs();
};

export const getFreeSpinOutroMusicDurationMs = (): Promise<number> => {
	if (cachedDurationMs != null) return Promise.resolve(cachedDurationMs);

	return new Promise((resolve) => {
		const finish = (ms: number) => {
			cachedDurationMs = ms;
			resolve(ms);
		};

		const audio = new Audio(FREE_SPIN_OUTRO_MUSIC_SRC);
		audio.preload = 'metadata';
		audio.addEventListener(
			'loadedmetadata',
			() => {
				finish(
					Number.isFinite(audio.duration) && audio.duration > 0
						? Math.round(audio.duration * 1000)
						: FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS,
				);
			},
			{ once: true },
		);
		audio.addEventListener('error', () => finish(FREE_SPIN_OUTRO_MUSIC_FALLBACK_MS), {
			once: true,
		});
		audio.load();
	});
};
