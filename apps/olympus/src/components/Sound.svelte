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
	// Spin debounce must be long enough to cover the per-reel stagger
	// (reelFallOutDelay × number of reels ≈ 110 × 6 ≈ 660ms). Otherwise
	// each reel's onReelSpinStart fires its own play and we hear the
	// spin sound 3-6 times overlapped.
	let lastReelSpinAt = 0;
	const REEL_SPIN_DEBOUNCE_MS = 800;
	// Stop debounce only needs to suppress duplicate calls from the same
	// reel-stop moment (e.g. turbo where all reels stop together). Per-reel
	// stops in normal mode are staggered by 170ms+, well above this threshold.
	let lastReelStopAt = 0;
	const REEL_STOP_DEBOUNCE_MS = 40;
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
				if (now - lastReelSpinAt < REEL_SPIN_DEBOUNCE_MS) return;
				lastReelSpinAt = now;
				playAudio('/assets/audio/spin.mp3', 0.8);
				return;
			}
			if (name === 'sfx_reel_stop_1') {
				const now = performance.now();
				if (now - lastReelStopAt < REEL_STOP_DEBOUNCE_MS) return;
				lastReelStopAt = now;
				playAudio('/assets/audio/stop.mp3', 1.0);
				return;
			}
			if (name === 'sfx_symbol_destroy') {
				playAudio('/assets/audio/destroy.mp3', 0.9);
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
			// Free spin start jingle (freeSpinTrigger / freeSpinRetrigger)
			if (name === 'jng_intro_fs') {
				playAudio('/assets/audio/Massive_Thor_hammer__2-1779125404081.mp3', 0.9);
				return;
			}
			// Free spin end — "You Won" panel fanfare
			if (name === 'sfx_youwon_panel') {
				playAudio('/assets/audio/Massive_Thor_hammer__2-1779125404081.mp3', 0.9);
				return;
			}
			// sound.players.once.play({ name });
			console.debug('[sound] sfx →', name);
		},

		// spin.mp3 — plays ONCE when the reels physically start spinning.
		// Each of the 6 reels triggers this event on its own (staggered by
		// reelFallOutDelay), so we debounce aggressively so the player hears
		// a single "whoosh" per spin, not 6 overlapping copies.
		soundReelSpin: () => {
			const now = performance.now();
			if (now - lastReelSpinAt < REEL_SPIN_DEBOUNCE_MS) return;
			lastReelSpinAt = now;
			playAudio('/assets/audio/spin.mp3', 0.8);
		},

		// stop.mp3 — plays once per reel that lands.
		// • Normal mode: 6 staggered plays (one per reel).
		// • Turbo mode: all reels stop together; the short debounce collapses
		//   the burst to a single play, which matches the spec.
		// • Tumble: TumbleBoard.svelte sets forcePlay=true so every reel that
		//   actually moved gets its own stop sound, regardless of debounce.
		soundReelStop: ({ forcePlay = false, playbackRate = 1 }) => {
			const now = performance.now();
			if (!forcePlay && now - lastReelStopAt < REEL_STOP_DEBOUNCE_MS) return;
			lastReelStopAt = now;
			playAudio('/assets/audio/stop.mp3', 1.0, playbackRate);
		},

		// destroy.mp3 — winning symbols exploding before the cascade.
		soundSymbolDestroy: () => {
			playAudio('/assets/audio/destroy.mp3', 0.9);
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
