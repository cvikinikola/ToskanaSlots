<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { UiAssetSprite } from 'components-ui-pixi';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';
	import { SECOND } from 'constants-shared/time';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	// Panel sizing — responsive. On wide layouts (landscape desktop) the panel
	// is the classic ~5.5 × SYMBOL_SIZE wide; on narrow portrait/phone layouts
	// it shrinks to fit inside mainLayout so the text never overflows.
	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const PANEL_W = $derived(Math.min(SYMBOL_SIZE * 5.5, layout.width * 0.88));
	const PANEL_H = $derived(Math.min(SYMBOL_SIZE * 3.5, layout.height * 0.5));
	const FONT_SCALE = $derived(PANEL_W / (SYMBOL_SIZE * 5.5));

	let show = $state(false);
	let winLevelData = $state<WinLevelData>();
	const countUpAmount = new Tween(0);
	let countUpComplete = $state(false);

	/**
	 * Resolves when either:
	 *  - the user clicks / presses a key AFTER the count-up animation has
	 *    fully completed, or
	 *  - the maximum hold duration elapses.
	 * Early dismissals are ignored so the player always sees the total win
	 * count up to the end before the outro panel closes.
	 */
	const waitForDismiss = (duration: number) =>
		new Promise<void>((resolve) => {
			let settled = false;
			let timeout: ReturnType<typeof setTimeout>;
			const cleanup = () => {
				window.removeEventListener('pointerdown', onInput);
				window.removeEventListener('keydown', onInput);
				clearTimeout(timeout);
			};
			const finish = () => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve();
			};
			const onInput = () => {
				// Only allow dismissal AFTER the win count-up has visually finished
				// so the player never misses the final amount.
				if (!countUpComplete) return;
				finish();
			};

			window.addEventListener('pointerdown', onInput);
			window.addEventListener('keydown', onInput);
			timeout = setTimeout(finish, duration);
		});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			winLevelData = undefined;
			countUpComplete = false;
			countUpAmount.set(0, { duration: 0 });
		},

		freeSpinOutroHide: () => (show = false),

		freeSpinOutroCountUp: async (e) => {
			winLevelData = e.winLevelData;

			// Total time the count-up animates for. Always at least 3 seconds so
			// even a tiny final win is presented; bigger wins use the win-level's
			// own presentDuration (BIG/MEGA/EPIC).
			const countUpDuration = Math.max(e.winLevelData?.presentDuration || 0, 3 * SECOND);

			// 1) Fully animate the count-up to the final amount. Do NOT race with
			//    a dismiss listener here — the player must see the money land on
			//    the final value before anything else can interrupt.
			if (countUpAmount.target === e.amount) {
				await new Promise<void>((resolve) => setTimeout(resolve, countUpDuration));
			} else {
				await countUpAmount.set(e.amount, { duration: countUpDuration });
			}

			countUpComplete = true;

			// 2) Hold the final amount on screen until the player taps/clicks or
			//    the max hold elapses. Hold longer for the bigger win levels so
			//    MEGA / EPIC banners stay readable.
			const holdDuration = Math.max(e.winLevelData?.presentDuration || 0, 3 * SECOND);
			await waitForDismiss(holdDuration);
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.75} />

	<MainContainer>
		<Container
			x={layout.width / 2}
			y={layout.height / 2}
			pivot={{ x: PANEL_W / 2, y: PANEL_H / 2 }}
		>
			<UiAssetSprite
				key="menu_frame_free_spins"
				assetKey="menu_frame_free_spins"
				anchor={{ x: 0, y: 0 }}
				width={PANEL_W}
				height={PANEL_H}
			/>

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.35}
				text={winLevelData?.text || 'FREE SPINS COMPLETE!'}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.34 * FONT_SCALE,
					fill: 0xffd700,
					fontWeight: '900',
				}}
			/>

					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.62}
				text={`YOU WON ${bookEventAmountToCurrencyString(countUpAmount.current)}`}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.44 * FONT_SCALE,
					fill: 0xffffff,
					fontWeight: '900',
				}}
			/>
				</Container>
	</MainContainer>
</FadeContainer>
