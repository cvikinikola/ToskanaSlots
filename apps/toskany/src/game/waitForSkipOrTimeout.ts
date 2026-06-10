/** Wait until duration elapses or the player taps / presses a key. */
export const waitForSkipOrTimeout = (
	durationMs: number,
	onSkip?: () => void,
): Promise<{ skipped: boolean }> =>
	new Promise((resolve) => {
		let settled = false;
		let timeout: ReturnType<typeof setTimeout>;

		const cleanup = () => {
			window.removeEventListener('pointerdown', onInput);
			window.removeEventListener('keydown', onInput);
			clearTimeout(timeout);
		};

		const finish = (skipped: boolean) => {
			if (settled) return;
			settled = true;
			cleanup();
			if (skipped) onSkip?.();
			resolve({ skipped });
		};

		const onInput = () => finish(true);

		window.addEventListener('pointerdown', onInput);
		window.addEventListener('keydown', onInput);
		timeout = setTimeout(() => finish(false), Math.max(0, durationMs));
	});
