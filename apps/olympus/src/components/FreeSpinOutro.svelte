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
	const waitForDismiss = (duration: number) =>
		new Promise<void>((resolve) => {
			let settled = false;
			let timeout: ReturnType<typeof setTimeout>;
			const cleanup = () => {
				window.removeEventListener('pointerdown', finish);
				window.removeEventListener('keydown', finish);
				clearTimeout(timeout);
			};
			const finish = () => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve();
			};

			window.addEventListener('pointerdown', finish);
			window.addEventListener('keydown', finish);
			timeout = setTimeout(finish, duration);
		});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			winLevelData = undefined;
			countUpAmount.set(0, { duration: 0 });
		},

		freeSpinOutroHide: () => (show = false),

		freeSpinOutroCountUp: async (e) => {
			winLevelData = e.winLevelData;
			// Use a minimum 3-second count-up so the player always sees the win animate.
			const duration = Math.max(e.winLevelData?.presentDuration || 0, 3 * SECOND);
			const countUp =
				countUpAmount.target === e.amount
					? new Promise<void>((resolve) => setTimeout(resolve, duration))
					: countUpAmount.set(e.amount, { duration });

			await Promise.race([
				countUp,
				waitForDismiss(duration),
			]);
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
