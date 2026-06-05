<script lang="ts" module>
	export type ButtonBetKey = 'spin_default' | 'spin_disabled' | 'stop_default' | 'stop_disabled';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	import { stateBet, stateBetDerived } from 'state-shared';

	import { getContext } from '../context';

	type Props = {
		children: Snippet<
			[
				{
					key: ButtonBetKey;
					onpress: () => void;
					pressDisabled: boolean;
				},
			]
		>;
	};

	const props: Props = $props();
	const context = getContext();

	let stopClickDisabled = $state(false);
	let stopForceInactive = $state(false);
	let roundPlaybackComplete = $state(false);
	let wasBetting = false;

	$effect(() => {
		const betting = context.stateXstateDerived.isBetting();
		if (betting && !wasBetting) roundPlaybackComplete = false;
		wasBetting = betting;
	});

	const bet = () => {
		if (stateBetDerived.activeBetMode()?.type === 'buy') stateBet.activeBetModeKey = 'BASE';
		context.eventEmitter.broadcast({ type: 'bet' });
	};

	const stop = () => {
		if (!stopClickDisabled && !stopForceInactive) {
			if (stateBetDerived.hasAutoBetCounter()) stateBet.autoSpinsCounter = 0;
			context.eventEmitter.broadcast({ type: 'stopButtonClick' });
		}
	};

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressBet' });

		if (context.stateXstateDerived.isIdle()) {
			bet();
		} else if (!roundPlaybackComplete) {
			stop();
		}
	};

	const getKey = () => {
		if (context.stateXstateDerived.isIdle() || roundPlaybackComplete) {
			if (!stateBetDerived.isBetCostAvailable()) return 'spin_disabled';
			return 'spin_default';
		}

		return 'stop_default';
	};

	const key = $derived.by(getKey);
	const pressDisabled = $derived.by(() => {
		if (context.stateXstateDerived.isIdle()) return false;
		if (roundPlaybackComplete) return true;
		return stopClickDisabled || stopForceInactive;
	});

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => (stopClickDisabled = true),
		stopButtonEnable: () => {
			roundPlaybackComplete = true;
			stopClickDisabled = false;
			stopForceInactive = false;
		},
		stopButtonDisable: () => (stopForceInactive = true),
	});
</script>

{@render props.children({ key, onpress, pressDisabled })}
