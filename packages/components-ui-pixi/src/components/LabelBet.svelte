<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Rectangle } from 'pixi.js';
	import { stateBetDerived, stateModal } from 'state-shared';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import UiLabel from './UiLabel.svelte';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_SIZE } from '../constants';

	type Props = {
		stacked?: boolean;
	};

	const props: Props = $props();
	const context = getContext();
	const label = $derived(stateBetDerived.activeBetMode()?.text.betAmountLabel || i18nDerived.bet());
	const value = $derived(numberToCurrencyString(stateBetDerived.betCost()));
	const disabled = $derived(!context.stateXstateDerived.isIdle());
	const hitArea = $derived(
		props.stacked
			? new Rectangle(-UI_BASE_SIZE * 1.45, -UI_BASE_SIZE * 0.2, UI_BASE_SIZE * 2.9, UI_BASE_SIZE * 1.25)
			: new Rectangle(-UI_BASE_SIZE * 0.7, -UI_BASE_SIZE * 0.55, UI_BASE_SIZE * 4.7, UI_BASE_SIZE * 1.1),
	);

	const onpress = () => {
		if (disabled) return;
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateModal.modal = { name: 'betAmountMenu' };
	};
</script>

<Container eventMode="static" cursor={disabled ? 'not-allowed' : 'pointer'} {hitArea} onpointerup={onpress}>
	<UiLabel tiled {label} {value} stacked={props.stacked} />
</Container>
