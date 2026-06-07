<script lang="ts">
	import { Container, Sprite, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { MainContainer } from 'components-layout';
	import { OnHotkey } from 'components-shared';
	import { OnPressFullScreen } from 'components-layout';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, getLoadingCenterFraction } from '../game/constants';

	type Props = { onloaded: () => void };
	const props: Props = $props();
	const context = getContext();

	const loaded = $derived(context.stateApp.loaded);
	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const centerFraction = $derived(getLoadingCenterFraction(layoutType));
	const stacked = $derived(layoutType === 'portrait' || layoutType === 'tablet');
	const logoScale = $derived(stacked ? 0.88 : 1);

	/** logo_tuscany_harvest.png aspect (height / width). */
	const LOGO_ASPECT = 0.74;
	const logoWidth = $derived(
		context.stateLayoutDerived.mainLayout().width * (stacked ? 0.9 : 0.5) * logoScale,
	);
	const logoHeight = $derived(logoWidth * LOGO_ASPECT);
	const taglineY = $derived(logoHeight * 0.5 + SYMBOL_SIZE * 0.35);
	const actionY = $derived(taglineY + SYMBOL_SIZE * 0.85);
</script>

<FadeContainer show={true}>
	<MainContainer>
		<Container
			x={context.stateLayoutDerived.mainLayout().width * centerFraction.x}
			y={context.stateLayoutDerived.mainLayout().height * centerFraction.y}
		>
			<Sprite
				key="logo"
				anchor={0.5}
				y={0}
				width={logoWidth}
				height={logoHeight}
			/>

			<BitmapText
				anchor={0.5}
				y={taglineY}
				text="WIN UP TO 25,000× BET"
				style={{
					fontFamily: 'system-ui',
					fontSize: SYMBOL_SIZE * 0.3 * logoScale,
					fill: 0xffd700,
					fontWeight: '700',
					stroke: { color: 0x1a0608, width: 4 },
				}}
			/>

			{#if !loaded}
				<BitmapText
					anchor={0.5}
					y={actionY}
					text="Loading..."
					style={{
						fontFamily: 'system-ui',
						fontSize: SYMBOL_SIZE * 0.3 * logoScale,
						fill: 0xaaaaaa,
					}}
				/>
			{/if}

			{#if loaded}
				<BitmapText
					anchor={0.5}
					y={actionY}
					text="PRESS ANYWHERE TO START"
					style={{
						fontFamily: 'system-ui',
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
