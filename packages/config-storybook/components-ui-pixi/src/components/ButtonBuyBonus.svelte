<script lang="ts">
	import { Text } from 'pixi-svelte';
	import { Button, type ButtonProps } from 'components-pixi';
	import { stateModal, stateBet, stateBetDerived } from 'state-shared';

	import UiButtonPlate from './UiButtonPlate.svelte';
	import { UI_BASE_FONT_SIZE, UI_BASE_SIZE } from '../constants';
	import { getContext } from '../context';
	import { i18nDerived } from '../i18n/i18nDerived';

	const props: Partial<Omit<ButtonProps, 'children'>> = $props();
	const { stateXstateDerived, eventEmitter } = getContext();
	const sizes = { width: UI_BASE_SIZE, height: UI_BASE_SIZE };
	const disabled = $derived(!stateXstateDerived.isIdle());
	const active = $derived(stateBetDerived.activeBetMode()?.type === 'activate');

	const openModal = () => (stateModal.modal = { name: 'buyBonus' });
	const disableActiveBetMode = () => (stateBet.activeBetModeKey = 'BASE');
	const onpress = () => {
		eventEmitter.broadcast({ type: 'soundPressGeneral' });

		if (active) {
			disableActiveBetMode();
		} else {
			openModal();
		}
	};

	const getState = (value: {
		active: boolean;
		disabled: boolean;
		hovered: boolean;
		pressed: boolean;
	}) => {
		if (value.disabled) return 'disabled' as const;
		if (value.pressed) return 'pressed' as const;
		if (value.hovered) return 'hovered' as const;
		if (value.active) return 'active' as const;
		return 'default' as const;
	};
</script>

<Button {...props} {sizes} {disabled} {onpress}>
	{#snippet children({ center, hovered, pressed })}
		{@const state = getState({
			active,
			disabled,
			hovered,
			pressed,
		})}

		<UiButtonPlate
			{...center}
			anchor={0.5}
			width={sizes.width}
			height={sizes.height}
			backgroundColor={active ? 0x4a1f1f : 0x14182a}
			backgroundAlpha={0.95}
			borderWidth={active ? 3 : hovered || pressed ? 3 : 2}
			borderColor={active ? 0xffe79a : hovered || pressed ? 0xffe79a : 0xffd147}
			borderRadius={18}
			{...disabled
				? {
						backgroundColor: 0x2a2a32,
						backgroundAlpha: 0.85,
						borderColor: 0x6b5a2a,
					}
				: {}}
		/>

		<Text
			{...center}
			anchor={0.5}
			text={state === 'active' ? i18nDerived.disable() : i18nDerived.buyBonus()}
			style={{
				align: 'center',
				wordWrap: true,
				wordWrapWidth: sizes.width - 16,
				fontFamily: 'serif',
				fontWeight: '900',
				letterSpacing: 1,
				lineHeight: UI_BASE_FONT_SIZE * 0.95,
				fontSize: UI_BASE_FONT_SIZE * 0.78,
				fill: 0xffe79a,
				stroke: { color: 0x2a0d0d, width: 2 },
				dropShadow: {
					color: 0x000000,
					alpha: 0.7,
					blur: 2,
					distance: 1,
					angle: Math.PI / 2,
				},
			}}
		/>
	{/snippet}
</Button>
