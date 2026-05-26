<script lang="ts">
	import { BaseSprite, getContextApp } from 'pixi-svelte';
	import type { SpriteProps } from 'pixi-svelte';

	type Props = Omit<SpriteProps, 'texture' | 'key'> & {
		assetKey: string;
		key?: string;
	};

	const { assetKey, key = assetKey, ...spriteProps }: Props = $props();
	const context = getContextApp();
	const texture = $derived(context.stateApp.loadedAssets?.[assetKey]);
</script>

{#if texture}
	<BaseSprite {...spriteProps} {key} {texture} />
{/if}
