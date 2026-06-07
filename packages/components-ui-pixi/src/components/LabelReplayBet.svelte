<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { stateBet, stateBetDerived } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
	};

	const props: Props = $props();

	const modeLabel = $derived(stateBetDerived.activeBetMode()?.mode || stateBet.activeBetModeKey);
	const costMultiplier = $derived(stateBetDerived.activeBetMode()?.costMultiplier ?? 1);
	const baseLabel = $derived(i18nDerived.bet());
	const baseValue = $derived(numberToCurrencyString(stateBet.betAmount));
	const realCostValue = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	const value = $derived(
		costMultiplier > 1
			? `${modeLabel} ${baseValue} · REAL ${realCostValue}`
			: realCostValue,
	);
</script>

<Container>
	<UiLabel tiled label={baseLabel} {value} stacked={props.stacked} />
</Container>
