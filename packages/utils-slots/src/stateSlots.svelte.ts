export const stateSlots = $state({
	isPreSpinning: false,
	activeRevealBoard: undefined as object[][] | undefined,
	/** STOP clicked before reveal board was ready — settle instantly when spin starts. */
	skipStopRequested: false,
	/** STOP settled the board mid-spin — skip remaining reel animation. */
	spinStopSettled: false,
});
