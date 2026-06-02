<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiButtonPlate from './UiButtonPlate.svelte';
	import UiAssetSprite from './UiAssetSprite.svelte';
	import type { ButtonIcon } from '../types';
	import type { Snippet } from 'svelte';
	import { i18nDerived } from '../i18n/i18nDerived';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';

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

	const iconAssetMap: Partial<Record<ButtonIcon, string>> = {
		decrease: 'menu_minus',
		increase: 'menu_plus',
		menu: 'menu_menu',
		turbo: 'menu_turbo',
		autoSpin: 'menu_auto_spin',
	};

	const defaultImageKey = $derived(iconAssetMap[icon]);
	const imageKey = $derived(active && icon === 'turbo' ? 'menu_turbo_active' : defaultImageKey);
	const isWideImage = $derived(['turbo', 'autoSpin'].includes(icon));
	// QA: menu / plus / minus icons were rendered as 1.14×0.82 of the plate,
	// which made them look horizontally stretched and vertically squashed.
	// Use near-square scaling for the narrow icons so they read as natural
	// glyphs inside the plate.
	const imageWidth = $derived(buttonProps.sizes.width * (isWideImage ? 1.12 : 0.92));
	const imageHeight = $derived(buttonProps.sizes.height * (isWideImage ? 0.82 : 0.92));
	const text = $derived(i18nDerived[icon]());
	const compactText = $derived(buttonProps.sizes.width <= UI_BASE_SIZE * 1.35);
	const textFontSize = $derived(UI_BASE_FONT_SIZE * (compactText ? 0.56 : 0.85));
</script>

<Button {...buttonProps}>
	{#snippet children({ center, hovered, pressed })}
		{#if imageKey}
			<Container
				{...center}
				scale={(pressed ? 0.94 : hovered ? 1.04 : 1) * (active ? 1.04 : 1)}
				alpha={buttonProps.disabled ? 0.48 : 1}
			>
				<UiAssetSprite
					assetKey={imageKey}
					fallbackAssetKey={defaultImageKey}
					anchor={0.5}
					width={imageWidth}
					height={imageHeight}
				/>
			</Container>
		{:else}
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
				{text}
				style={{
					align: 'center',
					wordWrap: false,
					fontFamily: 'serif',
					fontWeight: '900',
					letterSpacing: 1.5,
					fontSize: textFontSize,
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
		{/if}

		{@render childrenFromParent?.()}
	{/snippet}
</Button>
