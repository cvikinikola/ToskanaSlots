<script lang="ts">
	import config from '../game/config';
	import {
		SYMBOL_LABELS,
		UI_SYMBOL_LABELS,
		formatSymbolLabel,
		symbolAssetPath,
	} from '../game/symbolLabels';
	import type { SymbolName } from '../game/types';

	const PAYING_SYMBOLS: SymbolName[] = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3'];

	type PaytableTier = { size: number; sizeLabel: string; multiplier: number };

	const parsePaytable = (symbolKey: SymbolName): PaytableTier[] =>
		config.symbols[symbolKey].paytable.map((entry) => {
			const size = Number(Object.keys(entry)[0]);
			const multiplier = Number(Object.values(entry)[0]);
			return {
				size,
				sizeLabel: size === 15 ? '15+' : String(size),
				multiplier,
			};
		});

	const formatMultiplier = (value: number) =>
		Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');

	const freeSpinRows = Object.entries(config.freeSpins.awarded).map(([count, spins]) => ({
		count: Number(count),
		spins,
		label: Number(count) >= 7 ? `${count}+` : count,
	}));
</script>

<div class="pay-table">
	<h2>PAYTABLE / ISPLATNA TABELA</h2>
	<p class="intro">
		Dobitak za klaster od <strong>5 ili više</strong> istih simbola povezanih horizontalno ili
		vertikalno na mreži 7×7. Vrednosti su množilac ukupnog uloga (<strong>× bet</strong>).
	</p>

	<div class="legend">
		<span>Klastar</span>
		<span>Isplata</span>
	</div>

	<div class="symbol-list">
		{#each PAYING_SYMBOLS as symbolKey (symbolKey)}
			{@const tiers = parsePaytable(symbolKey)}
			<article class="symbol-card">
				<header class="symbol-head">
					<img
						class="symbol-img"
						src={symbolAssetPath(symbolKey)}
						alt={formatSymbolLabel(symbolKey, false)}
					/>
					<div class="symbol-meta">
						<strong class="symbol-code">{symbolKey}</strong>
						<span class="symbol-name">{SYMBOL_LABELS[symbolKey].en}</span>
						<span class="symbol-name-sr">{SYMBOL_LABELS[symbolKey].sr}</span>
						<span class="asset-key">{SYMBOL_LABELS[symbolKey].assetKey}</span>
					</div>
				</header>

				<div class="tier-grid">
					{#each tiers as tier (`${symbolKey}-${tier.size}`)}
						<div class="tier">
							<span class="tier-size">{tier.sizeLabel}</span>
							<span class="tier-value">×{formatMultiplier(tier.multiplier)}</span>
						</div>
					{/each}
				</div>
			</article>
		{/each}
	</div>

	<h3>Specijalni simboli</h3>

	<div class="special-list">
		<article class="special-card">
			<header class="symbol-head">
				<img
					class="symbol-img scatter-img"
					src={symbolAssetPath('S')}
					alt={formatSymbolLabel('S', false)}
				/>
				<div class="symbol-meta">
					<strong class="symbol-code">S</strong>
					<span class="symbol-name">{SYMBOL_LABELS.S.en}</span>
					<span class="symbol-name-sr">{SYMBOL_LABELS.S.sr} (scatter)</span>
					<span class="asset-key">{SYMBOL_LABELS.S.assetKey}</span>
				</div>
			</header>
			<p class="special-note">Nema cluster isplate — pokreće free spinove kad padne bilo gde na gridu.</p>
			<div class="tier-grid scatter-grid">
				{#each freeSpinRows as row (`scatter-${row.count}`)}
					<div class="tier">
						<span class="tier-size">{row.label}×</span>
						<span class="tier-value">{row.spins} FS</span>
					</div>
				{/each}
			</div>
		</article>

		<article class="special-card">
			<header class="symbol-head">
				<img
					class="symbol-img"
					src={`/assets/sprites/thor/${UI_SYMBOL_LABELS.M.assetFile}`}
					alt={UI_SYMBOL_LABELS.M.en}
				/>
				<div class="symbol-meta">
					<strong class="symbol-code">M</strong>
					<span class="symbol-name">{UI_SYMBOL_LABELS.M.en}</span>
					<span class="symbol-name-sr">{UI_SYMBOL_LABELS.M.sr} (samo UI)</span>
					<span class="asset-key">{UI_SYMBOL_LABELS.M.assetKey}</span>
				</div>
			</header>
			<p class="special-note">
				Ne pada na grid. Spot množitelji na poljima (×{config.spotMultipliers.startMultiplier} do
				×{config.spotMultipliers.maxMultiplier}) množe dobitak klastera na toj ćeliji.
			</p>
		</article>
	</div>
</div>

<style lang="scss">
	.pay-table {
		color: var(--th-cream, #f5e7c0);
		font-family: 'proxima-nova', Georgia, serif;
		max-width: 720px;
		padding: 0.25rem 0.5rem 1rem;

		h2 {
			text-align: center;
			margin: 0 0 0.75rem;
			letter-spacing: 0.12em;
			color: var(--th-gold-text, #ffefb0);
			font-size: 1.15rem;
			text-transform: uppercase;
		}

		h3 {
			margin: 1.5rem 0 0.65rem;
			letter-spacing: 0.1em;
			color: var(--th-gold-heading, #ffd86b);
			border-bottom: 1px solid var(--th-border-strong, rgba(212, 175, 55, 0.55));
			padding-bottom: 0.25rem;
			font-size: 0.95rem;
		}

		.intro {
			color: var(--th-cream-muted, #e8d9a8);
			line-height: 1.45;
			margin: 0 0 1rem;
			font-size: 0.92rem;
		}

		.legend {
			display: none;
		}

		.symbol-list,
		.special-list {
			display: flex;
			flex-direction: column;
			gap: 0.65rem;
		}

		.symbol-card,
		.special-card {
			background: var(--th-card-bg, rgba(0, 0, 0, 0.28));
			border: 1px solid var(--th-border, rgba(212, 175, 55, 0.35));
			border-radius: 10px;
			padding: 0.65rem 0.75rem;
			box-shadow: inset 0 1px 0 rgba(255, 231, 154, 0.08);
		}

		.symbol-head {
			display: flex;
			align-items: center;
			gap: 0.85rem;
			margin-bottom: 0.55rem;
		}

		.symbol-img {
			width: 72px;
			height: 72px;
			object-fit: contain;
			flex-shrink: 0;
			filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.45));
		}

		.scatter-img {
			width: auto;
			height: 96px;
			max-width: 76px;
		}

		.symbol-meta {
			display: flex;
			flex-direction: column;
			gap: 0.12rem;
			min-width: 0;
		}

		.symbol-code {
			font-size: 1rem;
			color: var(--th-gold-text, #ffefb0);
			letter-spacing: 0.08em;
		}

		.symbol-name {
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--th-cream, #f5e7c0);
		}

		.symbol-name-sr {
			font-size: 0.85rem;
			color: var(--th-cream-muted, #e8d9a8);
		}

		.asset-key {
			font-size: 0.72rem;
			color: var(--th-brown, #8b5a2b);
			font-family: monospace;
		}

		.tier-grid {
			display: grid;
			grid-template-columns: repeat(6, 1fr);
			gap: 0.35rem;
		}

		.scatter-grid {
			grid-template-columns: repeat(5, 1fr);
		}

		.tier {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			background: rgba(0, 0, 0, 0.35);
			border: 1px solid var(--th-border, rgba(212, 175, 55, 0.35));
			border-radius: 6px;
			padding: 0.28rem 0.15rem;
			min-height: 2.6rem;
		}

		.tier-size {
			font-size: 0.72rem;
			color: var(--th-cream-muted, #e8d9a8);
			line-height: 1.2;
		}

		.tier-value {
			font-size: 0.82rem;
			font-weight: 800;
			color: var(--th-gold-text, #ffefb0);
			line-height: 1.2;
		}

		.special-note {
			margin: 0 0 0.55rem;
			color: var(--th-cream-muted, #e8d9a8);
			font-size: 0.86rem;
			line-height: 1.4;
		}

		strong {
			color: var(--th-gold-text, #ffefb0);
		}

		@media (max-width: 640px) {
			.tier-grid {
				grid-template-columns: repeat(4, 1fr);
			}

			.scatter-grid {
				grid-template-columns: repeat(3, 1fr);
			}

			.symbol-img {
				width: 56px;
				height: 56px;
			}
		}
	}
</style>
