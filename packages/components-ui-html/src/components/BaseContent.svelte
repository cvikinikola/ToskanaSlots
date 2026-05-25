<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		maxWidth: '100%' | '500px';
		children: Snippet;
	};

	const props: Props = $props();
</script>

<div class="ui-popup-standard-content-wrap" style="--maxWidth: {props.maxWidth}; --zIndex: {100}">
	{@render props.children()}
</div>

<style lang="scss">
	.ui-popup-standard-content-wrap {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		z-index: var(--zIndex);
		width: min(var(--maxWidth), calc(100vw - 2rem));
		max-width: var(--maxWidth);
		max-height: calc(100dvh - 4rem);
		gap: 1rem;
		min-height: 0;

		@media screen and (max-width: 500px) {
			width: calc(100vw - 1rem);
			max-height: calc(100dvh - 3.5rem);
			gap: 0.75rem;
		}
	}
</style>
