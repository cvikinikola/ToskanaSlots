<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import { devicePixelRatio } from 'svelte/reactivity/window';

	import { getContextApp } from '../context.svelte';
	import { preloadFont } from '../utils.svelte';

	type Props = { children: Snippet };

	const props: Props = $props();
	const context = getContextApp();

	let wrap: HTMLDivElement;
	let initialised = $state(false);
	let initError = $state<string | null>(null);

	const hasWebGL = () => {
		const canvas = document.createElement('canvas');
		const gl =
			canvas.getContext('webgl2') ||
			canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl');

		return Boolean(gl);
	};

	const initialiseApplication = async () => {
		if (!hasWebGL()) {
			throw new Error('WebGL is not available in this browser session.');
		}

		PIXI.Assets.reset();

		await preloadFont();
		context.stateApp.pixiApplication = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>();
		await context.stateApp.pixiApplication.init({
			autoDensity: true,
			backgroundAlpha: 0,
			hello: true,
			multiView: false,
			antialias: true,
			clearBeforeRender: true,
			preference: 'webgl',
			powerPreference: 'high-performance',
			resolution: devicePixelRatio.current,
			resizeTo: window,
		});

		wrap.appendChild(context.stateApp.pixiApplication.canvas);

		// to prevent that you can't scroll the page with touch on the canvas. https://github.com/pixijs/pixijs/issues/4824
		context.stateApp.pixiApplication.renderer.events.autoPreventDefault = false;
		context.stateApp.pixiApplication.renderer.canvas.style.touchAction = 'auto';
	};

	onMount(async () => {
		try {
			if (!initialised) await initialiseApplication();
			initialised = true;
		} catch (error) {
			initError =
				error instanceof Error
					? error.message
					: 'Unable to initialise the game renderer.';
		}
	});

	onDestroy(() => {
		if (context.stateApp.pixiApplication) {
			context.stateApp.pixiApplication.destroy();
		}
	});
</script>

<div bind:this={wrap}>
	{#if initialised}
		{@render props.children()}
	{:else if initError}
		<div class="renderer-error">
			<div class="renderer-error__panel">
				<p class="renderer-error__eyebrow">Hammer of Thor 1000</p>
				<h1>WebGL is disabled</h1>
				<p>
					The game renderer cannot start in this browser session. Enable browser hardware
					acceleration or open the game in a browser where WebGL is available.
				</p>
				<code>{initError}</code>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.renderer-error {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		padding: 24px;
		background:
			linear-gradient(135deg, rgba(255, 205, 97, 0.18), transparent 36%),
			linear-gradient(315deg, rgba(60, 151, 255, 0.14), transparent 34%),
			#f7f2ea;
		color: #1d1712;
		font-family:
			Inter,
			ui-sans-serif,
			system-ui,
			sans-serif;
		text-align: left;

		&__panel {
			width: min(100%, 520px);
			display: grid;
			gap: 14px;
			padding: 28px;
			border: 1px solid rgba(82, 60, 38, 0.18);
			border-radius: 8px;
			background: rgba(255, 252, 247, 0.92);
			box-shadow: 0 20px 60px rgba(45, 31, 20, 0.16);
		}

		&__eyebrow {
			margin: 0;
			color: #8a5a1f;
			font-size: 12px;
			font-weight: 700;
			letter-spacing: 0.08em;
			text-transform: uppercase;
		}

		h1 {
			margin: 0;
			font-size: 28px;
			line-height: 1.1;
		}

		p {
			margin: 0;
			color: #4d4137;
			font-size: 15px;
			line-height: 1.55;
		}

		code {
			display: block;
			padding: 10px 12px;
			border-radius: 6px;
			background: #efe6d9;
			color: #5f4630;
			font-size: 14px;
			white-space: normal;
		}
	}
</style>
