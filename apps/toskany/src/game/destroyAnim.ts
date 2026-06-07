import { Tween } from 'svelte/motion';
import { backOut, cubicIn, cubicOut } from 'svelte/easing';

/** 1) Čučnu — spljošti se. */
const SQUASH_SCALE_X = 1.65;
const SQUASH_SCALE_Y = 0.42;
const SQUASH_DURATION_MS = 260;

/** 2) Poskoče — rastegnu se i podignu. */
const STRETCH_SCALE_X = 0.68;
const STRETCH_SCALE_Y = 1.45;
const STRETCH_LIFT_Y = -22;
const STRETCH_DURATION_MS = 320;

/** 3) Skoro prirodan — vrate se u normalu pre pucanja. */
const SETTLE_SCALE = 1;
const SETTLE_DURATION_MS = 220;

/** 4) Puknu — burst + nestanu. */
const POP_SCALE = 2.35;
const POP_DURATION_MS = 420;
const FADE_DURATION_MS = 540;

const TURBO_FACTOR = 0.68;

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

const ms = (duration: number, turbo: boolean) =>
	Math.round(duration * (turbo ? TURBO_FACTOR : 1));

/** Total destroy animation length — keep in sync with TUMBLE_OPTIONS.explosionDuration*. */
export const getDestroyAnimDurationMs = (turbo: boolean) =>
	ms(
		SQUASH_DURATION_MS +
			STRETCH_DURATION_MS +
			SETTLE_DURATION_MS +
			Math.max(POP_DURATION_MS, FADE_DURATION_MS),
		turbo,
	);

/**
 * Destroy: čučnu → poskoče → skoro normal → puknu.
 */
export const destroySquashExplode = async (
	scaleX: Tween<number>,
	scaleY: Tween<number>,
	alpha: Tween<number>,
	jumpY: Tween<number>,
	turbo = false,
) => {
	await setScalePair(
		scaleX,
		scaleY,
		SQUASH_SCALE_X,
		SQUASH_SCALE_Y,
		ms(SQUASH_DURATION_MS, turbo),
		cubicOut,
	);
	await Promise.all([
		setScalePair(
			scaleX,
			scaleY,
			STRETCH_SCALE_X,
			STRETCH_SCALE_Y,
			ms(STRETCH_DURATION_MS, turbo),
			backOut,
		),
		jumpY.set(STRETCH_LIFT_Y, { duration: ms(STRETCH_DURATION_MS, turbo), easing: backOut }),
	]);
	await Promise.all([
		setScalePair(
			scaleX,
			scaleY,
			SETTLE_SCALE,
			SETTLE_SCALE,
			ms(SETTLE_DURATION_MS, turbo),
			cubicOut,
		),
		jumpY.set(0, { duration: ms(SETTLE_DURATION_MS, turbo), easing: cubicOut }),
	]);
	await Promise.all([
		setScalePair(scaleX, scaleY, POP_SCALE, POP_SCALE, ms(POP_DURATION_MS, turbo), cubicIn),
		alpha.set(0, { duration: ms(FADE_DURATION_MS, turbo), easing: cubicIn }),
	]);
};
