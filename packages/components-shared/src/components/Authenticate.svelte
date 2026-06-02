<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	import { requestAuthenticate, requestReplay } from 'rgs-requests';
	import { stateUrlDerived, stateBet, stateConfig, stateModal, stateUi } from 'state-shared';
	import { API_AMOUNT_MULTIPLIER, MOST_USED_BET_INDEXES } from 'constants-shared/bet';

	type Props = { children: Snippet };

	const props: Props = $props();

	let authenticated = $state(false);

	const authenticate = async () => {
		try {
			const authenticateData = await requestAuthenticate({
				rgsUrl: stateUrlDerived.rgsUrl(),
				sessionID: stateUrlDerived.sessionID(),
				language: stateUrlDerived.lang(),
			});

			// error
			if (authenticateData?.error) throw authenticateData;

			// balance
			if (authenticateData?.balance) {
				// Example of authenticateData.balance
				// {
				// 		"amount": 10000000000000000,
				// 		"currency": "USD"
				// },
				stateBet.currency = authenticateData.balance.currency;
				stateBet.balanceAmount = authenticateData.balance.amount / API_AMOUNT_MULTIPLIER;
			}

			// config
			if (authenticateData?.config) {
				// Example of authenticateData.config
				// {
				// 	"gameID": "37_test-lines",
				// 	"minBet": 100000,
				// 	"maxBet": 1000000000,
				// 	"stepBet": 10000,
				// 	"defaultBetLevel": 1000000,
				// 	"betLevels": [100000, 200000, ..., 1000000000],
				// 	"betModes": {},
				// 	"jurisdiction": {
				// 			"socialCasino": false,
				// 			"disabledFullscreen": false,
				// 			"disabledTurbo": false,
				// 			"disabledSuperTurbo": false,
				// 			"disabledAutoplay": false,
				// 			"disabledSlamstop": false,
				// 			"disabledSpacebar": false,
				// 			"disabledBuyFeature": false,
				// 			"displayNetPosition": false,
				// 			"displayRTP": false,
				// 			"displaySessionTimer": false,
				// 			"minimumRoundDuration": 0
				// 	}
				// }
				stateConfig.jurisdiction = authenticateData?.config?.jurisdiction;
				stateConfig.betAmountOptions = (authenticateData.config?.betLevels || []).map(
					(level) => level / API_AMOUNT_MULTIPLIER,
				);
				const commonBetMenuOptions = stateConfig.betAmountOptions.filter((_, index) =>
					MOST_USED_BET_INDEXES.includes(index),
				);
				const maxBetOption = stateConfig.betAmountOptions.at(-1);
				stateConfig.betMenuOptions =
					maxBetOption === undefined || commonBetMenuOptions.includes(maxBetOption)
						? commonBetMenuOptions
						: [...commonBetMenuOptions, maxBetOption];
			}

			// round
			if (authenticateData?.round) {
				// Example of authenticateData.round 
				// {
				// 	"betID": 62277967,
				// 	"amount": 1000000,
				// 	"payout": 33400000,
				// 	"payoutMultiplier": 33.4,
				// 	"active": true,
				// 	"state": [...],
				// 	"mode": "BONUS",
				// 	"event": null
				// }

				if(authenticateData.round?.state) {
					// @ts-ignore
					stateBet.betToResume =  authenticateData.round;
				}

				if(authenticateData.round?.amount) {
					const betAmountValue =
						authenticateData.round.amount > 0
							? authenticateData.round.amount / API_AMOUNT_MULTIPLIER
							: 0;
					stateBet.betAmount = betAmountValue;
					stateBet.wageredBetAmount = betAmountValue;
				}

				if (authenticateData.round?.mode) {
					stateBet.activeBetModeKey = authenticateData.round.mode;
				};
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	const handleReplay = async () => {
		try {
			stateBet.betAmount = (stateUrlDerived.amount() / API_AMOUNT_MULTIPLIER) || 0;
			stateBet.wageredBetAmount = (stateUrlDerived.amount() / API_AMOUNT_MULTIPLIER) || 0;
			stateBet.activeBetModeKey = stateUrlDerived.mode();

			const data = await requestReplay({
				rgsUrl: stateUrlDerived.rgsUrl(),
				game: stateUrlDerived.game(),
				mode: stateUrlDerived.mode(),
				version: stateUrlDerived.version(),
				event: stateUrlDerived.event(),
			});

			// error from RGS
			if ((data as any)?.error) throw data;

			if (data) {
				// @ts-ignore
				stateBet.betToResume = {
					...data,
					event: '0',
					active: true,
					mode: stateUrlDerived.mode(),
				};
			} else {
				throw new Error('Replay data could not be loaded.');
			}
		} catch (error) {
			console.error(error);
			stateModal.modal = { name: 'error', error };
		}
	};

	onMount(async () => {
		if(stateUrlDerived.replay()) {
			stateUi.config.mode = 'replay';
			await handleReplay();
		} else {
			stateUi.config.mode = 'default';
			await authenticate();
		};

		authenticated = true;
	});
</script>

{#if authenticated}
	{@render props.children()}
	{#if stateUrlDerived.replay()}
		<div class="replay-badge" aria-label="Replay mode">REPLAY MODE</div>
	{/if}
{:else}
	<div class="authenticate-loader" role="status" aria-live="polite">
		<div class="authenticate-loader__spinner" aria-hidden="true"></div>
		<div class="authenticate-loader__label">
			{stateUrlDerived.replay() ? 'Loading replay…' : 'Loading game…'}
		</div>
	</div>
{/if}

<style lang="scss">
	.authenticate-loader {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		background: #000;
		color: #fff;
		font-family: system-ui, sans-serif;
		z-index: 9999;

		&__spinner {
			width: 48px;
			height: 48px;
			border: 4px solid rgba(255, 255, 255, 0.2);
			border-top-color: #fff;
			border-radius: 50%;
			animation: authenticate-loader-spin 0.9s linear infinite;
		}

		&__label {
			font-size: 14px;
			letter-spacing: 0.05em;
			text-transform: uppercase;
			opacity: 0.85;
		}
	}

	@keyframes authenticate-loader-spin {
		to { transform: rotate(360deg); }
	}

	.replay-badge {
		position: fixed;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		padding: 6px 14px;
		background: rgba(220, 38, 38, 0.92);
		color: #fff;
		font-family: system-ui, sans-serif;
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.12em;
		border-radius: 4px;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
		pointer-events: none;
		z-index: 9998;
	}
</style>
