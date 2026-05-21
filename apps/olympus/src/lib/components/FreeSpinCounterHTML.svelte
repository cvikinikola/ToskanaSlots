<script lang="ts">
	import { getContextLayout } from 'utils-layout';
	import { getContext } from '../../game/context';
	import { SYMBOL_SIZE } from '../../game/constants';

	const context = getContext();
	const { stateLayoutDerived } = getContextLayout();

	// Mirror constants from FreeSpinCounter.svelte
	const PANEL_W = SYMBOL_SIZE * 2.2;
	const PANEL_H = SYMBOL_SIZE * 1.4;
	const CORNER = 14;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);

	// Only render on desktop / landscape (same condition as the Pixi version)
	const layoutType = $derived(stateLayoutDerived.layoutType());
	const active = $derived(
		layoutType === 'desktop' || layoutType === 'landscape',
	);

	context.eventEmitter.subscribeOnMount({
		freeSpinCounterShow: () => (show = true),
		freeSpinCounterHide: () => (show = false),
		freeSpinCounterUpdate: (e) => {
			if (e.current !== undefined) current = e.current;
			if (e.total !== undefined) total = e.total;
		},
	});

	/**
	 * Convert the Pixi MainContainer position of the FreeSpinCounter panel into
	 * CSS pixel coordinates so this HTML element sits exactly on top of it.
	 *
	 * MainContainer formula (derived from components-layout/MainContainer.svelte):
	 *   css_x = canvasSizes.width / 2 + (mainLayout_x - mainLayout.width / 2) * mainLayout.scale
	 *   css_y = canvasSizes.height / 2 + (mainLayout_y - mainLayout.height / 2) * mainLayout.scale
	 */
	const placement = $derived.by(() => {
		const boardLayout = context.stateGameDerived.boardLayout();
		const ml = stateLayoutDerived.mainLayout();
		const cs = stateLayoutDerived.canvasSizes();
		const s = ml.scale;

		const panelX =
			boardLayout.x - boardLayout.width / 2 - PANEL_W - SYMBOL_SIZE * 0.3;
		const panelY = boardLayout.y - boardLayout.height / 2;

		return {
			left: cs.width / 2 + (panelX - ml.width / 2) * s,
			top: cs.height / 2 + (panelY - ml.height / 2) * s,
			width: PANEL_W * s,
			height: PANEL_H * s,
			corner: CORNER * s,
			borderWidth: Math.max(1, 2 * s),
			s,
		};
	});
</script>

{#if active}
	<div
		class="free-spin-counter"
		class:visible={show}
		style="
			left:{placement.left}px;
			top:{placement.top}px;
			width:{placement.width}px;
			height:{placement.height}px;
			border-radius:{placement.corner}px;
			border-width:{placement.borderWidth}px;
		"
		aria-hidden="true"
	>
		<span
			class="label"
			style="font-size:{SYMBOL_SIZE * 0.2 * placement.s}px;top:{PANEL_H * 0.1 * placement.s}px;"
		>
			FREE SPINS
		</span>
		<span
			class="counter"
			style="font-size:{SYMBOL_SIZE * 0.45 * placement.s}px;top:{PANEL_H * 0.62 * placement.s}px;"
		>
			{current} / {total}
		</span>
	</div>
{/if}

<style lang="scss">
	.free-spin-counter {
		position: fixed;
		pointer-events: none;
		z-index: 20;
		background: rgba(13, 13, 31, 0.9);
		border-style: solid;
		border-color: #ffd700;
		box-sizing: border-box;
		user-select: none;
		opacity: 0;
		transition: opacity 300ms ease;

		&.visible {
			opacity: 1;
		}

		.label {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			color: #ffd700;
			font-family: Arial, sans-serif;
			font-weight: 700;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			white-space: nowrap;
		}

		.counter {
			position: absolute;
			left: 50%;
			transform: translate(-50%, -50%);
			color: #ffffff;
			font-family: Arial, sans-serif;
			font-weight: 700;
			white-space: nowrap;
		}
	}
</style>
