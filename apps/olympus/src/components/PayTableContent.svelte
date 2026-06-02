<script lang="ts">
	const SYMBOLS_BASE = '/assets/sprites/thor';

	const highSymbols = [
		{ key: 'h1', label: 'Zeus', payouts: { '8-9': 5, '10-11': 12.5, '12-14': 25, '15-19': 62.5, '20-29': 125, '30+': 1250 } },
		{ key: 'h2', label: 'Athena', payouts: { '8-9': 4, '10-11': 10, '12-14': 20, '15-19': 50, '20-29': 100, '30+': 1000 } },
		{ key: 'h3', label: 'Poseidon', payouts: { '8-9': 2.5, '10-11': 6, '12-14': 12.5, '15-19': 37.5, '20-29': 75, '30+': 750 } },
		{ key: 'h4', label: 'Hades', payouts: { '8-9': 1.5, '10-11': 4, '12-14': 7.5, '15-19': 25, '20-29': 50, '30+': 500 } },
	];

	const lowSymbols = [
		{ key: 'l1', label: 'Medusa', payouts: { '8-9': 1, '10-11': 2.5, '12-14': 5, '15-19': 12.5, '20-29': 25, '30+': 250 } },
		{ key: 'l2', label: 'Pegasus', payouts: { '8-9': 0.75, '10-11': 2, '12-14': 4, '15-19': 10, '20-29': 20, '30+': 200 } },
		{ key: 'l3', label: 'Minotaur', payouts: { '8-9': 0.5, '10-11': 1.5, '12-14': 3, '15-19': 7.5, '20-29': 15, '30+': 150 } },
		{ key: 'l4', label: 'Lyre', payouts: { '8-9': 0.25, '10-11': 1, '12-14': 2, '15-19': 5, '20-29': 10, '30+': 100 } },
	];

	const clusterRanges = ['8-9', '10-11', '12-14', '15-19', '20-29', '30+'] as const;
</script>

<div class="pay-table">
	<h2>PAYTABLE</h2>
	<p class="intro">
		Wins are paid for clusters of <strong>8 or more</strong> matching symbols connected horizontally
		or vertically anywhere on the 6×5 grid. Payouts are multiples of the total bet.
	</p>

	<h3>High-paying symbols</h3>
	<div class="grid">
		{#each highSymbols as sym (sym.key)}
			<div class="row">
				<img src={`${SYMBOLS_BASE}/sym_${sym.key}.webp`} alt={sym.label} />
				<div class="name">{sym.label}</div>
				<div class="payouts">
					{#each clusterRanges as range}
						<div class="cell">
							<span class="range">{range}</span>
							<span class="value">×{sym.payouts[range]}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<h3>Low-paying symbols</h3>
	<div class="grid">
		{#each lowSymbols as sym (sym.key)}
			<div class="row">
				<img src={`${SYMBOLS_BASE}/sym_${sym.key}.webp`} alt={sym.label} />
				<div class="name">{sym.label}</div>
				<div class="payouts">
					{#each clusterRanges as range}
						<div class="cell">
							<span class="range">{range}</span>
							<span class="value">×{sym.payouts[range]}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<h3>Special symbols</h3>
	<div class="special">
		<div class="special-item">
			<img src={`${SYMBOLS_BASE}/sym_s.webp`} alt="Scatter" />
			<div>
				<strong>Scatter</strong> — Land <strong>4 or more</strong> Scatter symbols anywhere on
				the grid to trigger the FREE SPINS round:
				<ul>
					<li>4 Scatters → 15 Free Spins</li>
					<li>5 Scatters → 20 Free Spins</li>
					<li>6 Scatters → 25 Free Spins</li>
				</ul>
				During FREE SPINS, landing 3+ additional Scatters retriggers more spins.
			</div>
		</div>
		<div class="special-item">
			<img src={`${SYMBOLS_BASE}/sym_m.webp`} alt="Multiplier" />
			<div>
				<strong>Multiplier</strong> — Appears during the FREE SPINS round with values from
				<strong>×2 to ×500</strong>. Every multiplier symbol that lands while there is at least
				one winning cluster adds its value to a Global Multiplier that is applied to the total
				win at the end of the spin.
			</div>
		</div>
	</div>
</div>

<style lang="scss">
	.pay-table {
		color: #ffe27a;
		font-family: 'proxima-nova', serif;
		max-width: 760px;
		padding: 0.5rem 1rem 1.5rem;

		h2 {
			text-align: center;
			margin: 0 0 0.75rem;
			letter-spacing: 0.15em;
			color: #ffefb0;
		}

		h3 {
			margin: 1.25rem 0 0.5rem;
			letter-spacing: 0.1em;
			color: #ffd86b;
			border-bottom: 1px solid rgba(255, 216, 107, 0.35);
			padding-bottom: 0.25rem;
		}

		.intro {
			color: #f5e7c0;
			line-height: 1.4;
			margin: 0 0 1rem;
		}

		.grid {
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		}

		.row {
			display: grid;
			grid-template-columns: 56px 90px 1fr;
			align-items: center;
			gap: 0.75rem;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 216, 107, 0.18);
			border-radius: 8px;
			padding: 0.4rem 0.6rem;

			img {
				width: 48px;
				height: 48px;
				object-fit: contain;
			}

			.name {
				font-weight: 700;
				color: #fff5d4;
			}

			.payouts {
				display: grid;
				grid-template-columns: repeat(6, 1fr);
				gap: 0.3rem;
			}

			.cell {
				display: flex;
				flex-direction: column;
				align-items: center;
				background: rgba(0, 0, 0, 0.35);
				border-radius: 4px;
				padding: 0.2rem 0.1rem;
				font-size: 0.8rem;

				.range {
					color: #c9b27c;
					font-size: 0.7rem;
				}

				.value {
					color: #ffefb0;
					font-weight: 700;
				}
			}
		}

		.special {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.special-item {
			display: grid;
			grid-template-columns: 64px 1fr;
			align-items: flex-start;
			gap: 0.75rem;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 216, 107, 0.18);
			border-radius: 8px;
			padding: 0.5rem 0.6rem;
			color: #f5e7c0;
			line-height: 1.4;

			img {
				width: 56px;
				height: 56px;
				object-fit: contain;
			}

			ul {
				margin: 0.35rem 0 0;
				padding-left: 1.1rem;
			}
		}

		@media (max-width: 640px) {
			.row {
				grid-template-columns: 48px 1fr;
				.name {
					grid-column: 2;
				}
				.payouts {
					grid-column: 1 / -1;
					grid-template-columns: repeat(3, 1fr);
				}
			}
		}
	}
</style>
