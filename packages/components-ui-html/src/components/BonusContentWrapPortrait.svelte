<script lang="ts">
	import type { Snippet } from 'svelte';

	import BaseContent from './BaseContent.svelte';
	import BaseScrollable from './BaseScrollable.svelte';

	type Props = {
		maxListLength: number;
		betAmount: Snippet;
		bonusCardsActivate: Snippet;
		bonusCardsBuy: Snippet;
	};

	const props: Props = $props();
</script>

<BaseContent maxWidth="100%">
	<div class="wrap">
		<div class="bonuses">
			<BaseScrollable type="row">
				{@render props.bonusCardsActivate()}
			</BaseScrollable>

			<BaseScrollable type="row">
				{@render props.bonusCardsBuy()}
			</BaseScrollable>
		</div>

		<div class="badge-amount-wrap">
			{@render props.betAmount()}
		</div>
	</div>
</BaseContent>

<style lang="scss">
	.wrap {
		width: 100%;
		max-height: calc(100dvh - 4rem);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		min-height: 0;
	}

	.bonuses {
		width: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.badge-amount-wrap {
		flex: 0 0 auto;
	}
</style>
