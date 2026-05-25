<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_SIZE } from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const isSpinKey = (key: string) => ['spin_default', 'spin_disabled'].includes(key);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered, pressed })}
				<Container
					{...center}
					scale={pressed ? 0.94 : hovered ? 1.04 : 1}
				>
					<UiAssetSprite
						assetKey={isSpinKey(key) ? 'menu_spin' : 'menu_stop'}
						anchor={0.5}
						width={sizes.width * (isSpinKey(key) ? 0.96 : 1.04)}
						height={sizes.height * (isSpinKey(key) ? 0.96 : 0.52)}
						alpha={disabled || ['spin_disabled', 'stop_disabled'].includes(key) ? 0.5 : 1}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
