import { cubicInOut } from 'svelte/easing';

import { waitForTimeout } from 'utils-shared/wait';

import {
	BLINK_HOLD_MS,
	BLINK_INTERVAL_MAX_MS,
	BLINK_INTERVAL_MIN_MS,
	BREATH_DURATION_MS,
	BREATH_SCALE_MAX,
	BREATH_SCALE_MIN,
	randomBetween,
	sineInOut,
	TOAST_CROSSFADE_MS,
	TOAST_HOLD_MS,
} from './backgroundCharacter';

export type DekaAnimController = {
	stop: () => void;
	/** Play the toast/salute pose (e.g. on spin win). No-op while already saluting. */
	triggerSalute: () => void;
};

export type DekaAnimOptions = {
	setIdleAlpha: (alpha: number) => void;
	setBlinkAlpha: (alpha: number) => void;
	setToastAlpha: (alpha: number) => void;
	setBreathScale: (scale: number) => void;
	setSaluteActive: (active: boolean) => void;
};

const waitMs = async (ms: number, isActive: () => boolean) => {
	const end = performance.now() + ms;
	while (performance.now() < end) {
		if (!isActive()) return;
		if (document.hidden) {
			await waitForTimeout(120);
			continue;
		}
		await waitForTimeout(Math.min(40, end - performance.now()));
	}
};

const lerpAlpha = async (
	fromIdle: number,
	toIdle: number,
	fromToast: number,
	toToast: number,
	duration: number,
	controls: DekaAnimOptions,
	isActive: () => boolean,
) => {
	const start = performance.now();
	while (performance.now() - start < duration) {
		if (!isActive()) return;
		if (document.hidden) {
			await waitForTimeout(16);
			continue;
		}
		const t = cubicInOut((performance.now() - start) / duration);
		controls.setIdleAlpha(fromIdle + (toIdle - fromIdle) * t);
		controls.setToastAlpha(fromToast + (toToast - fromToast) * t);
		controls.setBlinkAlpha(0);
		await waitForTimeout(16);
	}
	controls.setIdleAlpha(toIdle);
	controls.setToastAlpha(toToast);
	controls.setBlinkAlpha(0);
};

const snapIdle = (controls: DekaAnimOptions) => {
	controls.setIdleAlpha(1);
	controls.setBlinkAlpha(0);
	controls.setToastAlpha(0);
	controls.setSaluteActive(false);
};

const runBlink = async (controls: DekaAnimOptions, isActive: () => boolean) => {
	controls.setIdleAlpha(0);
	controls.setBlinkAlpha(1);
	controls.setToastAlpha(0);
	await waitMs(BLINK_HOLD_MS, isActive);
	if (!isActive()) return;
	controls.setBlinkAlpha(0);
	controls.setIdleAlpha(1);
};

const runToast = async (controls: DekaAnimOptions, isActive: () => boolean) => {
	snapIdle(controls);

	await lerpAlpha(1, 0, 0, 1, TOAST_CROSSFADE_MS, controls, isActive);
	if (!isActive()) return;

	await waitMs(TOAST_HOLD_MS, isActive);
	if (!isActive()) return;

	await lerpAlpha(0, 1, 1, 0, TOAST_CROSSFADE_MS, controls, isActive);
};

export const startBackgroundCharacterAnim = (
	controls: DekaAnimOptions,
): DekaAnimController => {
	let token = 1;
	let breathRaf = 0;
	let nextBlinkAt = performance.now() + randomBetween(BLINK_INTERVAL_MIN_MS, BLINK_INTERVAL_MAX_MS);
	let toastActive = false;
	let salutePending = false;

	const isActive = () => token !== 0;

	const runSalute = async () => {
		if (!isActive() || toastActive) return;
		toastActive = true;
		controls.setSaluteActive(true);
		await runToast(controls, isActive);
		toastActive = false;
		if (!isActive()) return;
		snapIdle(controls);
		if (salutePending) {
			salutePending = false;
			void runSalute();
		}
	};

	const startBreathing = () => {
		const start = performance.now();
		const tick = (now: number) => {
			if (!isActive()) return;
			if (!document.hidden) {
				const t = ((now - start) % BREATH_DURATION_MS) / BREATH_DURATION_MS;
				const wave =
					t < 0.5 ? sineInOut(t * 2) : sineInOut((1 - t) * 2);
				controls.setBreathScale(
					BREATH_SCALE_MIN + (BREATH_SCALE_MAX - BREATH_SCALE_MIN) * wave,
				);
			}
			breathRaf = requestAnimationFrame(tick);
		};
		breathRaf = requestAnimationFrame(tick);
	};

	const runSequence = async (runToken: number) => {
		while (runToken === token) {
			await waitMs(250, isActive);
			if (runToken !== token) return;

			const now = performance.now();

			if (!toastActive && now >= nextBlinkAt) {
				await runBlink(controls, isActive);
				if (runToken !== token) return;
				nextBlinkAt =
					performance.now() + randomBetween(BLINK_INTERVAL_MIN_MS, BLINK_INTERVAL_MAX_MS);
			}
		}
	};

	snapIdle(controls);
	controls.setBreathScale(BREATH_SCALE_MIN);
	startBreathing();
	void runSequence(token);

	return {
		stop: () => {
			token = 0;
			salutePending = false;
			cancelAnimationFrame(breathRaf);
			controls.setSaluteActive(false);
			snapIdle(controls);
			controls.setBreathScale(BREATH_SCALE_MIN);
		},
		triggerSalute: () => {
			if (!isActive()) return;
			if (toastActive) {
				salutePending = true;
				return;
			}
			void runSalute();
		},
	};
};
