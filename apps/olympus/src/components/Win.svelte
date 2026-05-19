<script lang="ts" module>
	import type { WinLevelData } from '../game/winLevelMap';

	export type EmitterEventWin =
		| { type: 'winShow' }
		| { type: 'winHide' }
		| { type: 'winUpdate'; amount: number; winLevelData: WinLevelData };
</script>

<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { Container, BitmapText } from 'pixi-svelte';
	import { FadeContainer } from 'components-pixi';
	import { CanvasSizeRectangle, MainContainer } from 'components-layout';
	import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

	import { getContext } from '../game/context';
	import { SYMBOL_SIZE } from '../game/constants';

	const context = getContext();

	let show = $state(false);
	let winLevelData = $state<WinLevelData>();
	const countUpAmount = new Tween(0);

	context.eventEmitter.subscribeOnMount({
		winShow: () => {
			show = true;
			countUpAmount.set(0, { duration: 0 });
		},

		winHide: () => (show = false),

		winUpdate: async (e) => {
			winLevelData = e.winLevelData;
			if (countUpAmount.target === e.amount) return;
			await countUpAmount.set(e.amount, { duration: e.winLevelData.presentDuration });
		},
	});
</script>

<FadeContainer {show}>
	{#if winLevelData}
		{@const isBigWin = winLevelData.type === 'big'}
		{#if isBigWin}
			<CanvasSizeRectangle backgroundColor={0x000000} backgroundAlpha={0.6} />
		{/if}

		<MainContainer>
					<Container
						x={context.stateGameDerived.boardLayout().x}
						y={context.stateGameDerived.boardLayout().y}
					>
						<!-- Win level label (BIG WIN, SUPER WIN, etc.) -->
						{#if winLevelData.text}
							<BitmapText
								anchor={{ x: 0.5, y: 1 }}
								y={-SYMBOL_SIZE * 0.4}
								text={winLevelData.text}
								style={{
									fontFamily: 'proxima-nova',
									fontSize: SYMBOL_SIZE * 0.55,
									fill: 0xffd700,
									fontWeight: '700',
								}}
							/>
						{/if}

						<!-- Win amount count-up -->
						<BitmapText
							anchor={0.5}
							text={bookEventAmountToCurrencyString(countUpAmount.current)}
							style={{
								fontFamily: 'proxima-nova',
								fontSize: isBigWin ? SYMBOL_SIZE * 0.9 : SYMBOL_SIZE * 0.6,
								fill: 0xffffff,
								fontWeight: '700',
							}}
						/>
					</Container>
		</MainContainer>
	{/if}
</FadeContainer>
