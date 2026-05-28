<script lang="ts" module>
	import type { MusicName, SoundEffectName, SoundName } from '../game/sound';

	export type EmitterEventSound =
		| { type: 'soundMusic'; name: MusicName }
		| { type: 'soundOnce'; name: SoundEffectName; forcePlay?: boolean }
		| { type: 'soundReelSpin' }
		| { type: 'soundReelStop'; forcePlay?: boolean; playbackRate?: number }
		| { type: 'soundSymbolDestroy' }
		| { type: 'soundLoop'; name: SoundEffectName }
		| { type: 'soundStop'; name: SoundName }
		| { type: 'soundFade'; name: SoundName; from: number; to: number; duration: number }
		| { type: 'soundScatterCounterIncrease' }
		| { type: 'soundScatterCounterClear' };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import { stateGame } from '../game/stateGame.svelte';

	const context = getContext();
	const activeAudios = new Set<HTMLAudioElement>();
	let pageActive = $state(true);
	let lastThunderAt = 0;
	let lastReelSpinAt = 0;
	let lastReelStopAt = 0;
	const soundEffectVolume = $derived(
		Math.max(0, Math.min(1, stateSoundDerived.volumeSoundEffect())),
	);

	const updatePageActive = () => {
		pageActive = document.visibilityState === 'visible';
		if (!pageActive) pauseActiveAudios();
	};

	const pauseActiveAudios = () => {
		activeAudios.forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		activeAudios.clear();
	};

	const playAudio = (src: string, volume = 1, playbackRate = 1) => {
		if (!pageActive) return;
		if (soundEffectVolume <= 0) return;

		const audio = new Audio(src);
		audio.volume = Math.max(0, Math.min(1, volume * soundEffectVolume));
		audio.playbackRate = playbackRate;
		activeAudios.add(audio);

		const cleanup = () => activeAudios.delete(audio);
		audio.addEventListener('ended', cleanup, { once: true });
		audio.addEventListener('pause', cleanup, { once: true });
		audio.play().catch(cleanup);
	};

	$effect(() => {
		if (soundEffectVolume <= 0) pauseActiveAudios();
	});

	onMount(() => {
		updatePageActive();
		document.addEventListener('visibilitychange', updatePageActive);
		window.addEventListener('pageshow', updatePageActive);
		window.addEventListener('pagehide', pauseActiveAudios);

		return () => {
			pauseActiveAudios();
			document.removeEventListener('visibilitychange', updatePageActive);
			window.removeEventListener('pageshow', updatePageActive);
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
			if (name === 'sfx_reel_spin') {
				const now = performance.now();
				if (now - lastReelSpinAt < 80) return;
				lastReelSpinAt = now;
				playAudio('/assets/audio/spin.mp3', 0.8);
				return;
			}
			if (name === 'sfx_reel_stop_1') {
				const now = performance.now();
				if (now - lastReelStopAt < 80) return;
				lastReelStopAt = now;
				playAudio('/assets/audio/zaustavljanje.mp3', 0.85);
				return;
			}
			if (name === 'sfx_symbol_destroy') {
				playAudio('/assets/audio/unistenjeSimbola.wav', 0.9);
				return;
			}
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

		soundReelSpin: () => {
			const now = performance.now();
			if (now - lastReelSpinAt < 80) return;
			lastReelSpinAt = now;
			playAudio('/assets/audio/spin.mp3', 0.8);
		},

		soundReelStop: ({ forcePlay = false, playbackRate = 1 }) => {
			const now = performance.now();
			if (!forcePlay && now - lastReelStopAt < 80) return;
			lastReelStopAt = now;
			playAudio('/assets/audio/zaustavljanje.mp3', 0.85, playbackRate);
		},

		soundSymbolDestroy: () => {
			playAudio('/assets/audio/unistenjeSimbola.wav', 0.9);
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
