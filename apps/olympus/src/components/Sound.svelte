<script lang="ts" module>
	import { sound, type MusicName, type SoundEffectName, type SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();

	context.eventEmitter.subscribeOnMount({
		// Music
		soundMusic: ({ name }) => {
			// sound.players.music.play({ name });
			// Placeholder: log until real audio is wired
			console.debug('[sound] music →', name);
		},

		// One-shot SFX
		soundOnce: ({ name, forcePlay }) => {
			// sound.players.once.play({ name });
			console.debug('[sound] sfx →', name);
		},

		// Looping SFX (e.g. coin shower during big win)
		soundLoop: ({ name }) => {
			// sound.players.loop.play({ name });
			console.debug('[sound] loop →', name);
		},

		// Stop a specific sound
		soundStop: ({ name }) => {
			// sound.players.loop.stop({ name });
			console.debug('[sound] stop →', name);
		},

		// Scatter landing counter – drives progressive scatter sound selection
		soundScatterCounterIncrease: () => {
			stateGame.scatterCounter++;
		},

		soundScatterCounterClear: () => {
			stateGame.scatterCounter = 0;
		},
	});
</script>
