<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateUi } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BAR_ICON_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BAR_ICON_SIZE, height: UI_BAR_ICON_SIZE };

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateUi.menuOpen = true;
	};
</script>

<UiButton {...props} {sizes} {onpress} icon="menu" />
