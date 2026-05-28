<script lang="ts">
	import { Button, Popup } from 'components-shared';
	import { zIndex } from 'constants-shared/zIndex';
	import { stateBet, stateMetaDerived, stateModal, stateUi, INFINITY_MARK } from 'state-shared';
	import { getContextEventEmitter } from 'utils-event-emitter';
	import { numberToCurrencyString } from 'utils-shared/amount';

	import BaseIcon from './BaseIcon.svelte';
	import BaseTitle from './BaseTitle.svelte';
	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';
	import BaseButtonWrap from './BaseButtonWrap.svelte';
	import BaseButtonContent from './BaseButtonContent.svelte';
	import { stateBonusDerived } from '../stateBonus.svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import type { EmitterEventModal } from '../types';

	const { eventEmitter } = getContextEventEmitter<EmitterEventModal>();
	const selectedBetModeData = $derived.by(() => {
		const selected = stateBonusDerived.selectedBetModeData();
		const buyMode = stateMetaDerived.betModeMetaList().find((item) => item.type === 'buy');

		if (selected?.type === 'activate') return selected;

		return buyMode ?? selected;
	});
	const selectedBetModeCost = $derived(stateBet.betAmount * selectedBetModeData.costMultiplier);
	const isConfirmDisabled = $derived(
		stateBet.betAmount <= 0 || stateBet.balanceAmount < selectedBetModeCost,
	);

	const confirm = () => {
		stateBet.activeBetModeKey = selectedBetModeData.mode;

		if (selectedBetModeData.type === 'buy') {
			eventEmitter.broadcast({ type: 'bet' });
		}

		if (selectedBetModeData.type === 'activate') {
			stateUi.autoSpinsLossLimitText = INFINITY_MARK;
			stateUi.autoSpinsSingleWinLimitText = INFINITY_MARK;
		}
	};
</script>

{#if stateModal.modal?.name === 'buyBonusConfirm'}
	<Popup zIndex={zIndex.dialog} onclose={() => (stateModal.modal = null)}>
		<BaseContent maxWidth="500px">
			<BaseTitle>
				{selectedBetModeData.text.title}
			</BaseTitle>
			<BaseScrollable type="column">
				{selectedBetModeData.text.dialog}
				{#if selectedBetModeData.type === 'buy'}
					<div class="price">
						{numberToCurrencyString(selectedBetModeCost)}
					</div>
				{/if}
			</BaseScrollable>
			<BaseButtonWrap type="max-width">
				<Button
					data-test="confirm-button"
					disabled={isConfirmDisabled}
					onclick={() => {
						confirm();
						eventEmitter.broadcast({ type: 'soundPressGeneral' });
						stateModal.modal = null;
					}}
				>
					<BaseIcon width="100%" height="3rem" />
					<BaseButtonContent>
						<span style="font-size: 1rem;">{i18nDerived.confirm()}</span>
					</BaseButtonContent>
				</Button>
			</BaseButtonWrap>
		</BaseContent>
	</Popup>
{/if}

<style lang="scss">
	.price {
		margin-top: 1rem;
		font-size: 1.25rem;
		font-weight: 700;
		text-align: center;
		white-space: nowrap;
	}
</style>
