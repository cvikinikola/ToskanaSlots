<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateConfig } from 'state-shared';

	import OlympusLandscapeIconButton from './OlympusLandscapeIconButton.svelte';
	import { getContext } from '../game/context';

	const props: Partial<Omit<ButtonProps, 'children'>> & { iconSide?: number } = $props();
	const context = getContext();

	const smallest = $derived(stateConfig.betAmountOptions[0]);
	const disabled = $derived(!context.stateXstateDerived.isIdle() || stateBet.betAmount === smallest);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });

		const nextSmaller = [...stateConfig.betAmountOptions]
			.sort((a, b) => b - a)
			.find((option) => option < stateBet.betAmount);

		stateBetDerived.setBetAmount(nextSmaller || smallest);
	};
</script>

<OlympusLandscapeIconButton
	{...props}
	assetKey="menu_minus"
	{disabled}
	{onpress}
/>
