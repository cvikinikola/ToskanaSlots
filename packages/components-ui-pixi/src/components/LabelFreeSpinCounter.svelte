<script lang="ts">
	import { stateUi } from 'state-shared';

	import UiLabel from './UiLabel.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';

	type Props = {
		stacked?: boolean;
	};

	const props: Props = $props();
	const GOLD = 0xffd147;
	const label = $derived(i18nDerived.freeSpins());
	const value = $derived(`${stateUi.freeSpinCounterCurrent} / ${stateUi.freeSpinCounterTotal}`);
</script>

<UiLabel tiled {label} {value} stacked={props.stacked} labelFill={GOLD} valueFill={GOLD} />
