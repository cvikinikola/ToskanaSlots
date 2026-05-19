import { createEventEmitter } from 'utils-event-emitter';
import type { EmitterEventHotKey } from 'components-shared';
import type { EmitterEventUi } from 'components-ui-pixi';
import type { EmitterEventModal } from 'components-ui-html';

import type { EmitterEventGame } from './typesEmitterEvent';

/**
 * The full emitter event union for the olympus game.
 * Includes both SDK-provided events (UI, hotkeys, modals) and game-specific events.
 */
export type EmitterEvent =
	| EmitterEventHotKey
	| EmitterEventUi
	| EmitterEventModal
	| EmitterEventGame;

export const { eventEmitter } = createEventEmitter<EmitterEvent>();
