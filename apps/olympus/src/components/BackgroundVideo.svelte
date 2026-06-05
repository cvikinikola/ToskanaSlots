<script lang="ts">
	import { onMount } from 'svelte';

	import { BG_FILL_COLOR, BG_VIDEO_BASE_SRC, BG_VIDEO_FREESPIN_SRC } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';

	const fillHex = `#${BG_FILL_COLOR.toString(16).padStart(6, '0')}`;

	const videoSrc = $derived(
		stateGame.gameType === 'freeSpins' ? BG_VIDEO_FREESPIN_SRC : BG_VIDEO_BASE_SRC,
	);

	let videoEl = $state<HTMLVideoElement | undefined>();

	const tryPlay = () => {
		videoEl?.play().catch(() => {});
	};

	$effect(() => {
		videoSrc;
		if (videoEl) {
			videoEl.load();
			tryPlay();
		}
	});

	onMount(() => {
		tryPlay();

		const onVisible = () => {
			if (!document.hidden) tryPlay();
		};
		document.addEventListener('visibilitychange', onVisible);

		return () => document.removeEventListener('visibilitychange', onVisible);
	});
</script>

<!-- Looping video behind the transparent Pixi canvas. -->
<div class="bg-video" style:background-color={fillHex} aria-hidden="true">
	<video
		bind:this={videoEl}
		class="bg-video__el"
		src={videoSrc}
		muted
		loop
		playsinline
		autoplay
		preload="auto"
	></video>
</div>

<style lang="scss">
	.bg-video {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}

	.bg-video__el {
		position: absolute;
		left: 50%;
		top: 50%;
		min-width: 100%;
		min-height: 100%;
		width: auto;
		height: auto;
		transform: translate(-50%, -50%);
		object-fit: cover;
	}
</style>
