<script lang="ts" module>
	export type SpotMultiplierEntry = {
		reel: number;
		row: number;
		explosionCount: number;
		multiplier: number;
	};

	export type EmitterEventSpotMultipliers =
		| { type: 'spotMultiplierUpdate'; spots: SpotMultiplierEntry[] }
		| { type: 'spotMultipliersClear' };
</script>

<script lang="ts">
	import { Container, Graphics, BitmapText } from 'pixi-svelte';

	import BoardContainer from './BoardContainer.svelte';
	import { getContext } from '../game/context';
	import { REEL_STEP_X, REEL_STEP_Y } from '../game/constants';
	import { getSymbolX, getSymbolY } from '../game/utils';

	const context = getContext();

	let spots = $state<SpotMultiplierEntry[]>([]);

	const cellW = REEL_STEP_X * 0.92;
	const cellH = REEL_STEP_Y * 0.92;

	context.eventEmitter.subscribeOnMount({
		// Spots belong to grid positions — update from math, never cleared by tumble/refill.
		spotMultiplierUpdate: (emitterEvent) => {
			spots = emitterEvent.spots;
		},
		spotMultipliersClear: () => {
			spots = [];
		},
	});
</script>

<!--
	Position-anchored overlay (Sugar Rush style). Spots stay on (reel, row) while
	symbols tumble/refill underneath — they are NOT tied to symbol instances.
-->
<BoardContainer>
	{#each spots as spot (spot.reel + ',' + spot.row)}
		{#if spot.explosionCount > 0}
			{@const hasValue = spot.multiplier >= 2}
			<Container x={getSymbolX(spot.reel)} y={getSymbolY(spot.row)}>
				<Graphics
					draw={(g) => {
						g.clear();
						// Level 1 (GOLD, no number): soft gold-filled tile.
						// Level 2+ (×N): brighter amber fill + bold gold frame.
						g.roundRect(-cellW / 2, -cellH / 2, cellW, cellH, 10);
						g.fill({
							color: hasValue ? 0xffb300 : 0xffd147,
							alpha: hasValue ? 0.42 : 0.26,
						});
						g.roundRect(-cellW / 2, -cellH / 2, cellW, cellH, 10);
						g.stroke({
							color: hasValue ? 0xffe066 : 0xffd147,
							width: hasValue ? 4 : 3,
							alpha: hasValue ? 1 : 0.8,
						});
					}}
				/>
				{#if hasValue}
					<BitmapText
						anchor={{ x: 0.5, y: 0.5 }}
						text={`×${spot.multiplier}`}
						style={{
							fontFamily: 'proxima-nova',
							fontSize: REEL_STEP_Y * 0.4,
							fill: 0xfff14d,
							fontWeight: '900',
							stroke: { color: 0xb1370a, width: 5 },
						}}
					/>
				{/if}
			</Container>
		{/if}
	{/each}
</BoardContainer>
