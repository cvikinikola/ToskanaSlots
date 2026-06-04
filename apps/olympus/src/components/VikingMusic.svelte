<script lang="ts">
	import { onMount } from 'svelte';
	import { stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import type { MusicName } from '../game/sound';

	/**
	 * Background music player.
	 *
	 * QA 04.06.2026: prati `soundMusic` event i menja track izmedju base
	 * game-a i free spinova. Za winlevel BGM nazive (bigwin/superwin/mega/
	 * epic/max) trenutno ne menjamo track (zvuk je vec pokriven SFX-om)
	 * ali smo na tu poruku spremni \u2014 dodati novu mapu kad asset stigne.
	 *
	 * Browsers block autoplay until the first user gesture, so we arm a
	 * one-shot pointer/key/touch listener and start playback then.
	 * Volume tracks the global music slider from `state-shared` (0 = pause).
	 */

	const TRACK_MAIN = '/assets/audio/Nova_pozadinska_Muzika.wav';
	const TRACK_FREESPIN = '/assets/audio/sound_loop_no_vocal.wav';
	const FADE_MS = 400;
	const TRACK_SWITCH_FADE_MS = 700;

	const context = getContext();

	let audio: HTMLAudioElement | undefined = $state();
	let currentTrack = $state(TRACK_MAIN);
	let armed = $state(false);
	let pageActive = $state(true);
	let fadeRun = 0;

	const musicVolume = $derived(stateSoundDerived.volumeMusic());
	const targetVolume = $derived(pageActive ? Math.max(0, Math.min(1, musicVolume)) : 0);

	const trackForName = (name: MusicName): string => {
		if (name === 'bgm_freespin') return TRACK_FREESPIN;
		// Sve ostalo (winlevel BGM-ovi, bgm_main) ide na main loop.
		return TRACK_MAIN;
	};

	const switchTrack = (nextTrack: string) => {
		if (!audio) return;
		if (nextTrack === currentTrack) return;
		currentTrack = nextTrack;
		// Crossfade: brzo fade-out na 0, switch src, fade-in na target.
		const wasArmed = armed;
		const fadeOutMs = TRACK_SWITCH_FADE_MS / 2;
		const run = ++fadeRun;
		const start = audio.volume;
		const t0 = performance.now();
		const fadeOut = () => {
			if (run !== fadeRun || !audio) return;
			const k = Math.min(1, (performance.now() - t0) / fadeOutMs);
			try {
				audio.volume = Math.max(0, start * (1 - k));
			} catch {}
			if (k < 1) {
				requestAnimationFrame(fadeOut);
				return;
			}
			audio.pause();
			audio.src = nextTrack;
			audio.load();
			audio.currentTime = 0;
			if (wasArmed && targetVolume > 0) {
				audio.volume = 0;
				audio.play().catch(() => {});
				fadeTo(targetVolume);
			}
		};
		requestAnimationFrame(fadeOut);
	};

	function fadeTo(target: number) {
		if (!audio) return;
		const run = ++fadeRun;
		const start = audio.volume;
		if (target > 0 && audio.paused) {
			audio.volume = 0;
			audio.play().catch(() => {});
		}
		const t0 = performance.now();
		const step = () => {
			if (run !== fadeRun) return;
			if (!audio) return;
			const k = Math.min(1, (performance.now() - t0) / FADE_MS);
			try {
				audio.volume = Math.max(0, Math.min(1, start + (target - start) * k));
			} catch {}
			if (k < 1) requestAnimationFrame(step);
			else if (target === 0) audio.pause();
		};
		requestAnimationFrame(step);
	}

	$effect(() => {
		if (!armed || !audio) return;
		fadeTo(targetVolume);
	});

	onMount(() => {
		const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart'];
		const handler = () => {
			if (armed) return;
			armed = true;
			events.forEach((e) => window.removeEventListener(e, handler));
		};
		events.forEach((e) => window.addEventListener(e, handler, { passive: true }));

		const updatePageActive = () => {
			pageActive = document.visibilityState === 'visible';
			if (!pageActive) pauseImmediately();
		};
		const pauseImmediately = () => {
			if (!audio) return;
			fadeRun++;
			audio.pause();
			audio.volume = 0;
		};

		updatePageActive();
		document.addEventListener('visibilitychange', updatePageActive);
		window.addEventListener('pageshow', updatePageActive);
		window.addEventListener('pagehide', pauseImmediately);

		return () => {
			events.forEach((e) => window.removeEventListener(e, handler));
			document.removeEventListener('visibilitychange', updatePageActive);
			window.removeEventListener('pageshow', updatePageActive);
			window.removeEventListener('pagehide', pauseImmediately);
		};
	});

	context.eventEmitter.subscribeOnMount({
		soundMusic: ({ name }) => {
			switchTrack(trackForName(name));
		},
	});
</script>

<audio
	bind:this={audio}
	src={currentTrack}
	loop
	preload="auto"
	style="display:none"
></audio>
