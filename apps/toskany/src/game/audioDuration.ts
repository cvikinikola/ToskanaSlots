const durationCache = new Map<string, number>();

export const getAudioDurationMs = (src: string, fallbackMs: number): Promise<number> => {
	const cached = durationCache.get(src);
	if (cached != null) return Promise.resolve(cached);

	return new Promise((resolve) => {
		const finish = (ms: number) => {
			durationCache.set(src, ms);
			resolve(ms);
		};

		const audio = new Audio(src);
		audio.preload = 'metadata';
		audio.addEventListener(
			'loadedmetadata',
			() => {
				finish(
					Number.isFinite(audio.duration) && audio.duration > 0
						? Math.round(audio.duration * 1000)
						: fallbackMs,
				);
			},
			{ once: true },
		);
		audio.addEventListener('error', () => finish(fallbackMs), { once: true });
		audio.load();
	});
};

export const preloadAudioDuration = (src: string, fallbackMs: number) => {
	void getAudioDurationMs(src, fallbackMs);
};
