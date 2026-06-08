<script lang="ts">
	import { Container, anchorToPivot } from 'pixi-svelte';
	import { MainContainer } from 'components-layout';
	import {
		LabelBet,
		ButtonIncrease,
		ButtonDecrease,
		DESKTOP_BASE_SIZE,
		DESKTOP_BACKGROUND_WIDTH_LIST,
		LANDSCAPE_BASE_SIZE,
		LANDSCAPE_BACKGROUND_WIDTH_LIST,
	} from 'components-ui-pixi';

	import { getContext } from '../game/context';
	import {
		BET_CONTROLS_FOREGROUND_Z_INDEX,
		shouldShowBetControls,
	} from '../game/betControlsForeground';

	const context = getContext();

	const layoutType = $derived(context.stateLayoutDerived.layoutType());
	const mainLayoutStandard = $derived(context.stateLayoutDerived.mainLayoutStandard());
	const gameType = $derived(context.stateGame.gameType);
	const show = $derived(
		shouldShowBetControls(
			context.stateLayoutDerived.canvasSizes(),
			context.stateLayoutDerived.mainLayout(),
			layoutType,
			gameType,
			context.stateGame,
		),
	);
</script>

{#if show}
	<!-- Stage-level zIndex — deka overlay may mount later via {#if show}. -->
	<Container zIndex={BET_CONTROLS_FOREGROUND_Z_INDEX} eventMode="passive">
	<MainContainer standard alignVertical="bottom">
		{#if layoutType === 'landscape'}
			<Container
				x={mainLayoutStandard.width * 0.5}
				y={mainLayoutStandard.height - LANDSCAPE_BASE_SIZE - 40}
				pivot={anchorToPivot({
					anchor: { x: 0.5, y: 0 },
					sizes: {
						height: LANDSCAPE_BASE_SIZE,
						width: LANDSCAPE_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
					},
				})}
			>
				<Container y={LANDSCAPE_BASE_SIZE * 0.5} x={1400} scale={0.8}>
					<LabelBet stacked />
				</Container>
			</Container>

			<Container
				x={mainLayoutStandard.width - 318}
				y={mainLayoutStandard.height * 0.5 - 80}
				pivot={anchorToPivot({
					anchor: { x: 1, y: 0.5 },
					sizes: {
						height: LANDSCAPE_BASE_SIZE,
						width: LANDSCAPE_BASE_SIZE,
					},
				})}
			>
				<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 - 140} scale={0.8}>
					<ButtonDecrease anchor={0.5} />
				</Container>

				<Container x={LANDSCAPE_BASE_SIZE * 0.5} y={LANDSCAPE_BASE_SIZE * 0.5 + 140} scale={0.8}>
					<ButtonIncrease anchor={0.5} />
				</Container>
			</Container>
		{:else if layoutType === 'desktop'}
			<Container
				x={mainLayoutStandard.width * 0.5}
				y={mainLayoutStandard.height - DESKTOP_BASE_SIZE - 10}
				pivot={anchorToPivot({
					anchor: { x: 0.5, y: 0 },
					sizes: {
						height: DESKTOP_BASE_SIZE,
						width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
					},
				})}
			>
				<Container y={DESKTOP_BASE_SIZE * 0.5 - 160} x={900 + 500} scale={0.8}>
					<LabelBet stacked />
				</Container>

				<Container y={DESKTOP_BASE_SIZE * 0.5} x={1440} scale={0.8}>
					<ButtonDecrease anchor={0.5} />
				</Container>

				<Container y={DESKTOP_BASE_SIZE * 0.5} x={1440 + 150} scale={0.8}>
					<ButtonIncrease anchor={0.5} />
				</Container>
			</Container>
		{:else if layoutType === 'tablet'}
			<Container
				x={mainLayoutStandard.width * 0.5}
				y={mainLayoutStandard.height - DESKTOP_BASE_SIZE - 30}
				pivot={anchorToPivot({
					anchor: { x: 0.5, y: 0 },
					sizes: {
						height: DESKTOP_BASE_SIZE,
						width: DESKTOP_BACKGROUND_WIDTH_LIST.reduce((sum, width) => sum + width, 0),
					},
				})}
			>
				<Container y={DESKTOP_BASE_SIZE * 0.5 - 220} x={880 + 640}>
					<LabelBet stacked />
				</Container>

				<Container y={DESKTOP_BASE_SIZE * 0.5} x={1560}>
					<ButtonDecrease anchor={0.5} />
				</Container>

				<Container y={DESKTOP_BASE_SIZE * 0.5} x={1560 + 180}>
					<ButtonIncrease anchor={0.5} />
				</Container>
			</Container>
		{/if}
	</MainContainer>
	</Container>
{/if}
