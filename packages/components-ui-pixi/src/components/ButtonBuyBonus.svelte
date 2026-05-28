<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import { UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	const openConfirm = () => (stateModal.modal = { name: 'buyBonusConfirm' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openConfirm();
		}
	};
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		<Container
			{...center}
			scale={(pressed ? 0.96 : hovered ? 1.08 : 1.04) * (active ? 1.06 : 1)}
			alpha={disabled ? 0.5 : 1}
		>
			<Graphics
				draw={(g) => {
					g.clear();
					g.ellipse(0, 0, sizes.width * 0.55, sizes.height * 0.36);
					g.fill({ color: 0xffc84a, alpha: active ? 0.32 : hovered ? 0.24 : 0.16 });
				}}
			/>

			<UiAssetSprite
				assetKey="menu_buy_bonus"
				anchor={0.5}
				width={sizes.width * 1.32}
				height={sizes.height * 0.96}
			/>
		</Container>
	{/snippet}
</Button>
