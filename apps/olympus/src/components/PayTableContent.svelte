<script lang="ts">
	import config from '../game/config';
	import {
		baseRtpLabel,
		bonusRtpLabel,
		buyBonusCostMultiplier,
		formatUsd,
		gameDisplayName,
		maxWinMultiplier,
	} from '../game/gameInfoFormat';
	import { SYMBOL_LABELS, UI_SYMBOL_LABELS, formatSymbolLabel, symbolAssetPath } from '../game/symbolLabels';
	import type { SymbolName } from '../game/types';
	import { stateUrlDerived } from 'state-shared';

	const social = $derived(stateUrlDerived.social());
	const buyFeatureLabel = $derived(social ? 'Play Free Spins' : 'Buy Free Spins');
	const amountLabel = $derived(social ? 'play amount' : 'bet amount');

	const PAYING_SYMBOLS: SymbolName[] = ['H1', 'H2', 'H3', 'H4', 'L1', 'L2', 'L3'];

	const SYMBOL_TIERS: Record<SymbolName, string> = {
		H1: 'HIGHEST',
		H2: 'HIGH',
		H3: 'HIGH',
		H4: 'MEDIUM',
		L1: 'MEDIUM',
		L2: 'LOW',
		L3: 'LOWEST',
		S: 'SCATTER',
	};

	type PaytableTier = { size: number; sizeLabel: string; multiplier: number };

	const parsePaytable = (symbolKey: SymbolName): PaytableTier[] =>
		config.symbols[symbolKey].paytable
			.map((entry) => {
				const size = Number(Object.keys(entry)[0]);
				const multiplier = Number(Object.values(entry)[0]);
				return {
					size,
					sizeLabel: size === 15 ? '15+' : String(size),
					multiplier,
				};
			})
			.reverse();

	const formatMultiplier = (value: number) =>
		Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');

	const freeSpinRows = Object.entries(config.freeSpins.awarded).map(([count, spins]) => ({
		count: Number(count),
		spins,
		label: String(count),
	}));

	const MULTIPLIER_ICON = '/assets/sprites/menuBar/multi_icon.png';
</script>

