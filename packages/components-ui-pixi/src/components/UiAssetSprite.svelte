<script lang="ts">
	import { BaseSprite, getContextApp } from 'pixi-svelte';
	import type { SpriteProps } from 'pixi-svelte';

	type Props = Omit<SpriteProps, 'texture'> & {
		assetKey: string;
	};

	const { assetKey, ...spriteProps }: Props = $props();
	const context = getContextApp();
	const texture = $derived(context.stateApp.loadedAssets?.[assetKey]);
</script>

{#if texture}
	<BaseSprite {...spriteProps} {texture} />
{/if}
