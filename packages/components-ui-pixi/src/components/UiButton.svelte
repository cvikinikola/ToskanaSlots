<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiButtonPlate from './UiButtonPlate.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE } from '../constants';

	type Props = Omit<ButtonProps, 'children'> & {
		icon: ButtonIcon;
		sizes: { width: number; height: number };
		active?: boolean;
		children?: Snippet;
		variant?: 'dark' | 'light';
	};

	const {
		icon,
		active,
		variant = 'dark',
		children: childrenFromParent,
		...buttonProps
	}: Props = $props();
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		<UiButtonPlate
			{...center}
			anchor={0.5}
			width={buttonProps.sizes.width}
			height={buttonProps.sizes.height}
			backgroundColor={variant === 'dark' ? 0x14182a : 0xf5e9c8}
			backgroundAlpha={variant === 'dark' ? 0.92 : 0.96}
			borderWidth={hovered || pressed ? 3 : 2}
			borderColor={variant === 'dark'
				? hovered || pressed
					? 0xffe79a
					: 0xffd147
				: 0x6b4a14}
			borderRadius={18}
			{...buttonProps.disabled
				? {
						backgroundColor: 0x2a2a32,
						backgroundAlpha: 0.85,
						borderColor: 0x6b5a2a,
					}
				: {}}
			{...active
				? {
						borderWidth: 5,
						borderColor: variant === 'dark' ? 0xffe79a : 0x2a0d0d,
					}
				: {}}
		/>

		<Text
			{...center}
			anchor={0.5}
			text={i18nDerived[icon]()}
			style={{
				align: 'center',
				wordWrap: true,
				wordWrapWidth: 200,
				fontFamily: 'serif',
				fontWeight: '900',
				letterSpacing: 1.5,
				fontSize: UI_BASE_FONT_SIZE * 0.85,
				fill: variant === 'dark' ? 0xffd147 : 0x2a0d0d,
				stroke:
					variant === 'dark'
						? { color: 0x2a0d0d, width: 2 }
						: { color: 0xf5e9c8, width: 1 },
				dropShadow:
					variant === 'dark'
						? { color: 0x000000, alpha: 0.7, blur: 2, distance: 1, angle: Math.PI / 2 }
						: undefined,
			}}
		/>

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