<div class="pay-table">
	<h2>SYMBOLS &amp; PAYTABLE</h2>
	<p class="intro">
		All symbols pay in blocks of <strong>minimum 5 symbols</strong> connected horizontally or
		vertically on a <strong>7×7</strong> grid. All wins are multiplied by the current {social ? 'play amount' : 'bet amount'}.
	</p>

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
						<span class="symbol-tier">{SYMBOL_TIERS[symbolKey]}</span>
						<strong class="symbol-name">{SYMBOL_LABELS[symbolKey].en}</strong>
					</div>
				</header>

				<div class="tier-grid">
					{#each tiers as tier (`${symbolKey}-${tier.size}`)}
						<div class="tier">
							<span class="tier-size">{tier.sizeLabel}</span>
							<span class="tier-value">{formatMultiplier(tier.multiplier)}x</span>
						</div>
					{/each}
				</div>
			</article>
		{/each}
	</div>

	<h3>VINAR (SCATTER)</h3>

	<div class="special-list">
		<article class="special-card">
			<header class="symbol-head">
				<img
					class="symbol-img scatter-img"
					src={symbolAssetPath('S')}
					alt={formatSymbolLabel('S', false)}
				/>
				<div class="symbol-meta">
					<span class="symbol-tier">SCATTER</span>
					<strong class="symbol-name">{SYMBOL_LABELS.S.en}</strong>
				</div>
			</header>
			<p class="special-note">
				This is the <strong>SCATTER</strong> symbol. The SCATTER symbol appears on all reels.
				<strong>SCATTER pays on any position</strong> and does not form cluster wins.
			</p>
			<div class="tier-grid scatter-grid">
				{#each freeSpinRows as row (`scatter-${row.count}`)}
					<div class="tier">
						<span class="tier-size">{row.label} Scatter</span>
						<span class="tier-value">{row.spins} Free Spins</span>
					</div>
				{/each}
			</div>
			<p class="special-note">
				Hitting 3, 4, 5, 6 or 7 Scatter during free spins awards the same number of
				<strong>additional</strong> free spins shown above. Retriggers use the same award table as the
				initial trigger.
			</p>
		</article>

		<article class="special-card">
			<header class="symbol-head">
				<img class="symbol-img multiplier-img" src={MULTIPLIER_ICON} alt="Spot multiplier" />
				<div class="symbol-meta">
					<span class="symbol-tier">MULTIPLIER SPOT</span>
					<strong class="symbol-name">{UI_SYMBOL_LABELS.M.en}</strong>
				</div>
			</header>
			<p class="special-note">
				Not a grid symbol. Marked spots can carry multipliers from
				<strong>×{config.spotMultipliers.startMultiplier}</strong> up to
				<strong>×{config.spotMultipliers.maxMultiplier}</strong>, doubling each time a winning
				symbol explodes on the same cell again.
			</p>
		</article>
	</div>

	<section class="game-info">
		<h3>GAME INFORMATION</h3>
		<table class="info-table">
			<tbody>
				<tr><td>Game</td><td>{gameDisplayName}</td></tr>
				<tr><td>Grid</td><td>{config.gameInfo.gridLabel}</td></tr>
				<tr><td>Win type</td><td>Cluster pays — minimum {config.gameInfo.minClusterSize} connected symbols</td></tr>
				<tr><td>Features</td><td>Tumble cascades, spot multipliers (×2–×{config.spotMultipliers.maxMultiplier}), Vendemmia Free Spins</td></tr>
				<tr><td>Base game cost</td><td>1× {amountLabel}</td></tr>
				<tr><td>{buyFeatureLabel}</td><td>{buyBonusCostMultiplier}× {amountLabel} — instant free spins entry</td></tr>
				<tr><td>Theoretical RTP (base)</td><td>{baseRtpLabel}</td></tr>
				<tr><td>Theoretical RTP ({buyFeatureLabel})</td><td>{bonusRtpLabel}</td></tr>
				<tr><td>Volatility</td><td>{config.gameInfo.volatility}</td></tr>
				<tr><td>Minimum {social ? 'play' : 'bet'}</td><td>{formatUsd(config.gameInfo.betLimitsUsd.min)}</td></tr>
				<tr><td>Maximum {social ? 'play' : 'bet'}</td><td>{formatUsd(config.gameInfo.betLimitsUsd.max)}</td></tr>
				<tr><td>Maximum win</td><td>{maxWinMultiplier.toLocaleString()}× total {amountLabel} per round</td></tr>
			</tbody>
		</table>
		<p class="info-footer">
			All paytable values are multiples of the base {amountLabel}. Wins from multiple clusters in the same
			tumble are added together. Malfunction voids all pays and plays.
		</p>
	</section>
</div>

<style lang="scss">
	.pay-table {
		color: var(--th-cream, #f5e7c0);
		font-family: system-ui, -apple-system, 'Segoe UI', Georgia, serif;
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
			text-transform: uppercase;
		}

		.intro {
			color: var(--th-cream-muted, #e8d9a8);
			line-height: 1.45;
			margin: 0 0 1rem;
			font-size: 0.92rem;
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

		.multiplier-img {
			width: 72px;
			height: 72px;
		}

		.symbol-meta {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;
			min-width: 0;
		}

		.symbol-tier {
			font-size: 0.72rem;
			font-weight: 800;
			letter-spacing: 0.1em;
			color: var(--th-gold-heading, #ffd86b);
		}

		.symbol-name {
			font-size: 0.95rem;
			font-weight: 700;
			color: var(--th-cream, #f5e7c0);
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

		.game-info {
			margin-top: 1.25rem;
		}

		.info-table {
			width: 100%;
			border-collapse: collapse;
			margin: 0.5rem 0 0.75rem;
			font-size: 0.86rem;

			td {
				border: 1px solid var(--th-border, rgba(212, 175, 55, 0.35));
				padding: 0.35rem 0.5rem;
				vertical-align: top;
			}

			td:first-child {
				width: 44%;
				color: var(--th-cream, #f5e7c0);
				font-weight: 600;
				background: var(--th-card-bg, rgba(0, 0, 0, 0.28));
			}

			td:last-child {
				color: var(--th-cream-muted, #e8d9a8);
			}
		}

		.info-footer {
			margin: 0;
			color: var(--th-brown, #8b5a2b);
			font-size: 0.82rem;
			line-height: 1.45;
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
