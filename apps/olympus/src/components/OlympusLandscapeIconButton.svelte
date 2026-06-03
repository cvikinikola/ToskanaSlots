<script lang="ts">
	import { Container } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';

	import UiAssetSprite from 'components-ui-pixi/src/components/UiAssetSprite.svelte';
	import { portraitUiRuntime } from 'components-ui-pixi';
	import { menuBetControlHitSize } from 'components-ui-pixi/src/constants';

	type Props = Partial<Omit<ButtonProps, 'children'>> & {
		assetKey: string;
		fallbackAssetKey?: string;
		activeAssetKey?: string;
		active?: boolean;
		iconSide?: number;
		/** When set (portrait HUD), avoids reading landscape-inflated portraitUiRuntime.scale. */
		hitUiScale?: number;
		onpress?: () => void;
		children?: import('svelte').Snippet;
	};

	const {
		assetKey,
		fallbackAssetKey,
		activeAssetKey,
		active = false,
		iconSide: iconSideProp,
		hitUiScale: hitUiScaleProp,
		onpress,
		children,
		...buttonProps
	}: Props = $props();

	const hit = $derived(menuBetControlHitSize(6, hitUiScaleProp ?? portraitUiRuntime.scale));
	const iconSide = $derived(iconSideProp ?? hit.width - 12);
	const spriteKey = $derived(active && activeAssetKey ? activeAssetKey : assetKey);
</script>

<Button {...buttonProps} sizes={hit} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		<Container
			{...center}
			scale={pressed ? 0.94 : hovered ? 1.04 : 1}
			alpha={buttonProps.disabled ? 0.48 : 1}
		>
			<UiAssetSprite
				assetKey={spriteKey}
				fallbackAssetKey={fallbackAssetKey ?? assetKey}
				anchor={0.5}
				width={iconSide}
				height={iconSide}
			/>
		</Container>
		{@render children?.()}
	{/snippet}
</Button>
