<script lang="ts" module>
	export type EmitterEventWinSparks = {
		type: 'winSparksBurst';
		x: number;
		y: number;
		intensity?: number;
	};
</script>

<script lang="ts">
	import { Container, Graphics } from 'pixi-svelte';

	import { getContext } from '../game/context';
	import { getSymbolX, getSymbolY } from '../game/utils';
	import BoardContainer from './BoardContainer.svelte';

	const context = getContext();

	type Spark = {
		id: number;
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		size: number;
		hue: 'gold' | 'cyan';
	};

	const SPARK_COLORS = {
		gold: 0xffd147,
		cyan: 0x7df0ff,
	};

	let sparks = $state<Spark[]>([]);
	let nextId = 0;

	function burst(cx: number, cy: number, intensity = 1) {
		const count = Math.round(28 * intensity);
		const fresh: Spark[] = [];
		for (let i = 0; i < count; i++) {
			const a = Math.random() * Math.PI * 2;
			const speed = 2 + Math.random() * 6 * intensity;
			fresh.push({
				id: nextId++,
				x: cx,
				y: cy,
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed - 2 * intensity,
				life: 1,
				size: 2 + Math.random() * 4,
				hue: Math.random() < 0.5 ? 'gold' : 'cyan',
			});
		}
		sparks = [...sparks, ...fresh];
	}

	/** Board-native coordinates — same space as symbols inside BoardContainer. */
	function positionToBoardCoords(reel: number, row: number) {
		return {
			x: getSymbolX(reel),
			y: getSymbolY(row),
		};
	}

	context.eventEmitter.subscribeOnMount({
		winSparksBurst: (e) => burst(e.x, e.y, e.intensity ?? 1),

		tumbleBoardExplode: ({ explodingPositions }) => {
			for (const p of explodingPositions) {
				const { x, y } = positionToBoardCoords(p.reel, p.row);
				burst(x, y, 1);
			}
		},
	});

	$effect(() => {
		let raf = 0;
		let last = performance.now();
		const tick = (t: number) => {
			const dt = Math.min(0.05, (t - last) / 1000);
			last = t;
			if (sparks.length) {
				sparks = sparks
					.map((s) => ({
						...s,
						x: s.x + s.vx,
						y: s.y + s.vy,
						vy: s.vy + 18 * dt,
						vx: s.vx * 0.985,
						life: s.life - dt * 1.4,
					}))
					.filter((s) => s.life > 0);
			}
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<BoardContainer>
	<Container zIndex={50}>
		{#each sparks as s (s.id)}
			<Graphics
				draw={(g) => {
					g.clear();
					const col = SPARK_COLORS[s.hue];
					const a = Math.max(0, Math.min(1, s.life));
					g.circle(s.x, s.y, s.size * 2.4);
					g.fill({ color: col, alpha: a * 0.18 });
					g.circle(s.x, s.y, s.size);
					g.fill({ color: col, alpha: a });
					g.circle(s.x, s.y, s.size * 0.45);
					g.fill({ color: 0xffffff, alpha: a });
				}}
			/>
		{/each}
	</Container>
</BoardContainer>
