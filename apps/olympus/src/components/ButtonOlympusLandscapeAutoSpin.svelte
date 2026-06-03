<script lang="ts">
	import { Container } from 'pixi-svelte';
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived, stateModal } from 'state-shared';

	import ButtonBetAutoSpinsCounter from 'components-ui-pixi/src/components/ButtonBetAutoSpinsCounter.svelte';
	import OlympusLandscapeIconButton from './OlympusLandscapeIconButton.svelte';
	import { getContext } from '../game/context';

	type Props = Partial<Omit<ButtonProps, 'children'>> & {
		iconSide: number;
	};

	const props: Props = $props();
	const context = getContext();

	const active = $derived(stateBetDerived.hasAutoBetCounter());
	const disabled = $derived.by(() => {
		if (stateBet.isSpaceHold) return true;
		if (!context.stateXstateDerived.isIdle() && !stateBetDerived.hasAutoBetCounter()) return true;
		if (!stateBetDerived.isBetCostAvailable()) return true;
		return false;
	});

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
		else stateModal.modal = { name: 'autoSpin' };
	};
</script>

<OlympusLandscapeIconButton
	{...props}
	assetKey="menu_auto_spin"
	iconSide={props.iconSide}
	{active}
	{disabled}
	{onpress}
>
	{#snippet children()}
		<Container x={0} y={0}>
			<ButtonBetAutoSpinsCounter />
		</Container>
	{/snippet}
</OlympusLandscapeIconButton>
