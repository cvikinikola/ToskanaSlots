<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import {
		menuSpinHitSize,
		menuStopHitSize,
		menuStopRenderWidth,
		portraitUiRuntime,
	} from '../constants';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const isSpinKey = (key: string) => ['spin_default', 'spin_disabled'].includes(key);
	const uiScale = $derived(portraitUiRuntime.scale);
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		{@const isSpin = isSpinKey(key)}
		{@const sizes = isSpin ? menuSpinHitSize(8, uiScale) : menuStopHitSize(6, uiScale)}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered, pressed })}
				<Container {...center} scale={pressed ? 0.94 : hovered ? 1.04 : 1}>
					<UiAssetSprite
						assetKey={isSpin ? 'menu_spin' : 'menu_stop'}
						anchor={0.5}
						width={isSpin
							? portraitUiRuntime.menuSpinHeight
							: menuStopRenderWidth(portraitUiRuntime.menuIconHeight)}
						height={isSpin
							? portraitUiRuntime.menuSpinHeight
							: portraitUiRuntime.menuIconHeight}
						alpha={disabled || ['spin_disabled', 'stop_disabled'].includes(key) ? 0.5 : 1}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
