<script lang="ts">
	import { onMount } from 'svelte';
	import { stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';
	import type { MusicName } from '../game/sound';

	const TRACKS = {
		bgm_main: '/assets/audio/Nova_pozadinska_Muzika.wav',
	} as const;

	const FREE_SPIN_INTRO_TRACK = '/assets/audio/free_spin_intro.mp3';

	type GameMusicName = keyof typeof TRACKS;

	const FADE_MS = 400;

	const context = getContext();

	let audio: HTMLAudioElement | undefined = $state();
	let armed = $state(false);
	let pageActive = $state(true);
	let fadeRun = 0;
	let activeTrack = $state<GameMusicName>('bgm_main');
	let introAudio: HTMLAudioElement | undefined;

	const musicVolume = $derived(stateSoundDerived.volumeMusic());
	const targetVolume = $derived(pageActive ? Math.max(0, Math.min(1, musicVolume)) : 0);

	const isGameMusic = (name: MusicName): name is GameMusicName => name === 'bgm_main';

	const stopIntroMusic = () => {
		if (!introAudio) return;
		introAudio.pause();
		introAudio.currentTime = 0;
		introAudio = undefined;
	};

	/** One-shot intro sting; main loop stays ducked until `bgm_main` restore. */
	const playFreeSpinIntroMusic = () => {
		stopIntroMusic();
		fadeTo(0);
		if (!pageActive || targetVolume <= 0) return;

		introAudio = new Audio(FREE_SPIN_INTRO_TRACK);
		introAudio.volume = targetVolume;
		introAudio.play().catch(() => {
			stopIntroMusic();
		});
	};

	const restoreMainMusic = () => {
		stopIntroMusic();
		if (activeTrack !== 'bgm_main') switchTrack('bgm_main');
		else fadeTo(targetVolume);
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

	const switchTrack = (name: GameMusicName) => {
		if (!audio) return;
		if (name === activeTrack) {
			if (armed && targetVolume > 0 && audio.paused) audio.play().catch(() => {});
			return;
		}

		activeTrack = name;
		fadeRun++;
		audio.pause();
		audio.src = TRACKS[name];
		audio.load();
		audio.volume = 0;
		if (armed && targetVolume > 0) {
			audio.play().then(() => fadeTo(targetVolume)).catch(() => {});
		}
	};

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
			if (audio && targetVolume > 0) audio.play().catch(() => {});
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
			stopIntroMusic();
			events.forEach((e) => window.removeEventListener(e, handler));
			document.removeEventListener('visibilitychange', updatePageActive);
			window.removeEventListener('pageshow', updatePageActive);
			window.removeEventListener('pagehide', pauseImmediately);
		};
	});

	context.eventEmitter.subscribeOnMount({
		soundMusic: ({ name }) => {
			if (name === 'bgm_freespin') {
				playFreeSpinIntroMusic();
				return;
			}
			if (isGameMusic(name)) restoreMainMusic();
			else if (armed && targetVolume > 0 && audio?.paused) audio.play().catch(() => {});
		},
	});
</script>

<audio
	bind:this={audio}
	src={TRACKS.bgm_main}
	loop
	preload="auto"
	style="display:none"
></audio>
