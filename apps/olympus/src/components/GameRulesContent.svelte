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
	import { stateUrlDerived } from 'state-shared';

	const social = $derived(stateUrlDerived.social());
	const buyFeatureLabel = $derived(social ? 'Play Free Spins' : 'Buy Free Spins');
	const amountLabel = $derived(social ? 'play amount' : 'bet');
	const minBetLabel = $derived(formatUsd(config.gameInfo.betLimitsUsd.min));
	const maxBetLabel = $derived(formatUsd(config.gameInfo.betLimitsUsd.max));
</script>

<div class="game-rules">
	<h2>{gameDisplayName.toUpperCase()} — GAME RULES</h2>

	<p class="lead">
		All symbols pay in blocks of minimum <strong>5 symbols</strong> connected horizontally or
		vertically. The game is played on a <strong>7×7 grid</strong> of symbols (49 positions).
	</p>

	<section>
		<h3>Tumble Feature</h3>
		<p>
			After every spin, winning combinations are paid and all winning symbols disappear. The
			remaining symbols fall to the bottom of the screen and empty positions are replaced with new
			symbols from above.
		</p>
		<p>
			Tumbling continues until no more winning combinations appear. There is no limit to the number
			of possible tumbles. All wins are added to the player {social ? 'coin balance' : 'balance'} after all tumbles from a base
			spin have been completed.
		</p>
	</section>

	<section>
		<h3>Multiplier Spots Feature</h3>
		<p>
			Whenever a winning symbol explodes it marks its spot on the grid. After the
			<strong>second</strong> time a symbol explodes on the same spot, a multiplier is added to that
			spot.
		</p>
		<ul>
			<li>Starting multiplier: <strong>×{config.spotMultipliers.startMultiplier}</strong></li>
			<li>
				The multiplier doubles every time one more symbol explodes on top of the same spot
			</li>
			<li>
				Maximum multiplier per spot:
				<strong>×{config.spotMultipliers.maxMultiplier}</strong>
			</li>
		</ul>
		<p class="progression">
			Multiplier progression: ×2 → ×4 → ×8 → ×16 → ×32 → ×64 → ×128 → ×256 → ×512 → ×1024
		</p>
		<p>
			The multiplier applies to all winning combinations that hit on top of it. If more multipliers
			are involved in the same winning combination, they <strong>add</strong> to each other.
		</p>
		<p>
			<strong>Base game:</strong> all marked spots last until the end of the tumbling sequence, then
			they are cleared.<br />
			<strong>Free spins:</strong> marked spots and multipliers remain for the entire round and keep
			growing.
		</p>
	</section>

	<section>
		<h3>Vendemmia Free Spins</h3>
		<ul>
			<li>3 Vinar (Scatter) = <strong>10 Free Spins</strong></li>
			<li>4 Vinar (Scatter) = <strong>12 Free Spins</strong></li>
			<li>5 Vinar (Scatter) = <strong>15 Free Spins</strong></li>
			<li>6 Vinar (Scatter) = <strong>20 Free Spins</strong></li>
			<li>7 Vinar (Scatter) = <strong>30 Free Spins</strong></li>
		</ul>
		<p>
			During free spins, marked spots and multipliers <strong>remain in place</strong> until the end
			of the round. Multipliers keep growing with each tumble across all free spins.
		</p>
		<p>
			Hitting 3, 4, 5, 6 or 7 Scatter during the round awards 10, 12, 15, 20 or 30
			<strong>additional</strong> free spins. Special reels are in play during the free spins
			feature.
		</p>
	</section>

	<section>
		<h3>Max Win</h3>
		<p>
			The maximum win is limited to <strong>{maxWinMultiplier.toLocaleString()}× {amountLabel}</strong> in both the base game and free
			spins. If the total win of a free spins round reaches {maxWinMultiplier.toLocaleString()}× {amountLabel}, the round immediately
			ends, the win is awarded and all remaining free spins are forfeited.
		</p>
	</section>

	<section>
		<h3>{buyFeatureLabel}</h3>
		<p>
			Where permitted by jurisdiction, {social ? 'use' : 'pay'} <strong>{buyBonusCostMultiplier}× total {amountLabel}</strong> to trigger the
			Vendemmia Free Spins feature. On the triggering spin, 3, 4, 5, 6 or 7 Scatter symbols can
			land randomly. Theoretical RTP for this entry mode is <strong>{bonusRtpLabel}</strong>.
		</p>
	</section>

	<section>
		<h3>General Game Rules</h3>
		<p class="volatility">
			<strong>High volatility</strong> — pays out less often on average but the chance to hit big
			wins is higher.
		</p>
		<table class="rules-table">
			<thead>
				<tr>
					<th>Rule</th>
					<th>Value</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>Game</td><td>{gameDisplayName}</td></tr>
				<tr><td>Grid size</td><td>{config.gameInfo.gridLabel}</td></tr>
				<tr><td>Minimum cluster for win</td><td>{config.gameInfo.minClusterSize} or more connected same symbols</td></tr>
				<tr><td>Connection</td><td>Horizontal or vertical</td></tr>
				<tr><td>Base game {amountLabel} cost</td><td>1× {amountLabel}</td></tr>
				<tr><td>{buyFeatureLabel} cost</td><td>{buyBonusCostMultiplier}× {amountLabel}</td></tr>
				<tr><td>Volatility</td><td>{config.gameInfo.volatility}</td></tr>
				<tr><td>Theoretical RTP (base game)</td><td>{baseRtpLabel}</td></tr>
				<tr><td>Theoretical RTP ({buyFeatureLabel})</td><td>{bonusRtpLabel}</td></tr>
				<tr><td>Minimum {social ? 'play' : 'bet'}</td><td>{minBetLabel}</td></tr>
				<tr><td>Maximum {social ? 'play' : 'bet'}</td><td>{maxBetLabel}</td></tr>
				<tr><td>Maximum win</td><td>{maxWinMultiplier.toLocaleString()}× total {amountLabel}</td></tr>
				<tr><td>Malfunction</td><td>Voids all pays and plays</td></tr>
			</tbody>
		</table>
		<ul>
			<li>Only the highest win is paid per winning combination.</li>
			<li>When winning with multiple blocks, all wins are added to the total win.</li>
			<li>Free spins and bonus wins are added to the payline win.</li>
			<li>All wins are multiplied by base {social ? 'play amount' : 'bet'}.</li>
			<li>Free spins total win in the history contains the whole win of the cycle.</li>
			<li>
				<strong>SPACE</strong> and <strong>ENTER</strong> on the keyboard can be used to start and
				stop the spin.
			</li>
		</ul>
	</section>

	<section>
		<h3>How To Play — Controls</h3>
		<table class="rules-table">
			<thead>
				<tr>
					<th>Button</th>
					<th>Function</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>SPIN / STOP</td><td>Starts a spin when idle. During a spin, changes to STOP to end animations early (where allowed).</td></tr>
				<tr><td>+ and −</td><td>Increase or decrease {social ? 'play amount' : 'bet'} to the next available level.</td></tr>
				<tr><td>{social ? 'PLAY display' : 'BET display'}</td><td>Current {social ? 'play amount' : 'bet'} and total cost — click to open the {social ? 'play amount' : 'bet'} menu and pick a level; click again to switch coins/cash display.</td></tr>
				<tr><td>{social ? 'COINS display' : 'CREDIT display'}</td><td>Current balance — click to switch coins/cash display.</td></tr>
				<tr><td>WIN display</td><td>Win from the current spin or feature round.</td></tr>
				<tr><td>{social ? 'PLAY FREE SPINS' : 'BUY FREE SPINS'}</td><td>Opens a confirmation screen for {buyBonusCostMultiplier}× {amountLabel} Vendemmia Free Spins (RTP {bonusRtpLabel}). Confirm before the feature starts.</td></tr>
				<tr><td>CONFIRM</td><td>In the buy-feature dialog, accepts the shown cost and starts the purchase.</td></tr>
				<tr><td>AUTOPLAY</td><td>Opens the autoplay menu — choose number of rounds, optional loss/win limits, then Start Autoplay.</td></tr>
				<tr><td>MENU</td><td>Opens the side menu with paytable, settings, game rules, and sound controls.</td></tr>
				<tr><td>PAYTABLE</td><td>Opens symbol payouts, scatter awards, and game information (from the menu).</td></tr>
				<tr><td>SETTINGS</td><td>Opens master, music, and sound-effect volume controls (from the menu).</td></tr>
				<tr><td>GAME RULES / INFO</td><td>Opens this rules and feature guide (from the menu).</td></tr>
				<tr><td>SOUND</td><td>Toggles game sound on or off (from the menu).</td></tr>
				<tr><td>CLOSE MENU</td><td>Closes the menu and returns to the game.</td></tr>
				<tr><td>DRAWER (portrait)</td><td>On portrait layouts, expands or hides the bottom bar with spin, menu, turbo, and balance controls.</td></tr>
				<tr><td>TURBO</td><td>Cycles spin speed: Normal, Quick, or Turbo.</td></tr>
				<tr><td>SPACE / ENTER</td><td>Start or stop a spin from the keyboard (when enabled).</td></tr>
			</tbody>
		</table>
	</section>

	<section>
		<h3>Game Continuity</h3>
		<p>
			If the game is interrupted (closed window, lost connection) any unfinished round is
			automatically resumed from the last confirmed state when the player returns. Wins and
			balances are stored on the server and are not affected by client-side interruptions.
		</p>
	</section>

	<section class="disclaimer">
		<h3>Malfunction Policy</h3>
		<p>
			<strong>Malfunction voids all pays and plays.</strong>
			In the event of a technical malfunction, any wins, plays or bonuses awarded as a result of
			that malfunction will be void. Please contact customer support for assistance.
		</p>
	</section>

	<p class="footer-tag">
		La dolce vita — Play responsibly.{#if !social} Gambling can be addictive.{/if}<br />
		{gameDisplayName} | Base RTP {baseRtpLabel} | {buyFeatureLabel} RTP {bonusRtpLabel} | {config.gameInfo.volatility} Volatility | Max Win {maxWinMultiplier.toLocaleString()}×
	</p>
</div>

<style lang="scss">
	.game-rules {
		color: var(--th-cream, #f5e7c0);
		font-family: system-ui, -apple-system, 'Segoe UI', Georgia, serif;
		max-width: 760px;
		padding: 0.25rem 0.5rem 1rem;
		line-height: 1.5;

		h2 {
			text-align: center;
			margin: 0 0 0.75rem;
			letter-spacing: 0.12em;
			color: var(--th-gold-text, #ffefb0);
			font-size: 1.05rem;
			text-transform: uppercase;
		}

		h3 {
			margin: 1rem 0 0.4rem;
			letter-spacing: 0.08em;
			color: var(--th-gold-heading, #ffd86b);
			border-bottom: 1px solid var(--th-border-strong, rgba(212, 175, 55, 0.55));
			padding-bottom: 0.2rem;
			text-transform: uppercase;
			font-size: 0.92rem;
		}

		.lead {
			text-align: center;
			margin: 0 0 1rem;
			color: var(--th-cream-muted, #e8d9a8);
		}

		p {
			margin: 0 0 0.5rem;
			color: var(--th-cream-muted, #e8d9a8);
		}

		ul {
			margin: 0 0 0.5rem;
			padding-left: 1.2rem;
			color: var(--th-cream-muted, #e8d9a8);
		}

		strong {
			color: var(--th-gold-text, #ffefb0);
		}

		.progression,
		.volatility {
			font-size: 0.9rem;
		}

		section {
			margin-bottom: 0.85rem;
		}

		.rules-table {
			width: 100%;
			border-collapse: collapse;
			margin: 0.5rem 0 0.75rem;
			font-size: 0.86rem;

			th,
			td {
				border: 1px solid var(--th-border, rgba(212, 175, 55, 0.35));
				padding: 0.35rem 0.5rem;
				text-align: left;
				vertical-align: top;
			}

			th {
				background: var(--th-card-bg, rgba(0, 0, 0, 0.28));
				color: var(--th-gold-heading, #ffd86b);
				font-weight: 800;
				letter-spacing: 0.05em;
			}

			td:first-child {
				color: var(--th-cream, #f5e7c0);
				font-weight: 600;
				width: 42%;
			}

			td:last-child {
				color: var(--th-cream-muted, #e8d9a8);
			}
		}

		.footer-tag {
			margin-top: 1.25rem;
			padding-top: 0.75rem;
			border-top: 1px solid var(--th-border, rgba(212, 175, 55, 0.35));
			text-align: center;
			font-size: 0.82rem;
			color: var(--th-brown, #8b5a2b);
			line-height: 1.45;
		}

		.disclaimer {
			border: 1px solid rgba(180, 80, 60, 0.55);
			background: rgba(60, 12, 8, 0.35);
			padding: 0.5rem 0.75rem;
			border-radius: 8px;

			h3 {
				color: #ffb4a0;
				border-bottom-color: rgba(255, 140, 120, 0.35);
			}

			p {
				color: #f5d0c8;
			}
		}
	}
</style>
