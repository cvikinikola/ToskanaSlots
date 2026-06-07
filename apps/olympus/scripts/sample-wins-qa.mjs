/**
 * Collect 10 sample winning rounds per mode for manual QA vs Game Rules / Paytable.
 *
 *   node scripts/sample-wins-qa.mjs
 *   SAMPLES=10 SEED=20260607 node scripts/sample-wins-qa.mjs
 *
 * Output: scripts/.last-win-samples-qa.json + console summary
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { runBaseSpin, runBonusBuy, createSeededRng } from '../mock-rgs/math/index.js';
import { getPayoutMultiplier } from '../mock-rgs/math/paytable.js';
import { toBookAmount } from '../mock-rgs/math/tumble.js';
import { BONUS_BUY_COST_MULTIPLIER, MAX_WIN_MULTIPLIER } from '../mock-rgs/math/tuning.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const SAMPLES = Number(process.env.SAMPLES || 10);
const SEED = Number(process.env.SEED || 20260607);
const BET = Number(process.env.BET || 1);
const BOOK = 100;

const bookToX = (book) => book / BOOK;
const fmtX = (x) => `${Number(x).toFixed(4).replace(/\.?0+$/, '')}×`;
const fmtUsd = (xBet, bet = BET) => `$${(xBet * bet).toFixed(2)}`;

const tierFor = (symbol, count) => {
	const mult = getPayoutMultiplier(symbol, count);
	const tierLabel = count >= 15 ? '15+' : String(count);
	return { tierLabel, paytableMultiplier: mult };
};

const analyzeRound = (bookEvents, totalWin, mode) => {
	const winInfos = bookEvents.filter((e) => e.type === 'winInfo');
	const finalWin = bookEvents.find((e) => e.type === 'finalWin');
	const setTotal = bookEvents.find((e) => e.type === 'setTotalWin');
	const fsTrigger = bookEvents.some((e) => e.type === 'freeSpinTrigger');

	const clusters = winInfos.flatMap((info, cascadeIdx) =>
		info.wins.map((w) => {
			const count = w.positions.length;
			const { tierLabel, paytableMultiplier } = tierFor(w.symbol, count);
			const spotMult = w.meta?.spotMult ?? 1;
			const expectedX = paytableMultiplier * spotMult;
			const bookWin = w.win;
			const bookBase = w.meta?.winWithoutMult ?? toBookAmount(paytableMultiplier);
			const matchPaytable = Math.abs(bookBase / BOOK - paytableMultiplier) < 0.0001;
			const matchApplied =
				Math.abs(bookWin / BOOK - expectedX) < 0.02 ||
				(bookWin === 1 && expectedX > 0 && expectedX < 0.01);

			return {
				cascade: cascadeIdx + 1,
				symbol: w.symbol,
				clusterSize: count,
				paytableTier: tierLabel,
				paytableMultiplier,
				spotMultiplier: spotMult,
				expectedWinX: expectedX,
				expectedWinUsd: fmtUsd(expectedX),
				bookWinAmount: bookWin,
				displayWinX: bookToX(bookWin),
				displayWinUsd: fmtUsd(bookToX(bookWin)),
				paytableMatch: matchPaytable,
				winMatch: matchApplied,
			};
		}),
	);

	const sumClusterX = clusters.reduce((s, c) => s + c.displayWinX, 0);
	const cappedTotal = Math.min(totalWin, MAX_WIN_MULTIPLIER);
	const payoutMultiplier = Number(cappedTotal.toFixed(6));
	const finalBook = finalWin?.amount ?? setTotal?.amount ?? toBookAmount(cappedTotal);
	const displayTotalX = bookToX(finalBook);

	const roundMatch =
		Math.abs(displayTotalX - payoutMultiplier) < 0.02 ||
		Math.abs(sumClusterX - payoutMultiplier) < 0.05; // FS rounds: clusters are per-segment

	return {
		mode,
		payoutMultiplier,
		displayTotalX,
		displayTotalUsd: fmtUsd(displayTotalX),
		finalWinBookAmount: finalBook,
		freeSpinsTriggered: fsTrigger,
		wagerCostX: mode === 'BONUS' ? BONUS_BUY_COST_MULTIPLIER : 1,
		clusterCount: clusters.length,
		allClustersMatchPaytable: clusters.every((c) => c.paytableMatch && c.winMatch),
		roundTotalMatchesPayout: Math.abs(displayTotalX - payoutMultiplier) < 0.001,
		clusters,
		qaNote: fsTrigger
			? 'Round includes free spins — compare UI total win to finalWin / payoutMultiplier for the full round.'
			: 'Sum of tumble cluster wins should match round total win.',
	};
};

const collectSamples = (mode, run, rng) => {
	const samples = [];
	let attempts = 0;
	const maxAttempts = 500_000;

	while (samples.length < SAMPLES && attempts < maxAttempts) {
		attempts++;
		const { bookEvents, totalWin } = run({ betAmount: BET, rng });
		if (totalWin <= 0) continue;

		const analysis = analyzeRound(bookEvents, totalWin, mode);
		// Prefer variety: skip duplicate payout multipliers when possible
		if (samples.some((s) => s.payoutMultiplier === analysis.payoutMultiplier) && samples.length < SAMPLES - 2) {
			continue;
		}

		samples.push({
			sample: samples.length + 1,
			seed: SEED,
			attempt: attempts,
			...analysis,
		});
	}

	if (samples.length < SAMPLES) {
		throw new Error(`${mode}: only found ${samples.length}/${SAMPLES} wins in ${attempts} attempts`);
	}

	return { samples, attempts };
};

console.log(`Collecting ${SAMPLES} winning rounds/mode (seed ${SEED}, bet ${fmtUsd(1)})...\n`);

const baseRng = createSeededRng(SEED);
const bonusRng = createSeededRng(SEED + 1);

const base = collectSamples('BASE', runBaseSpin, baseRng);
const bonus = collectSamples('BONUS', runBonusBuy, bonusRng);

const report = {
	seed: SEED,
	samplesPerMode: SAMPLES,
	betUsd: BET,
	generatedAt: new Date().toISOString(),
	base: base.samples,
	bonus: bonus.samples,
	summary: {
		base: {
			attempts: base.attempts,
			allRoundsMatch: base.samples.every((s) => s.roundTotalMatchesPayout),
			allClustersMatch: base.samples.every((s) => s.allClustersMatchPaytable),
		},
		bonus: {
			attempts: bonus.attempts,
			allRoundsMatch: bonus.samples.every((s) => s.roundTotalMatchesPayout),
			allClustersMatch: bonus.samples.every((s) => s.allClustersMatchPaytable),
		},
	},
};

for (const mode of ['BASE', 'BONUS']) {
	const list = report[mode.toLowerCase()];
	console.log(`=== ${mode} (${list.length} samples) ===`);
	for (const s of list) {
		const flags = [
			s.roundTotalMatchesPayout ? 'total OK' : 'total MISMATCH',
			s.allClustersMatchPaytable ? 'clusters OK' : 'cluster MISMATCH',
		].join(', ');
		console.log(
			`#${s.sample} payout ${fmtX(s.payoutMultiplier)} (${s.displayTotalUsd}) | ${s.clusterCount} clusters | FS: ${s.freeSpinsTriggered ? 'yes' : 'no'} | ${flags}`,
		);
		for (const c of s.clusters.slice(0, 3)) {
			console.log(
				`    ${c.symbol}×${c.clusterSize} tier ${c.paytableTier} → paytable ${fmtX(c.paytableMultiplier)}` +
					(c.spotMultiplier > 1 ? ` × spot ${c.spotMultiplier}` : '') +
					` = UI ${c.displayWinUsd}`,
			);
		}
		if (s.clusters.length > 3) console.log(`    … +${s.clusters.length - 3} more clusters`);
	}
	console.log('');
}

const outPath = join(__dir, '.last-win-samples-qa.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(`Report: ${outPath}`);
console.log(
	`Summary: BASE rounds ${report.summary.base.allRoundsMatch ? 'OK' : 'FAIL'}, clusters ${report.summary.base.allClustersMatch ? 'OK' : 'FAIL'}` +
		` | BONUS rounds ${report.summary.bonus.allRoundsMatch ? 'OK' : 'FAIL'}, clusters ${report.summary.bonus.allClustersMatch ? 'OK' : 'FAIL'}`,
);

process.exitCode =
	report.summary.base.allRoundsMatch &&
	report.summary.base.allClustersMatch &&
	report.summary.bonus.allRoundsMatch &&
	report.summary.bonus.allClustersMatch
		? 0
		: 1;
