import type { DekaLayout } from './backgroundCharacter';

/** Pose synced from BackgroundCharacter — beside deka draws after the board. */
export const dekaSaluteVisual = $state({
	/** Beside: always on top of frame; portrait header: only during salute. */
	visible: false,
	layout: null as DekaLayout | null,
	isHeader: false,
	breathScale: 1,
	idleAlpha: 1,
	blinkAlpha: 0,
	toastAlpha: 0,
});
