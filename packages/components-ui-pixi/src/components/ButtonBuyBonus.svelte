<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import {
		MENU_ICON_ASPECT,
		menuIconHitSize,
		portraitUiRuntime,
	} from '../constants';
	import { getContext } from '../context';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = $derived(menuIconHitSize(MENU_ICON_ASPECT.buyBonus, 6, portraitUiRuntime.scale));
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
			scale={(pressed ? 0.96 : hovered ? 1.03 : 1) * (active ? 1.03 : 1)}
			alpha={disabled ? 0.5 : 1}
		>
			<Graphics
				draw={(g) => {
					g.clear();
					g.ellipse(0, 0, sizes.width * 0.38, sizes.height * 0.28);
					g.fill({ color: 0xffc84a, alpha: active ? 0.28 : hovered ? 0.2 : 0.12 });
				}}
			/>

			<UiAssetSprite
				assetKey="menu_buy_bonus"
				anchor={0.5}
				width={portraitUiRuntime.menuIconHeight * MENU_ICON_ASPECT.buyBonus}
				height={portraitUiRuntime.menuIconHeight}
			/>
		</Container>
	{/snippet}
</Button>
