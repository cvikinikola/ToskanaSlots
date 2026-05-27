<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateSound } from 'state-shared';

	import UiButton from './UiButton.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const context = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };

	const onpress = () => {
		if (stateSound.volumeValueMaster === 0) {
			stateSound.volumeValueMaster = 50;
			context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		} else {
			stateSound.volumeValueMaster = 0;
		}
	};

	const icon = $derived(
		stateSound.volumeValueMaster === 0 ? ('soundOff' as const) : ('soundOn' as const),
	);
</script>

<UiButton {...props} {sizes} {onpress} {icon} variant="light" />
