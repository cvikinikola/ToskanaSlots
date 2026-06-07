import { Tween } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

/** Squash on impact — scale.x widens as scale.y compresses (volume preserved). */
const SQUASH_SCALE_X = 1.3;
const SQUASH_SCALE_Y = 0.7;
const SQUASH_DURATION_MS = 90;

/** Stretch upward after squash. */
const STRETCH_SCALE_X = 0.9;
const STRETCH_SCALE_Y = 1.1;
const STRETCH_DURATION_MS = 110;

/** Settle back to rest with elastic overshoot. */
const NORMAL_SCALE = 1;
const NORMAL_DURATION_MS = 500;
const ELASTIC_AMPLITUDE = 1;
const ELASTIC_PERIOD = 0.45;

const makeElasticOut = (amplitude: number, period: number) => {
	const s = (period / (2 * Math.PI)) * Math.asin(1 / amplitude);

	return (t: number) => {
		if (t === 0 || t === 1) return t;
		return amplitude * 2 ** (-10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / period) + 1;
	};
};

const elasticOutLand = makeElasticOut(ELASTIC_AMPLITUDE, ELASTIC_PERIOD);

const setScalePair = (
	scaleX: Tween<number>,
	scaleY: Tween<number>,
	x: number,
	y: number,
	duration: number,
	easing?: (t: number) => number,
) =>
	Promise.all([
		scaleX.set(x, { duration, easing }),
		scaleY.set(y, { duration, easing }),
	]);

/**
 * Squash-and-stretch landing bounce for any symbol sprite.
 * Fire-and-forget — does not block game / tumble logic.
 */
export const landBounce = async (scaleX: Tween<number>, scaleY: Tween<number>) => {
	await setScalePair(scaleX, scaleY, SQUASH_SCALE_X, SQUASH_SCALE_Y, SQUASH_DURATION_MS, cubicOut);
	await setScalePair(
		scaleX,
		scaleY,
		STRETCH_SCALE_X,
		STRETCH_SCALE_Y,
		STRETCH_DURATION_MS,
		cubicOut,
	);
	await setScalePair(
		scaleX,
		scaleY,
		NORMAL_SCALE,
		NORMAL_SCALE,
		NORMAL_DURATION_MS,
		elasticOutLand,
	);
};
