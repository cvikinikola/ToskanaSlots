import type { EmitterEventBoard } from '../components/Board.svelte';
import type { EmitterEventTumbleBoard } from '../components/TumbleBoard.svelte';
import type { EmitterEventGlobalMultiplier } from '../components/GlobalMultiplier.svelte';
import type { EmitterEventMultiplierFly } from '../components/MultiplierFly.svelte';
import type { EmitterEventTumbleWinAmount } from '../components/TumbleWinAmount.svelte';
import type { EmitterEventTumbleHistory } from '../components/TumbleHistory.svelte';
import type { EmitterEventFreeSpinIntro } from '../components/FreeSpinIntro.svelte';
import type { EmitterEventFreeSpinCounter } from '../components/FreeSpinCounter.svelte';
import type { EmitterEventFreeSpinOutro } from '../components/FreeSpinOutro.svelte';
import type { EmitterEventWin } from '../components/Win.svelte';
import type { EmitterEventSound } from '../components/Sound.svelte';
import type { EmitterEventTransition } from '../components/Transition.svelte';
import type { EmitterEventWinSparks } from '../components/WinSparks.svelte';
import type { EmitterEventLightningCrackle } from '../components/LightningCrackle.svelte';
import type { EmitterEventWinGlow } from '../components/WinGlow.svelte';

/**
 * The union of all typed emitter events for this game.
 * Every component that subscribes to events should export its own slice of this union.
 */
export type EmitterEventGame =
	| EmitterEventBoard
	| EmitterEventTumbleBoard
	| EmitterEventGlobalMultiplier
	| EmitterEventMultiplierFly
	| EmitterEventTumbleWinAmount
	| EmitterEventTumbleHistory
	| EmitterEventFreeSpinIntro
	| EmitterEventFreeSpinCounter
	| EmitterEventFreeSpinOutro
	| EmitterEventWin
	| EmitterEventSound
	| EmitterEventTransition
	| EmitterEventWinSparks
	| EmitterEventLightningCrackle
	| EmitterEventWinGlow;
