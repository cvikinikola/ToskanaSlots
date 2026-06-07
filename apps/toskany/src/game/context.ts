import { setContextEventEmitter, getContextEventEmitter } from 'utils-event-emitter';
import { setContextXstate, getContextXstate } from 'utils-xstate';
import { setContextLayout, getContextLayout } from 'utils-layout';
import { setContextApp, getContextApp } from 'pixi-svelte';

import { eventEmitter, type EmitterEvent } from './eventEmitter';
import { stateXstate, stateXstateDerived } from './stateXstate';
import { stateLayout, stateLayoutDerived } from './stateLayout';
import { stateApp } from './stateApp';
import { stateGame, stateGameDerived } from './stateGame.svelte';
import { i18nDerived } from '../i18n/i18nDerived';

/**
 * Call `setContext()` once at the root layout level.
 * This makes eventEmitter, layout, xstate, and pixi app
 * available to all child components via `getContext()`.
 */
export const setContext = () => {
	setContextEventEmitter<EmitterEvent>({ eventEmitter });
	setContextXstate({ stateXstate, stateXstateDerived });
	setContextLayout({ stateLayout, stateLayoutDerived });
	setContextApp({ stateApp });
};

/**
 * Call `getContext()` inside any game component to access
 * all shared state and utilities.
 */
export const getContext = () => ({
	...getContextEventEmitter<EmitterEvent>(),
	...getContextLayout(),
	...getContextXstate(),
	...getContextApp(),
	stateGame,
	stateGameDerived,
	i18nDerived,
});
