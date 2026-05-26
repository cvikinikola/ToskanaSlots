<script lang="ts">
	import { Container, BitmapText, Sprite } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { OnPressFullScreen } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, getLoadingCenterFraction } from '../game/constants';
	import { stateGame } from '../game/stateGame.svelte';

	type Props = { onloaded: () => void };
	const props: Props = $props();
	const context = getContext();

	const loaded = $derived(
		context.stateApp.loaded && stateGame.hammer3DReady && stateGame.thor3DReady,
	);
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const centerFraction = $derived(getLoadingCenterFraction(layoutType));
	// Tighter logo + spacing on portrait/tablet so it doesn't overflow.
	const stacked = $derived(layoutType === 'portrait' || layoutType === 'tablet');
	const logoScale = $derived(stacked ? 0.75 : 1);
</script>

<FadeContainer show={true}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * centerFraction.x}
			y={context.stateLayoutDerived.mainLayout().height * centerFraction.y}
		>
			<!-- Title logo (placeholder Hammer of Thor SVG) -->
			<Sprite
				key="logo"
				anchor={0.5}
				y={-SYMBOL_SIZE * 2.0 * logoScale}
				width={SYMBOL_SIZE * 6.5 * logoScale}
				height={SYMBOL_SIZE * 4.3 * logoScale}
			/>

			<BitmapText
				anchor={0.5}
				y={SYMBOL_SIZE * 0.6 * logoScale}
				text="WIN UP TO 15,000 X BET"
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.3 * logoScale,
					fill: 0xffd700,
					fontWeight: '700',
					stroke: { color: 0x1a0608, width: 4 },
				}}
			/>

			{#if !loaded}
				<BitmapText
					anchor={0.5}
					y={SYMBOL_SIZE * 1.25 * logoScale}
					text="Loading..."
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * 0.3 * logoScale,
						fill: 0xaaaaaa,
					}}
				/>
			{/if}

			{#if loaded}
				<BitmapText
					anchor={0.5}
					y={SYMBOL_SIZE * 1.25 * logoScale}
					text="PRESS ANYWHERE TO START"
					style={{
						fontFamily: 'proxima-nova',
						fontSize: SYMBOL_SIZE * 0.32 * logoScale,
						fill: 0xffd700,
						fontWeight: '700',
						stroke: { color: 0x1a0608, width: 4 },
					}}
				/>
			{/if}
		</Container>
	</MainContainer>
</FadeContainer>

{#if loaded}
	<OnHotkey hotkey="Space" onpress={() => props.onloaded()} />
	<OnPressFullScreen onpress={() => props.onloaded()} />
{/if}
