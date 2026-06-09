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
	import { FREE_SPIN_OUTRO_MUSIC_SRC } from '../game/freeSpinOutroAudio';
	import { SCATTER_LAND_SOUND_SRC } from '../game/constants';

	const context = getContext();
	const activeAudios = new Set<HTMLAudioElement>();
	// Looping audios tracked by sound name so they can be stopped on demand
	// (e.g. the "Jackpot Ascension" money count-up music or the big-win coin
	// loop). A name maps to the single currently-playing looping instance.
	const loopingAudios = new Map<string, HTMLAudioElement>();
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
		loopingAudios.forEach((audio) => {
			audio.pause();
			audio.currentTime = 0;
		});
		loopingAudios.clear();
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

	// Start (or restart) a named looping audio. Any previous instance under
	// the same name is stopped first so loops never stack.
	const playLoopAudio = (name: string, src: string, volume = 1) => {
		stopLoopAudio(name);
		if (!pageActive) return;
		if (soundEffectVolume <= 0) return;

		const audio = new Audio(src);
		audio.loop = true;
		audio.volume = Math.max(0, Math.min(1, volume * soundEffectVolume));
		loopingAudios.set(name, audio);
		audio.play().catch(() => loopingAudios.delete(name));
	};

	const stopLoopAudio = (name: string) => {
		const audio = loopingAudios.get(name);
		if (!audio) return;
		audio.pause();
		audio.currentTime = 0;
		loopingAudios.delete(name);
	};

	// One-shot audio tracked by name so it can be stopped early (e.g. outro skip).
	const playNamedOnce = (name: string, src: string, volume = 1) => {
		stopLoopAudio(name);
		if (!pageActive) return;
		if (soundEffectVolume <= 0) return;

		const audio = new Audio(src);
		audio.volume = Math.max(0, Math.min(1, volume * soundEffectVolume));
		loopingAudios.set(name, audio);
		const cleanup = () => loopingAudios.delete(name);
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
		soundOnce: ({ name, forcePlay = false }) => {
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
			// Deka toast/salute when the spin has a win.
			if (name === 'sfx_deka_salute') {
				playAudio('/assets/audio/Bravo! Jingling.mp3', 1);
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
				if (!forcePlay && now - lastThunderAt < 4500) return;
				lastThunderAt = now;
				playAudio('/assets/audio/thunder_clap.mp3', 0.5);
				return;
			}
			// Rooster crow — free-spin intro panel (FreeSpinIntro.svelte)
			if (name === 'sfx_rooster_crow') {
				playAudio('/assets/audio/kukuriku.mp3', 0.95);
				return;
			}
			// Legacy free-spin jingle (unused by intro; kept for compatibility)
			if (name === 'jng_intro_fs') {
				playAudio('/assets/audio/Massive_Thor_hammer__2-1779125404081.mp3', 0.9);
				return;
			}
			// Free spin end — "You Won" panel fanfare
			if (name === 'sfx_youwon_panel') {
				playAudio('/assets/audio/Massive_Thor_hammer__2-1779125404081.mp3', 0.9);
				return;
			}
			// Free-spin outro money count-up — plays once (Vinyl Jackpot).
			if (name === 'sfx_jackpot_ascension') {
				playNamedOnce(name, FREE_SPIN_OUTRO_MUSIC_SRC, 0.85);
				return;
			}
			// QA 04.06.2026: ranije su sledeci eventi bili stub-ovani (samo log u
			// konzolu) pa se cula samo destrukcija. Sada su uvezani na realne
			// audio fajlove iz /assets/audio.

			// Mali "chime" na svaki winInfo (kluster pobeda) — kratak metalni
			// udar prati paljenje TumbleWinAmount panela.
			if (name === 'sfx_winlevel_small') {
				playAudio('/assets/audio/Metal_slot_symbols_c_2-1779126634873.mp3', 0.55);
				return;
			}
			// Svako M (multiplier) na board-u — kratak agresivan metalni udar.
			if (name === 'sfx_multiplier_update' || name === 'sfx_multiplier_landing') {
				playAudio('/assets/audio/Short_aggressive_met_2-1779125681996.mp3', 0.7);
				return;
			}
			// Final board multiplier × win — heavy accent sting.
			if (name === 'sfx_multiplier_win') {
				playAudio('/assets/audio/Thor_lightning_strik_3-1779126268747.mp3', 0.75);
				return;
			}
			// Eksplozija simbola tokom kaskade — paralelni metalni "crunch" uz
			// destroy.mp3 (soundSymbolDestroy) za bogatiji udar.
			if (name === 'sfx_tumble_explode') {
				playAudio('/assets/audio/Metal_slot_symbols_c_1-1779126624972.mp3', 0.5);
				return;
			}
			// Padanje simbola koji popunjavaju prazna polja — laksi metalni
			// clatter, jedva primetan ali daje teksturu kaskadi.
			if (name === 'sfx_tumble_fall') {
				playAudio('/assets/audio/Small_Viking_slot_ma_3-1779126316047.mp3', 0.4);
				return;
			}
			// Scatter (Vinar) lands on the grid — harmonica sting on each land.
			if (
				name === 'sfx_scatter_land' ||
				name === 'sfx_scatter_1' ||
				name === 'sfx_scatter_2' ||
				name === 'sfx_scatter_3' ||
				name === 'sfx_scatter_4' ||
				name === 'sfx_scatter_5'
			) {
				playAudio(SCATTER_LAND_SOUND_SRC, 0.9);
				return;
			}
			// FS trigger — one-by-one scatter highlight ("puf" pop per symbol).
			if (name === 'sfx_scatter_mark') {
				playAudio('/assets/audio/destroy.mp3', 0.85);
				return;
			}
			// Scatter retrigger celebration.
			if (name === 'sfx_scatter_win_v2') {
				playAudio('/assets/audio/Thor_lightning_strik_3-1779126268747.mp3', 0.7);
				return;
			}
			// Free spin trigger "super" stinger.
			if (name === 'sfx_superfreespin') {
				playAudio('/assets/audio/Massive_Thor_hammer__2-1779125404081.mp3', 1.0);
				return;
			}
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

		// Looping SFX (e.g. coin shower during big win).
		soundLoop: ({ name }) => {
			// Big-win coin shower loop — slow-rolling coin clinks dok traje
			// win-level prezentacija.
			if (name === 'sfx_bigwin_coinloop') {
				playLoopAudio(name, '/assets/audio/clinking-coins.mp3', 0.7);
				return;
			}
			console.debug('[sound] loop →', name);
		},

		// Stop a specific sound
		soundStop: ({ name }) => {
			stopLoopAudio(name);
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
