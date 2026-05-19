<script lang="ts">
	import { onMount } from 'svelte';
	import type { LoadedAudio } from 'pixi-svelte';
	import { getContext } from '../game/context';
	import { sound, type SoundName } from '../game/sound';

	const context = getContext();

	onMount(() => {
		const loadedAudio = $state.snapshot(
			context.stateApp.loadedAssets['sound'],
		) as LoadedAudio<SoundName> | undefined;
		if (!loadedAudio) return;
		const { destroy } = sound.load(loadedAudio);
		return () => {
			destroy();
		};
	});

	sound.enableEffect();
	sound.volumeEffect();
</script>
