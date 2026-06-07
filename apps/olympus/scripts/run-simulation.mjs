/**
 * RTP / hit-rate simulation for Toskany Harvest (7×7 cluster slot).
 *
 * Usage:
 *   node scripts/run-simulation.mjs
 *   node scripts/run-simulation.mjs --spins=1000000
 *   SPINS=100000 SEED=99 node scripts/run-simulation.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runBaseSpin, runBonusBuy } from '../mock-rgs/math/spin.js';
import { createSeededRng } from '../mock-rgs/math/rng.js';
import {
	BONUS_BUY_COST_MULTIPLIER,
	MAX_WIN_MULTIPLIER,
	TARGET_RTP,
} from '../mock-rgs/math/tuning.js';

const spinsArg = process.argv.find((arg) => arg.startsWith('--spins='));
const SPINS = spinsArg
	? Number(spinsArg.split('=')[1])
	: Number(process.env.SPINS || 500_000);
const SEED = Number(process.env.SEED || 20260607);

const pct = (value) => `${(value * 100).toFixed(4)}%`;
const fmt = (value) => value.toFixed(4);

const stdDev = (samples) => {
	if (samples.length === 0) return 0;
	const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
	const variance =
		samples.reduce((sum, x) => sum + (x - mean) ** 2, 0) / samples.length;
	return Math.sqrt(variance);
};

/** Average of the top `tailFraction` outcomes (e.g. 0.01 = CVaR 99%). */
const tailMean = (samples, tailFraction, pickHigh = true) => {
	if (samples.length === 0) return 0;
	const sorted = [...samples].sort((a, b) => (pickHigh ? b - a : a - b));
	const n = Math.max(1, Math.ceil(samples.length * tailFraction));
	const slice = sorted.slice(0, n);
	return slice.reduce((a, b) => a + b, 0) / slice.length;
};

const riskMetrics = (returns, cost) => {
	const pGe = (threshold) => returns.filter((r) => r * cost >= threshold).length / returns.length;
	return {
		cvar99Return: tailMean(returns, 0.01, true),
		etl99House: tailMean(
			returns.map((r) => Math.max(0, 1 - r)),
			0.01,
			true,
		),
		pWinGe5000: pGe(5000),
		pWinGe10000: pGe(10000),
	};
};

const simulateMode = (mode, spins, rng) => {
	const cost = mode === 'BONUS' ? BONUS_BUY_COST_MULTIPLIER : 1;
	const run = mode === 'BONUS' ? runBonusBuy : runBaseSpin;

	let totalWagered = 0;
	let totalReturned = 0;
	let nonZero = 0;
	let maxWinSeen = 0;
	let maxWinHits = 0;
	const returns = [];

	const winBuckets = {
		'0': 0,
		'0-1x': 0,
		'1-5x': 0,
		'5-20x': 0,
		'20-100x': 0,
		'100-500x': 0,
		'500-5000x': 0,
		'5000x+': 0,
	};

	for (let i = 0; i < spins; i++) {
		const { totalWin } = run({ betAmount: 1, rng });
		totalWagered += cost;
		totalReturned += totalWin;
		returns.push(totalWin / cost);

		if (totalWin > 0) nonZero++;
		if (totalWin >= MAX_WIN_MULTIPLIER) maxWinHits++;
		maxWinSeen = Math.max(maxWinSeen, totalWin);

		if (totalWin === 0) winBuckets['0']++;
		else if (totalWin < 1) winBuckets['0-1x']++;
		else if (totalWin < 5) winBuckets['1-5x']++;
		else if (totalWin < 20) winBuckets['5-20x']++;
		else if (totalWin < 100) winBuckets['20-100x']++;
		else if (totalWin < 500) winBuckets['100-500x']++;
		else if (totalWin < 5000) winBuckets['500-5000x']++;
		else winBuckets['5000x+']++;
	}

	const rtp = totalReturned / totalWagered;
	const nonZeroRate = nonZero / spins;
	const hitRateNonZero = spins / nonZero;

	return {
		mode,
		spins,
		cost,
		rtp,
		totalWagered,
		totalReturned,
		nonZero,
		nonZeroRate,
		hitRateNonZero: Number.isFinite(hitRateNonZero) ? hitRateNonZero : Infinity,
		maxWinSeen,
		maxWinHits,
		stdDev: stdDev(returns),
		risk: riskMetrics(returns, cost),
		winBuckets,
	};
};

