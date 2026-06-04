<script lang="ts" module>
	// Gates-of-Olympus style multiplier "fly" animation. When the combined
	// spin multiplier is collected (×5/×10/×20…), a big glowing ×N orb pops in
	// at the centre of the board, then flies into the TumbleWinAmount panel
	// right before the win count-up multiplies — making it visually obvious
	// that the win is being multiplied.
	export type EmitterEventMultiplierFly =
		| { type: 'multiplierFly'; multiplier: number };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut, backOut } from 'svelte/easing';
	import { Container, BitmapText } from 'pixi-svelte';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { stateBet } from 'state-shared';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { SYMBOL_SIZE, BOARD_SIZES, REEL_FRAME_OFFSET, REEL_FRAME_SIZES } from '../game/constants';

	const context = getContext();

	const GOLD = 0xffd147;

	// ── Mirror TumbleWinAmount panel geometry so the orb lands on the panel ──
	const PANEL_W = SYMBOL_SIZE * 3.85;
	const PANEL_H = SYMBOL_SIZE * 1.05;
	const PANEL_W_STACKED = SYMBOL_SIZE * 3.95;
	const PANEL_H_STACKED = SYMBOL_SIZE * 1.08;

	const isCompact = $derived(
		['portrait', 'tablet'].includes(context.stateLayoutDerived.layoutType()),
	);
	const panelWidth = $derived(isCompact ? PANEL_W_STACKED : PANEL_W);
	const panelHeight = $derived(isCompact ? PANEL_H_STACKED : PANEL_H);

	const frameBounds = $derived({
		top: BOARD_SIZES.height / 2 - REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
		bottom: BOARD_SIZES.height / 2 + REEL_FRAME_SIZES.height / 2 + REEL_FRAME_OFFSET.y,
	});

	/** Target = centre of the TumbleWinAmount panel (mirrors its position). */
	const panelCenter = $derived.by(() => {
		const x = BOARD_SIZES.width / 2;
		const layoutType = context.stateLayoutDerived.layoutType();
		if (layoutType === 'portrait') {
			const GAP = SYMBOL_SIZE * 0.09;
			return { x, y: frameBounds.top - panelHeight - GAP + panelHeight / 2 };
		}
		const top = isCompact
			? frameBounds.bottom - panelHeight * 0.48
			: frameBounds.bottom - panelHeight * 0.35;
		return { x, y: top + panelHeight / 2 };
	});

	/** Origin = centre of the board (where the multiplier orbs combine). */
	const boardCenter = { x: BOARD_SIZES.width / 2, y: BOARD_SIZES.height / 2 };

	let multiplier = $state(0);
	let visible = $state(false);
	// progress: 0 = popped in at board centre, 1 = arrived at the panel.
	const fly = new Tween(0, { duration: 0 });
	const pop = new Tween(0, { duration: 0 });

	const current = $derived.by(() => {
		const t = fly.current;
		return {
			x: boardCenter.x + (panelCenter.x - boardCenter.x) * t,
			y: boardCenter.y + (panelCenter.y - boardCenter.y) * t,
			// Big at the centre, shrinks as it flies into the panel.
			scale: pop.current * (1 - 0.62 * t),
			alpha: t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25,
		};
	});

	context.eventEmitter.subscribeOnMount({
		multiplierFly: async (emitterEvent) => {
			multiplier = emitterEvent.multiplier;
			visible = true;
			fly.set(0, { duration: 0 });
			pop.set(0, { duration: 0 });

			const turbo = stateBet.isTurbo;
			// (1) Pop in at board centre with a bouncy overshoot + lightning zap.
			context.eventEmitter.broadcast({
				type: 'lightningStrike',
				durationMs: turbo ? 180 : 300,
			});
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_update' });
			await pop.set(1, { duration: turbo ? 140 : 260, easing: backOut });
			if (!turbo) await new Promise((r) => setTimeout(r, 180));

			// (2) Fly into the TumbleWinAmount panel.
			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_multiplier_win' });
			await fly.set(1, { duration: turbo ? 220 : 420, easing: cubicOut });

			visible = false;
			multiplier = 0;
		},
	});
</script>

{#if visible}
	<BoardContainer>
		<Container x={current.x} y={current.y} scale={current.scale} alpha={current.alpha}>
			<UiAssetSprite
				key="multiplier_fly_glow"
				assetKey="menu_frame_free_spins"
				anchor={0.5}
				width={SYMBOL_SIZE * 2.2}
				height={SYMBOL_SIZE * 2.2}
				alpha={0.9}
			/>
			<BitmapText
				anchor={0.5}
				text={`x${multiplier}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.62,
					fill: GOLD,
					fontWeight: '900',
				}}
			/>
		</Container>
	</BoardContainer>
{/if}
