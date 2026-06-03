<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';

	import OlympusLandscapeIconButton from './OlympusLandscapeIconButton.svelte';
	import { getContext } from '../game/context';

	const props: Partial<Omit<ButtonProps, 'children'>> & { iconSide?: number } = $props();
	const context = getContext();

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = true;
	};
</script>

<OlympusLandscapeIconButton
	{...props}
	assetKey="menu_settings"
	onpress={onpress}
/>
