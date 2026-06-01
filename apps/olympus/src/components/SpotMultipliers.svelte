<script lang="ts" module>

	export type SpotMultiplierEntry = {

		explosionCount: number;

		multiplier: number;

	};



	export type EmitterEventSpotMultipliers =

		| { type: 'spotMultipliersClear' }

		| { type: 'spotMultipliersSync'; spots: ({ reel: number; row: number } & SpotMultiplierEntry)[] };

</script>



<script lang="ts">

	import { onDestroy, onMount } from 'svelte';



	import { getContext } from '../game/context';

	import BoardContainer from './BoardContainer.svelte';

	import BoardMask from './BoardMask.svelte';

	import SpotMultiplierCell from './SpotMultiplierCell.svelte';



	const context = getContext();

	const FLASH_MS = 480;



	let spots = $state<Record<string, SpotMultiplierEntry>>({});

	let flashingKeys = $state<Set<string>>(new Set());

	let pulse = $state(0);

	const flashTimers = new Map<string, ReturnType<typeof setTimeout>>();



	const spotList = $derived(

		Object.entries(spots).map(([key, entry]) => {

			const [reel, row] = key.split(',').map(Number);

			return { key, reel, row, hitCount: entry.explosionCount, multiplier: entry.multiplier };

		}),

	);



	const triggerFlash = (key: string) => {

		const prev = flashTimers.get(key);

		if (prev) clearTimeout(prev);

		flashingKeys = new Set([...flashingKeys, key]);

		flashTimers.set(

			key,

			setTimeout(() => {

				flashTimers.delete(key);

				const next = new Set(flashingKeys);

				next.delete(key);

				flashingKeys = next;

			}, FLASH_MS),

		);

	};



	context.eventEmitter.subscribeOnMount({

		spotMultipliersClear: () => {

			spots = {};

			flashingKeys = new Set();

			for (const t of flashTimers.values()) clearTimeout(t);

			flashTimers.clear();

		},

		spotMultipliersSync: ({ spots: nextSpots }) => {

			const map: Record<string, SpotMultiplierEntry> = { ...spots };

			for (const spot of nextSpots) {

				const key = `${spot.reel},${spot.row}`;

				const prev = spots[key];

				if (prev && spot.multiplier > prev.multiplier) triggerFlash(key);

				map[key] = {

					explosionCount: spot.explosionCount,

					multiplier: spot.multiplier,

				};

			}

			spots = map;

		},

	});



	onMount(() => {

		let raf = 0;

		const start = performance.now();

		const tick = (now: number) => {

			pulse = ((now - start) % 1600) / 1600;

			raf = requestAnimationFrame(tick);

		};

		raf = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(raf);

	});



	onDestroy(() => {

		for (const t of flashTimers.values()) clearTimeout(t);

		flashTimers.clear();

	});

</script>



<!-- Background layer: sits behind symbols in the same board coordinate space. -->

<BoardContainer>

	<BoardMask />

	{#each spotList as spot (spot.key)}

		<SpotMultiplierCell

			reel={spot.reel}

			row={spot.row}

			hitCount={spot.hitCount}

			multiplier={spot.multiplier}

			flashing={flashingKeys.has(spot.key)}

			{pulse}

		/>

	{/each}

</BoardContainer>

