<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BAR_ACTION_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BAR_ACTION_SIZE, height: UI_BAR_ACTION_SIZE };
	const isSpinKey = (key: string) => ['spin_default', 'spin_disabled'].includes(key);
	const isDisabledKey = (key: string) => key === 'spin_disabled';
	const betAssetKey = (key: string) => (isSpinKey(key) ? 'menu_spin' : 'menu_spin_stop');
	const betButtonScale = 1.08;
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress, pressDisabled })}
		<OnHotkey hotkey="Space" disabled={disabled || pressDisabled} {onpress} />
		<Button {...props} {sizes} {onpress} disabled={disabled || isDisabledKey(key) || pressDisabled}>
			{#snippet children({ center, hovered, pressed })}
				<Container
					{...center}
					scale={pressed ? 0.94 : hovered ? 1.04 : 1}
				>
					<UiAssetSprite
						assetKey={betAssetKey(key)}
						fallbackAssetKey="menu_spin"
						anchor={0.5}
						width={sizes.width * betButtonScale}
						height={sizes.height * betButtonScale}
						alpha={disabled || key === 'spin_disabled' ? 0.5 : 1}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
