<script lang="ts">
	import config from '../game/config';
	import { stateUrlDerived } from 'state-shared';

	const social = $derived(stateUrlDerived.social());
</script>

<div class="game-rules">
	<h2>TOSCANA HARVEST — GAME RULES</h2>

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
			The maximum win is limited to <strong>25,000× {social ? 'play amount' : 'bet'}</strong> in both the base game and free
			spins. If the total win of a free spins round reaches 25,000× {social ? 'play amount' : 'bet'}, the round immediately
			ends, the win is awarded and all remaining free spins are forfeited.
		</p>
	</section>

	<section>
		<h3>{social ? 'Play Free Spins' : 'Buy Free Spins'}</h3>
		<p>
			Where permitted by jurisdiction, {social ? 'use' : 'pay'} <strong>100× total {social ? 'play amount' : 'bet'}</strong> to trigger the
			Vendemmia Free Spins feature. On the triggering spin, 3, 4, 5, 6 or 7 Scatter symbols can
			land randomly.
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
				<tr><td>Grid size</td><td>7×7 (49 symbol positions)</td></tr>
				<tr><td>Minimum cluster for win</td><td>5 or more connected same symbols</td></tr>
				<tr><td>Connection</td><td>Horizontal or vertical</td></tr>
				<tr><td>Volatility</td><td>High</td></tr>
				<tr><td>Theoretical RTP</td><td>97.20%</td></tr>
				<tr><td>RTP with {social ? 'Play Free Spins' : 'Buy Free Spins'}</td><td>96.72%</td></tr>
				<tr><td>Minimum {social ? 'play' : 'bet'}</td><td>$0.20</td></tr>
				<tr><td>Maximum {social ? 'play' : 'bet'}</td><td>$240.00</td></tr>
				<tr><td>Maximum win</td><td>25,000× total {social ? 'play amount' : 'bet'}</td></tr>
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
		<h3>How To Play</h3>
		<table class="rules-table">
			<thead>
				<tr>
					<th>Button</th>
					<th>Function</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>SPIN</td><td>Starts the spin</td></tr>
				<tr><td>+ and −</td><td>Change {social ? 'play amount' : 'bet value'}, open {social ? 'play amount' : 'bet'} menu</td></tr>
				<tr><td>{social ? 'PLAY display' : 'BET display'}</td><td>Current {social ? 'play amount' : 'bet'} — click to switch coins/cash</td></tr>
				<tr><td>{social ? 'COINS display' : 'CREDIT display'}</td><td>Current balance — click to switch coins/cash</td></tr>
				<tr><td>WIN display</td><td>Win from current spin</td></tr>
				<tr><td>{social ? 'PLAY FREE SPINS' : 'BUY FREE SPINS'}</td><td>100× {social ? 'play amount' : 'bet'} — instant Vendemmia Free Spins</td></tr>
				<tr><td>AUTOPLAY</td><td>Opens auto play menu</td></tr>
				<tr><td>Turbo icon</td><td>Normal / Quick / Turbo spin speed</td></tr>
				<tr><td>Sound icon</td><td>Toggle sound on/off</td></tr>
				<tr><td>SPACE / ENTER</td><td>Start or stop spin from keyboard</td></tr>
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
		Toscana Harvest | RTP 97.20% | High Volatility | Max Win 25,000×
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
