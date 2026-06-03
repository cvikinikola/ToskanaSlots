import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventBoardFrame } from '../components/BoardFrame.svelte';
import type { EmitterEventTumbleBoard } from '../components/TumbleBoard.svelte';
import type { EmitterEventSpotMultipliers } from '../components/SpotMultipliers.svelte';
import type { EmitterEventTumbleWinAmount } from '../components/TumbleWinAmount.svelte';
import type { EmitterEventTumbleHistory } from '../components/TumbleHistory.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventWinSparks } from '../components/WinSparks.svelte';
import type { EmitterEventNatureBurst } from '../components/NatureBurst.svelte';
import type { EmitterEventWinGlow } from '../components/WinGlow.svelte';

/**
 * The union of all typed emitter events for this game.
 * Every component that subscribes to events should export its own slice of this union.
 */
export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventBoardFrame
	| EmitterEventTumbleBoard
	| EmitterEventSpotMultipliers
	| EmitterEventTumbleWinAmount
	| EmitterEventTumbleHistory
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventWin
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventWinSparks
	| EmitterEventNatureBurst
	| EmitterEventWinGlow;
