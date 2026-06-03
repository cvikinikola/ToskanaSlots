<script lang="ts">
	import type { ButtonProps } from 'components-pixi';
	import { stateBet, stateBetDerived } from 'state-shared';

	import OlympusLandscapeIconButton from './OlympusLandscapeIconButton.svelte';
	import { getContext } from '../game/context';

	type Props = Partial<Omit<ButtonProps, 'children'>> & {
		iconSide: number;
	};

	const props: Props = $props();
	const context = getContext();

	const active = $derived(stateBet.isTurbo);
	const disabled = $derived(stateBet.isSpaceHold);

	const onpress = () => {
		context.eventEmitter.broadcast({ type: 'soundPressGeneral' });
		stateBetDerived.updateIsTurbo(!stateBet.isTurbo, { persistent: true });
	};

	context.eventEmitter.subscribeOnMount({
		stopButtonClick: () => stateBetDerived.updateIsTurbo(true, { persistent: false }),
		stopButtonEnable: () => stateBetDerived.updateIsTurbo(false, { persistent: false }),
	});
</script>

<OlympusLandscapeIconButton
	{...props}
	assetKey="menu_turbo"
	activeAssetKey="menu_turbo_active"
	{active}
	{disabled}
	{onpress}
/>
