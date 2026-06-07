/**
 * Binary-search tuning env vars for ~96% RTP on BASE and BONUS (≤0.5% apart).
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const sim = join(__dir, 'run-simulation.mjs');
const SPINS = Number(process.env.SPINS || 20_000);
const TARGET = 0.96;

const runSim = (env) => {
	const result = spawnSync(process.execPath, [sim, `--spins=${SPINS}`], {
		env: { ...process.env, ...Object.fromEntries(Object.entries(env).map(([k, v]) => [k, String(v)])) },
		encoding: 'utf8',
		timeout: 600_000,
	});
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		throw new Error('simulation failed');
	}
	const base = Number(result.stdout.match(/=== BASE[\s\S]*?RTP:\s+([\d.]+)%/)?.[1]) / 100;
	const bonus = Number(result.stdout.match(/=== BONUS[\s\S]*?RTP:\s+([\d.]+)%/)?.[1]) / 100;
	return { base, bonus, stdout: result.stdout };
};

const search = (label, testEnv, readRtp, lo, hi) => {
	let low = lo;
	let high = hi;
	let best = { value: lo, rtp: readRtp(runSim(testEnv(lo))), env: testEnv(lo) };

	for (let i = 0; i < 8; i++) {
		const mid = (low + high) / 2;
		const env = testEnv(mid);
		const { base, bonus } = runSim(env);
		const rtp = readRtp({ base, bonus });
		if (Math.abs(rtp - TARGET) < Math.abs(best.rtp - TARGET)) {
			best = { value: mid, rtp, env, base, bonus };
		}
		console.log(`  [${label}] try ${mid.toFixed(3)} → RTP ${(rtp * 100).toFixed(2)}%`);
		if (rtp < TARGET) low = mid;
		else high = mid;
	}
	return best;
};

console.log(`Finding tuning (${SPINS.toLocaleString()} spins/sample, target ${TARGET * 100}%)...\n`);

const baseBest = search(
	'BASE HOT',
	(v) => ({
		HOT_SYMBOL_BOOST: v,
		NEIGHBOR_REFILL_BIAS: 1.35,
		FS_HOT_SYMBOL_BOOST: 2.55,
		FS_NEIGHBOR_REFILL_BIAS: 1.72,
		BUY_FS_HOT_SYMBOL_BOOST: 2.38,
		BUY_FS_NEIGHBOR_REFILL_BIAS: 1.64,
	}),
	(r) => r.base,
	1.66,
	2.5,
);

console.log(`\nBASE best HOT_SYMBOL_BOOST=${baseBest.value.toFixed(3)} → ${(baseBest.rtp * 100).toFixed(2)}%\n`);

const bonusBest = search(
	'BONUS BUY',
	(v) => ({
		...baseBest.env,
		BUY_FS_HOT_SYMBOL_BOOST: v,
		BUY_FS_NEIGHBOR_REFILL_BIAS: 1.78,
	}),
	(r) => r.bonus,
	2.38,
	4.5,
);

console.log('\n=== RECOMMENDED tuning.js defaults ===');
console.log(`HOT_SYMBOL_BOOST:          ${baseBest.value.toFixed(3)}`);
console.log(`NEIGHBOR_REFILL_BIAS:     1.35`);
console.log(`FS_HOT_SYMBOL_BOOST:       2.55`);
console.log(`BUY_FS_HOT_SYMBOL_BOOST:   ${bonusBest.value.toFixed(3)}`);
console.log(`BUY_FS_NEIGHBOR_REFILL_BIAS: 1.78`);
console.log(`\nEstimated RTP — BASE: ${(baseBest.base * 100).toFixed(2)}%, BONUS: ${(bonusBest.bonus * 100).toFixed(2)}%`);
console.log(`Delta: ${(Math.abs(baseBest.base - bonusBest.bonus) * 100).toFixed(2)} pp`);

writeFileSync(join(__dir, '.recommended-tuning.json'), JSON.stringify({
	baseBest: baseBest.value,
	buyBest: bonusBest.value,
	baseRtp: baseBest.base,
	bonusRtp: bonusBest.bonus,
}, null, 2));
