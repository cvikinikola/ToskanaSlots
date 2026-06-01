<script lang="ts" module>
	export type NatureAmbienceSound =
		| 'sfx_bird_chirp'
		| 'sfx_cricket'
		| 'sfx_nature_burst';
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { stateSoundDerived } from 'state-shared';

	import { getContext } from '../game/context';

	const context = getContext();

	const soundEffectVolume = $derived(
		Math.max(0, Math.min(1, stateSoundDerived.volumeSoundEffect())),
	);

	let ctx: AudioContext | undefined;
	let master: GainNode | undefined;
	let idleTimer: ReturnType<typeof setTimeout> | undefined;
	let pageActive = $state(true);
	let armed = $state(false);
	let lastChirpAt = 0;

	const updatePageActive = () => {
		pageActive = document.visibilityState === 'visible';
		if (!pageActive) stopIdle();
		else scheduleIdle();
	};

	const ensureCtx = () => {
		if (!ctx) {
			ctx = new AudioContext();
			master = ctx.createGain();
			master.connect(ctx.destination);
		}
		if (ctx.state === 'suspended') ctx.resume();
		return ctx;
	};

	const vol = () => Math.max(0, Math.min(1, soundEffectVolume));

	const playBirdChirp = (loud = false) => {
		if (!armed) return;
		const audio = ensureCtx();
		if (!master || vol() <= 0) return;
		const t = audio.currentTime;
		const g = audio.createGain();
		g.connect(master);
		g.gain.setValueAtTime(0, t);
		g.gain.linearRampToValueAtTime(vol() * (loud ? 0.22 : 0.12), t + 0.015);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14 + Math.random() * 0.08);

		const osc = audio.createOscillator();
		osc.type = 'sine';
		const f0 = 1600 + Math.random() * 900;
		osc.frequency.setValueAtTime(f0, t);
		osc.frequency.exponentialRampToValueAtTime(f0 * 1.35, t + 0.04);
		osc.frequency.exponentialRampToValueAtTime(f0 * 0.75, t + 0.11);
		osc.connect(g);
		osc.start(t);
		osc.stop(t + 0.2);

		if (Math.random() < 0.45) {
			const osc2 = audio.createOscillator();
			osc2.type = 'triangle';
			const f1 = f0 * 1.2 + 200;
			osc2.frequency.setValueAtTime(f1, t + 0.06);
			osc2.frequency.exponentialRampToValueAtTime(f1 * 0.8, t + 0.16);
			const g2 = audio.createGain();
			g2.gain.setValueAtTime(0, t + 0.06);
			g2.gain.linearRampToValueAtTime(vol() * 0.08, t + 0.08);
			g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
			g2.connect(master);
			osc2.connect(g2);
			osc2.start(t + 0.06);
			osc2.stop(t + 0.22);
		}
	};

	const playCricket = () => {
		if (!armed) return;
		const audio = ensureCtx();
		if (!master || vol() <= 0) return;
		const t = audio.currentTime;
		const bursts = 3 + Math.floor(Math.random() * 4);
		for (let i = 0; i < bursts; i++) {
			const bt = t + i * (0.028 + Math.random() * 0.018);
			const osc = audio.createOscillator();
			osc.type = 'square';
			osc.frequency.setValueAtTime(4200 + Math.random() * 800, bt);
			const g = audio.createGain();
			g.gain.setValueAtTime(0, bt);
			g.gain.linearRampToValueAtTime(vol() * 0.04, bt + 0.004);
			g.gain.exponentialRampToValueAtTime(0.0001, bt + 0.02);
			g.connect(master);
			osc.connect(g);
			osc.start(bt);
			osc.stop(bt + 0.025);
		}
	};

	const playNatureBurst = () => {
		playBirdChirp(true);
		setTimeout(() => playBirdChirp(true), 120);
		setTimeout(() => playCricket(), 280);
	};

	const scheduleIdle = () => {
		stopIdle();
		if (!armed || !pageActive || vol() <= 0) return;
		const delay = 3500 + Math.random() * 7000;
		idleTimer = setTimeout(() => {
			const now = performance.now();
			if (now - lastChirpAt < 800) {
				scheduleIdle();
				return;
			}
			lastChirpAt = now;
			if (Math.random() < 0.62) playBirdChirp();
			else playCricket();
			scheduleIdle();
		}, delay);
	};

	const stopIdle = () => {
		if (idleTimer) clearTimeout(idleTimer);
		idleTimer = undefined;
	};

	$effect(() => {
		if (!armed || !master) return;
		const v = vol();
		master.gain.setValueAtTime(v, ensureCtx().currentTime);
		if (v > 0 && pageActive) scheduleIdle();
		else stopIdle();
	});

	context.eventEmitter.subscribeOnMount({
		soundOnce: ({ name }) => {
			if (name === 'sfx_bird_chirp') {
				playBirdChirp(true);
				return;
			}
			if (name === 'sfx_cricket') {
				playCricket();
				return;
			}
			if (name === 'sfx_nature_burst') {
				playNatureBurst();
			}
		},
	});

	const arm = () => {
		if (armed) return;
		armed = true;
		ensureCtx();
		scheduleIdle();
	};

	onMount(() => {
		updatePageActive();
		document.addEventListener('visibilitychange', updatePageActive);
		const onGesture = () => {
			arm();
			window.removeEventListener('pointerdown', onGesture);
			window.removeEventListener('keydown', onGesture);
		};
		window.addEventListener('pointerdown', onGesture, { once: true });
		window.addEventListener('keydown', onGesture, { once: true });

		return () => {
			stopIdle();
			document.removeEventListener('visibilitychange', updatePageActive);
			window.removeEventListener('pointerdown', onGesture);
			window.removeEventListener('keydown', onGesture);
			ctx?.close();
		};
	});
</script>