const printReport = (result) => {
	console.log(`\n=== ${result.mode} (${result.spins.toLocaleString()} spins, cost ${result.cost}×) ===`);
	console.log(`RTP:              ${pct(result.rtp)} (${fmt(result.totalReturned)} / ${fmt(result.totalWagered)} × bet)`);
	console.log(`Target RTP:       ${pct(TARGET_RTP)}`);
	console.log(`Non-zero wins:    ${result.nonZero.toLocaleString()} (${pct(result.nonZeroRate)})`);
	console.log(`Hit rate (non-0): 1 in ${fmt(result.hitRateNonZero)}`);
	console.log(`Std dev (return): ${fmt(result.stdDev)}× cost`);
	console.log(`Max win cap:      ${MAX_WIN_MULTIPLIER}×`);
	console.log(`Max win seen:     ${fmt(result.maxWinSeen)}×`);
	console.log(`Max win hits:     ${result.maxWinHits} (1 in ${fmt(result.spins / Math.max(result.maxWinHits, 1))})`);
	console.log(`CVaR99 return:    ${fmt(result.risk.cvar99Return)}× cost`);
	console.log(`ETL99 house:      ${fmt(result.risk.etl99House)}× cost`);
	console.log(`P(win ≥ 5000×):   ${pct(result.risk.pWinGe5000)} (1 in ${fmt(1 / Math.max(result.risk.pWinGe5000, 1 / result.spins))})`);
	console.log(`P(win ≥ 10000×):  ${pct(result.risk.pWinGe10000)} (1 in ${fmt(1 / Math.max(result.risk.pWinGe10000, 1 / result.spins))})`);
	console.log('Win distribution:');
	for (const [bucket, count] of Object.entries(result.winBuckets)) {
		console.log(`  ${bucket.padEnd(12)} ${count.toLocaleString().padStart(10)} (${pct(count / result.spins)})`);
	}
};

console.log(`Toskany Harvest simulation — 7×7 grid, seed ${SEED}, ${SPINS.toLocaleString()} spins/mode`);

const baseRng = createSeededRng(SEED);
const bonusRng = createSeededRng(SEED + 1);

const base = simulateMode('BASE', SPINS, baseRng);
const bonus = simulateMode('BONUS', SPINS, bonusRng);

printReport(base);
printReport(bonus);

const rtpDelta = Math.abs(base.rtp - bonus.rtp);
console.log('\n=== CROSS-MODE CHECKS ===');
console.log(`RTP delta BASE vs BONUS: ${pct(rtpDelta)} (Stake limit: ≤0.5%)`);
console.log(`BASE RTP in 90–97.7%:    ${base.rtp >= 0.9 && base.rtp <= 0.977 ? 'PASS' : 'FAIL'}`);
console.log(`BONUS RTP in 90–97.7%:   ${bonus.rtp >= 0.9 && bonus.rtp <= 0.977 ? 'PASS' : 'FAIL'}`);
console.log(`Mode RTP within 0.5%:    ${rtpDelta <= 0.005 ? 'PASS' : 'FAIL'}`);
console.log(`Max win reachable:       ${base.maxWinHits + bonus.maxWinHits > 0 ? 'PASS' : 'FAIL (0 hits)'}`);
console.log(`Non-zero hit < 1/20:     ${base.hitRateNonZero <= 20 ? 'PASS' : 'FAIL'} (BASE)`);
console.log(`BASE std dev 0.6–50:     ${base.stdDev >= 0.6 && base.stdDev <= 50 ? 'PASS' : 'FAIL'} (got ${fmt(base.stdDev)})`);
console.log(`RGS max bet limit:       $500,000 (game mock max $240 — under limit)`);

console.log('\n=== RISK METRICS (compare to Stake 2★ / 3★ limits in dashboard) ===');
console.log('BASE:', JSON.stringify(base.risk, null, 2));
console.log('BONUS:', JSON.stringify(bonus.risk, null, 2));

console.log('\n=== GAME RULES VALUES (copy to GameRulesContent after math calibration) ===');
console.log(`Theoretical RTP (BASE):     ${pct(base.rtp)}`);
console.log(`RTP with Buy Free Spins:    ${pct(bonus.rtp)}`);

const reportPath = join(dirname(fileURLToPath(import.meta.url)), '.last-simulation.json');
writeFileSync(
	reportPath,
	JSON.stringify(
		{
			seed: SEED,
			spins: SPINS,
			grid: '7×7',
			targetRtp: TARGET_RTP,
			base,
			bonus,
			checks: {
				rtpDelta: rtpDelta,
				baseInRange: base.rtp >= 0.9 && base.rtp <= 0.977,
				bonusInRange: bonus.rtp >= 0.9 && bonus.rtp <= 0.977,
				modesWithinHalfPercent: rtpDelta <= 0.005,
				maxWinReachable: base.maxWinHits + bonus.maxWinHits > 0,
			},
			generatedAt: new Date().toISOString(),
		},
		null,
		2,
	),
);
console.log(`\nReport saved: ${reportPath}`);
