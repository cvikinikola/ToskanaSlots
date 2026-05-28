<script lang="ts">
	import { onMount } from 'svelte';
	import { stateSoundDerived } from 'state-shared';

	/**
	 * Background music player — single looping track.
	 *
	 * Uses apps/olympus/static/assets/audio/Nova_pozadinska_Muzika.wav.
	 * Browsers block autoplay until the first user gesture, so we
	 * arm a one-shot pointer/key/touch listener and start playback then.
	 * Volume tracks the global music slider from `state-shared`
	 * (0 = paused).
	 */

	const TRACK = '/assets/audio/Nova_pozadinska_Muzika.wav';
	const FADE_MS = 400;

	let audio: HTMLAudioElement | undefined = $state();
	let armed = $state(false);
	let pageActive = $state(true);
	let fadeRun = 0;

	const musicVolume = $derived(stateSoundDerived.volumeMusic());
	const targetVolume = $derived(pageActive ? Math.max(0, Math.min(1, musicVolume)) : 0);

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
</script>

<audio
	bind:this={audio}
	src={TRACK}
	loop
	preload="auto"
	style="display:none"
></audio>
