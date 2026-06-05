<script lang="ts">
	import { Container, Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import UiAssetSprite from './UiAssetSprite.svelte';
	import { UI_BAR_ACTION_SIZE } from '../constants';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = { width: UI_BAR_ACTION_SIZE, height: UI_BAR_ACTION_SIZE };
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	/** Panel PNG 638×391 — wide octagon plaque. */
	const plateWidth = sizes.width * 1.48;
	const plateHeight = plateWidth * (391 / 638);

	const labelLines = $derived.by(() => {
		const raw = i18nDerived.buyBonus().trim();
		const parts = raw.split(/\s+/);
		if (parts.length >= 2) return [parts[0], parts.slice(1).join(' ')];
		return [raw, ''];
	});

	// Scale type to the plaque (not UI_BASE_FONT_SIZE — too small on +20% button).
	const titleSize = $derived(plateHeight * 0.28);
	const subtitleSize = $derived(plateHeight * 0.22);
	const lineOffsetY = $derived(plateHeight * 0.13);

	const labelStyle = {
		fontFamily: 'serif',
		fontWeight: '900',
		fill: 0xffe79a,
		stroke: { color: 0x1a0800, width: 4 },
		dropShadow: { color: 0x000000, alpha: 0.9, blur: 3, distance: 2, angle: Math.PI / 2 },
	} as const;

	const openConfirm = () => (stateModal.modal = { name: 'buyBonusConfirm' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openConfirm();
		}
	};
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		<Container
			{...center}
			scale={(pressed ? 0.96 : hovered ? 1.05 : 1) * (active ? 1.04 : 1)}
			alpha={disabled ? 0.5 : 1}
		>
			<UiAssetSprite
				assetKey="menu_buy_bonus"
				anchor={0.5}
				width={plateWidth}
				height={plateHeight}
			/>

			<Text
				anchor={0.5}
				text={labelLines[0]}
				y={-lineOffsetY}
				style={{
					...labelStyle,
					fontSize: titleSize,
					letterSpacing: 3,
				}}
			/>
			{#if labelLines[1]}
				<Text
					anchor={0.5}
					text={labelLines[1]}
					y={lineOffsetY}
					style={{
						...labelStyle,
						fontSize: subtitleSize,
						letterSpacing: 4,
					}}
				/>
			{/if}
		</Container>
	{/snippet}
</Button>
