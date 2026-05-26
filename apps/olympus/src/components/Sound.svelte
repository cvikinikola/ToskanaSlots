<script lang="ts" module>
	import type { MusicName, SoundEffectName, SoundName } from '../game/sound';

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
	import { onMount } from 'svelte';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();
	const activeAudios = new Set<HTMLAudioElement>();
	let pageActive = $state(true);
	let lastThunderAt = 0;

	const updatePageActive = () => {
		pageActive = document.visibilityState === 'visible' && document.hasFocus();
		if (!pageActive) pauseActiveAudios();
	};

	const pauseActiveAudios = () => {
		activeAudios.forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		activeAudios.clear();
	};

	const playAudio = (src: string, volume = 1) => {
		if (!pageActive) return;

		const audio = new Audio(src);
		audio.volume = volume;
		activeAudios.add(audio);

		const cleanup = () => activeAudios.delete(audio);
		audio.addEventListener('ended', cleanup, { once: true });
		audio.addEventListener('pause', cleanup, { once: true });
		audio.play().catch(cleanup);
	};

	onMount(() => {
		updatePageActive();
		document.addEventListener('visibilitychange', updatePageActive);
		window.addEventListener('focus', updatePageActive);
		window.addEventListener('blur', updatePageActive);
		window.addEventListener('pagehide', pauseActiveAudios);

		return () => {
			pauseActiveAudios();
			document.removeEventListener('visibilitychange', updatePageActive);
			window.removeEventListener('focus', updatePageActive);
			window.removeEventListener('blur', updatePageActive);
			window.removeEventListener('pagehide', pauseActiveAudios);
		};
	});

	context.eventEmitter.subscribeOnMount({
		// Music
		soundMusic: ({ name }) => {
			// sound.players.music.play({ name });
			// Placeholder: log until real audio is wired
			console.debug('[sound] music →', name);
		},

		// One-shot SFX
		soundOnce: ({ name }) => {
			if (name === 'sfx_coin_clink') {
				const src =
					Math.random() < 0.5
						? '/assets/audio/clinking-coins.mp3'
						: '/assets/audio/clinking-coins1.mp3';
				playAudio(src);
				return;
			}
			if (name === 'sfx_thunder') {
				const now = performance.now();
				if (now - lastThunderAt < 4500) return;
				lastThunderAt = now;
				playAudio('/assets/audio/thunder.mp3', 0.55);
				return;
			}
			if (name === 'sfx_thunder_clap') {
				const now = performance.now();
				if (now - lastThunderAt < 4500) return;
				lastThunderAt = now;
				playAudio('/assets/audio/thunder_clap.mp3', 0.5);
				return;
			}
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
