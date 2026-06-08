<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventFreeSpinOutro =
		| { type: 'freeSpinOutroShow' }
		| { type: 'freeSpinOutroHide' }
		| { type: 'freeSpinOutroCountUp'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { Tween } from 'svelte/motion';
	import { Container, Sprite, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';
	import {
		FREE_SPIN_OUTRO_COUNT_FRACTION,
		getFreeSpinOutroMusicDurationMs,
		preloadFreeSpinOutroMusicDuration,
	} from '../game/freeSpinOutroAudio';

	const context = getContext();

	const layout = $derived(context.stateLayoutDerived.mainLayout());
	const FRAME_ASPECT = 422 / 591;
	const PANEL_W = $derived(Math.min(SYMBOL_SIZE * 6.2, layout.width * 0.92));
	const PANEL_H = $derived(Math.min(PANEL_W * FRAME_ASPECT, layout.height * 0.55));
	const FONT_SCALE = $derived(PANEL_W / (SYMBOL_SIZE * 6.2));
	const OVERLAY_ALPHA = 0.42;

	// Text colours — tuned for the wood frame asset
	const PANEL_WOOD_DEEP = 0x2e180f;
	const PANEL_GOLD_HEADING = 0xffd86b;
	const PANEL_CREAM = 0xf5e7c0;

	let show = $state(false);
	let winLevelData = $state<WinLevelData>();
	const countUpAmount = new Tween(0);
	let countUpComplete = $state(false);

	onMount(() => {
		preloadFreeSpinOutroMusicDuration();
	});

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
				if (!countUpComplete) return;
				finish();
			};

			window.addEventListener('pointerdown', onInput);
			window.addEventListener('keydown', onInput);
			timeout = setTimeout(finish, duration);
		});

	const waitForTimeout = (duration: number) =>
		new Promise<void>((resolve) => {
			setTimeout(resolve, duration);
		});

	context.eventEmitter.subscribeOnMount({
		freeSpinOutroShow: () => {
			show = true;
			winLevelData = undefined;
			countUpComplete = false;
			countUpAmount.set(0, { duration: 0 });
		},

		freeSpinOutroHide: () => {
			show = false;
			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_jackpot_ascension' });
		},

		freeSpinOutroCountUp: async (e) => {
			winLevelData = e.winLevelData;

			const totalDuration = await getFreeSpinOutroMusicDurationMs();
			const countUpDuration = Math.round(totalDuration * FREE_SPIN_OUTRO_COUNT_FRACTION);
			const startedAt = performance.now();

			context.eventEmitter.broadcast({ type: 'soundOnce', name: 'sfx_jackpot_ascension' });

			const animateCountUp =
				countUpAmount.target === e.amount
					? waitForTimeout(countUpDuration)
					: countUpAmount.set(e.amount, { duration: countUpDuration });

			await new Promise<void>((resolve) => {
				let settled = false;
				const finish = () => {
					if (settled) return;
					settled = true;
					window.removeEventListener('pointerdown', onSkip);
					window.removeEventListener('keydown', onSkip);
					resolve();
				};
				const onSkip = () => {
					countUpAmount.set(e.amount, { duration: 0 });
					finish();
				};
				window.addEventListener('pointerdown', onSkip);
				window.addEventListener('keydown', onSkip);
				animateCountUp.then(finish);
			});

			countUpComplete = true;

			const elapsed = performance.now() - startedAt;
			const remainingMs = Math.max(0, totalDuration - elapsed);
			if (remainingMs > 0) await waitForDismiss(remainingMs);

			context.eventEmitter.broadcast({ type: 'soundStop', name: 'sfx_jackpot_ascension' });
		},
	});
</script>

<FadeContainer {show}>
	<CanvasSizeRectangle backgroundColor={0x04060f} backgroundAlpha={OVERLAY_ALPHA} />

	<MainContainer>
		<Container
			x={layout.width / 2}
			y={layout.height / 2}
			pivot={{ x: PANEL_W / 2, y: PANEL_H / 2 }}
		>
			<Sprite key="outro_frame" width={PANEL_W} height={PANEL_H} />

			<BitmapText
				anchor={{ x: 0.5, y: 0.5 }}
				x={PANEL_W / 2}
				y={PANEL_H * 0.35}
				text={winLevelData?.text || 'FREE SPINS COMPLETE!'}
				style={{
					fontFamily: 'proxima-nova',
					fontSize: SYMBOL_SIZE * 0.34 * FONT_SCALE,
					fill: PANEL_GOLD_HEADING,
					fontWeight: '900',
					stroke: { color: PANEL_WOOD_DEEP, width: 3 },
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
					fill: PANEL_CREAM,
					fontWeight: '900',
					stroke: { color: PANEL_WOOD_DEEP, width: 2 },
				}}
			/>
		</Container>
	</MainContainer>
</FadeContainer>
