<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { OnHotkey } from 'components-shared';
	import { stateBetDerived } from 'state-shared';

	import UiButtonPlate from './UiButtonPlate.svelte';
	import ButtonBetProvider from './ButtonBetProvider.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';
	import { i18nDerived } from '../i18n/i18nDerived';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const disabled = $derived(!stateBetDerived.isBetCostAvailable());
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
</script>

<ButtonBetProvider>
	{#snippet children({ key, onpress })}
		<OnHotkey hotkey="Space" {disabled} {onpress} />
		<Button {...props} {sizes} {onpress} {disabled}>
			{#snippet children({ center, hovered, pressed })}
				<Container {...center}>
					<UiButtonPlate
						width={sizes.width}
						height={sizes.height}
						anchor={0.5}
						backgroundColor={['spin_default', 'spin_disabled'].includes(key)
							? 0x6b1010
							: 0x14182a}
						backgroundAlpha={0.95}
						borderWidth={hovered || pressed ? 3 : 2}
						borderColor={hovered || pressed ? 0xffe79a : 0xffd147}
						borderRadius={18}
						{...disabled || ['spin_disabled', 'stop_disabled'].includes(key)
							? {
									backgroundColor: 0x2a2a32,
									backgroundAlpha: 0.85,
									borderColor: 0x6b5a2a,
								}
							: {}}
					/>
					<Text
						anchor={0.5}
						text={['spin_default', 'spin_disabled'].includes(key)
							? i18nDerived.bet()
							: i18nDerived.stop()}
						style={{
							align: 'center',
							wordWrap: true,
							wordWrapWidth: sizes.width - 16,
							fontFamily: 'serif',
							fontWeight: '900',
							letterSpacing: 1.5,
							fontSize: UI_BASE_FONT_SIZE * 0.85,
							fill: 0xffe79a,
							stroke: { color: 0x2a0d0d, width: 2 },
							dropShadow: {
								color: 0x000000,
								alpha: 0.7,
								blur: 2,
								distance: 1,
								angle: Math.PI / 2,
							},
						}}
					/>
				</Container>
			{/snippet}
		</Button>
	{/snippet}
</ButtonBetProvider>
