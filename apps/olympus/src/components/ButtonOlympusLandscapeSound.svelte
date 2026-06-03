<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateSound } from 'state-shared';

	import OlympusLandscapeIconButton from './OlympusLandscapeIconButton.svelte';
	import { getContext } from '../game/context';

	const props: Partial<Omit<ButtonProps, 'children'>> & { iconSide?: number } = $props();
	const context = getContext();

	const onpress = () => {
		if (stateSound.volumeValueMaster === 0) {
			stateSound.volumeValueMaster = 50;
			context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		} else {
			stateSound.volumeValueMaster = 0;
		}
	};

	const assetKey = $derived(
		stateSound.volumeValueMaster === 0 ? 'menu_mute' : 'menu_sound',
	);
</script>

<OlympusLandscapeIconButton
	{...props}
	{assetKey}
	fallbackAssetKey="menu_sound"
	{onpress}
/>
