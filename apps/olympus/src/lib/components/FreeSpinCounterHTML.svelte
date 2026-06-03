<script lang="ts">
	import { getContextLayout } from 'utils-layout';
	import { getContext } from '../../game/context';
	import { SYMBOL_SIZE } from '../../game/constants';

	const context = getContext();
	const { stateLayoutDerived } = getContextLayout();

	// Mirror constants from FreeSpinCounter.svelte
	const PANEL_W = SYMBOL_SIZE * 2.45;
	const PANEL_H = SYMBOL_SIZE * 1.5;
	const CORNER = 18;

	let show = $state(false);
	let current = $state(0);
	let total = $state(0);

	// Only render on desktop / landscape (same condition as the Pixi version)
	const layoutType = $derived(stateLayoutDerived.layoutType());
	const active = $derived(layoutType === 'desktop' || layoutType === 'landscape');

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
		const boardW = boardLayout.width;
		const boardH = boardLayout.height;

		const panelX = boardLayout.x - boardW / 2 - PANEL_W - SYMBOL_SIZE * 0.3;
		const panelY = boardLayout.y - boardH / 2;

		return {
			left: cs.width / 2 + (panelX - ml.width / 2) * s,
			top: cs.height / 2 + (panelY - ml.height / 2) * s,
			width: PANEL_W * s,
			height: PANEL_H * s,
			corner: CORNER * s,
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
			--counter-scale:{placement.s};
		"
		aria-hidden="true"
	>
		<span class="knot side left" aria-hidden="true"></span>
		<span class="knot side right" aria-hidden="true"></span>
		<span class="knot mid top" aria-hidden="true"></span>
		<span class="knot mid bottom" aria-hidden="true"></span>
		<span
			class="label"
			style="font-size:{SYMBOL_SIZE * 0.19 * placement.s}px;top:{PANEL_H * 0.12 * placement.s}px;"
		>
			FREE SPINS
		</span>
		<span
			class="counter"
			style="font-size:{SYMBOL_SIZE * 0.43 * placement.s}px;top:{PANEL_H * 0.64 * placement.s}px;"
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
		background:
			linear-gradient(
				180deg,
				rgba(16, 48, 85, 0.84),
				rgba(6, 20, 39, 0.95) 42%,
				rgba(5, 12, 26, 0.96)
			),
			radial-gradient(circle at 50% 7%, rgba(73, 146, 220, 0.28), transparent 44%);
		border: max(2px, calc(4px * var(--counter-scale))) solid #d4a64a;
		box-shadow:
			0 0 0 max(2px, calc(4px * var(--counter-scale))) #4b2f08,
			inset 0 0 0 max(1px, calc(2px * var(--counter-scale))) #ffe6a8,
			inset 0 calc(7px * var(--counter-scale)) calc(16px * var(--counter-scale))
				rgba(67, 122, 185, 0.34),
			0 calc(4px * var(--counter-scale)) calc(9px * var(--counter-scale)) rgba(0, 0, 0, 0.52);
		box-sizing: border-box;
		user-select: none;
		opacity: 0;
		transition: opacity 300ms ease;

		&.visible {
			opacity: 1;
		}

		.knot {
			position: absolute;
			width: calc(22px * var(--counter-scale));
			height: calc(22px * var(--counter-scale));
			background:
				radial-gradient(circle at 50% 50%, #45b8ff 0 9%, transparent 10%),
				linear-gradient(
					135deg,
					#3c2709 0 18%,
					#7a5a1f 19% 36%,
					#f4cf78 37% 63%,
					#7a5a1f 64% 82%,
					#3c2709 83%
				);
			transform: rotate(45deg);
			box-shadow: 0 0 calc(7px * var(--counter-scale)) rgba(255, 214, 109, 0.42);
		}

		.side {
			top: 50%;
			margin-top: calc(-11px * var(--counter-scale));
		}

		.left {
			left: calc(4px * var(--counter-scale));
		}

		.right {
			right: calc(4px * var(--counter-scale));
		}

		.mid {
			left: 50%;
			width: calc(18px * var(--counter-scale));
			height: calc(18px * var(--counter-scale));
			margin-left: calc(-9px * var(--counter-scale));
		}

		.top {
			top: calc(-7px * var(--counter-scale));
		}

		.bottom {
			bottom: calc(-7px * var(--counter-scale));
		}

		.label {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			color: #ffd700;
			font-family: Arial, sans-serif;
			font-weight: 700;
			letter-spacing: 0.05em;
			text-shadow:
				0 calc(2px * var(--counter-scale)) #4b3300,
				0 0 calc(8px * var(--counter-scale)) rgba(255, 215, 0, 0.42);
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
			text-shadow:
				0 calc(2px * var(--counter-scale)) calc(2px * var(--counter-scale)) rgba(0, 0, 0, 0.85),
				0 0 calc(10px * var(--counter-scale)) rgba(255, 255, 255, 0.22);
			white-space: nowrap;
		}
	}
</style>
