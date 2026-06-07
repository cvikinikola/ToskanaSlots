<script lang="ts">
	// Game rules content for Toskany Harvest.
</script>

<div class="game-rules">
	<h2>HOW TO PLAY</h2>

	<section>
		<h3>The Grid</h3>
		<p>
			Toskany Harvest is played on a <strong>7 reels × 7 rows</strong> grid with a
			<strong>cluster pays</strong> mechanic. Wins are awarded when <strong>5 or more</strong>
			identical symbols form a connected cluster horizontally and/or vertically — paylines are
			not used.
		</p>
	</section>

	<section>
		<h3>Tumble (Cascade) Feature</h3>
		<p>
			After each win, all winning symbols are removed and the empty positions are filled by new
			symbols falling from above. Tumbles continue as long as new winning clusters are formed in
			a single spin. All wins within a spin are added together and paid at the end.
		</p>
	</section>

	<section>
		<h3>Free Spins (Bonus Round)</h3>
		<p>
			Land <strong>3 or more Vinar (S) scatter</strong> symbols anywhere on the grid to enter the
			Free Spins round:
		</p>
		<ul>
			<li>3 Scatters → <strong>10 Free Spins</strong></li>
			<li>4 Scatters → <strong>12 Free Spins</strong></li>
			<li>5 Scatters → <strong>15 Free Spins</strong></li>
			<li>6 Scatters → <strong>20 Free Spins</strong></li>
			<li>7+ Scatters → <strong>30 Free Spins</strong></li>
		</ul>
		<p>
			During Free Spins, <strong>spot multipliers</strong> on winning grid cells grow when symbols
			explode and apply to wins on those cells. Spots persist for the entire bonus round.
		</p>
		<p>Landing 3+ additional Scatters during Free Spins retriggers extra spins.</p>
	</section>

	<section>
		<h3>Buy Bonus</h3>
		<p>
			Where permitted by jurisdiction, players can purchase direct entry to the Free Spins round
			for <strong>100× the bet</strong>. A confirmation dialog will always appear before any bet
			above 2× the standard bet is taken.
		</p>
	</section>

	<section>
		<h3>Bet Controls</h3>
		<ul>
			<li><strong>+ / −</strong> adjust the bet amount.</li>
			<li><strong>SPIN</strong> starts a single round.</li>
			<li><strong>TURBO</strong> shortens reel animations.</li>
			<li>
				<strong>AUTO SPIN</strong> opens a dialog where you choose the number of rounds, an
				optional loss limit and single-win limit. Auto spins can be stopped at any time.
			</li>
			<li>
				<strong>SPACE</strong> can also be used to spin. Hold space to repeat spins where
				supported by jurisdiction.
			</li>
		</ul>
	</section>

	<section>
		<h3>Return To Player &amp; Max Win</h3>
		<ul>
			<li>Theoretical RTP: <strong>97.00%</strong></li>
			<li>Maximum win per round (BASE mode): <strong>5,000× bet</strong></li>
			<li>Maximum win per round (BONUS mode): <strong>5,000× bet</strong></li>
			<li>
				Once the maximum win is reached the round ends and any remaining spins or features are
				forfeited.
			</li>
		</ul>
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
</div>

<style lang="scss">
	.game-rules {
		color: var(--th-cream, #f5e7c0);
		font-family: 'proxima-nova', Georgia, serif;
		max-width: 760px;
		padding: 0.25rem 0.5rem 1rem;
		line-height: 1.5;

		h2 {
			text-align: center;
			margin: 0 0 0.75rem;
			letter-spacing: 0.15em;
			color: var(--th-gold-text, #ffefb0);
			text-transform: uppercase;
		}

		h3 {
			margin: 1rem 0 0.4rem;
			letter-spacing: 0.08em;
			color: var(--th-gold-heading, #ffd86b);
			border-bottom: 1px solid var(--th-border-strong, rgba(212, 175, 55, 0.55));
			padding-bottom: 0.2rem;
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

		section {
			margin-bottom: 0.85rem;
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
