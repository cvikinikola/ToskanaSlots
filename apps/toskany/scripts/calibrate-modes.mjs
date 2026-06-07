/**
 * Calibrate BASE + BONUS-buy RTP to match within Stake's 0.5% limit.
 *
 *   node scripts/calibrate-modes.mjs
 *   SPINS=80000 node scripts/calibrate-modes.mjs
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const sim = join(__dir, 'run-simulation.mjs');
const SPINS = Number(process.env.SPINS || 80_000);
const TARGET = Number(process.env.TARGET_RTP || 0.97);

const fixed = {
	NEIGHBOR_REFILL_BIAS: '1.355',
	FS_HOT_SYMBOL_BOOST: '2.59',
	FS_NEIGHBOR_REFILL_BIAS: '1.72',
	BUY_FS_NEIGHBOR_REFILL_BIAS: '1.775',
};

const run = (env) => {
	const result = spawnSync(process.execPath, [sim, `--spins=${SPINS}`], {
		env: { ...process.env, ...fixed, ...env },
		encoding: 'utf8',
		timeout: 900_000,
	});
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		throw new Error('simulation failed');
	}
	const base = Number(result.stdout.match(/=== BASE[\s\S]*?RTP:\s+([\d.]+)%/)?.[1]) / 100;
	const bonus = Number(result.stdout.match(/=== BONUS[\s\S]*?RTP:\s+([\d.]+)%/)?.[1]) / 100;
	return { base, bonus, delta: Math.abs(base - bonus) };
};

const binarySearch = (label, lo, hi, buildEnv, pickSide) => {
	let best = null;
	for (let i = 0; i < 7; i++) {
		const mid = (lo + hi) / 2;
		const res = run(buildEnv(mid));
		console.log(
			`[${label}] ${mid.toFixed(4)} → BASE ${(res.base * 100).toFixed(3)}% BONUS ${(res.bonus * 100).toFixed(3)}% Δ ${(res.delta * 100).toFixed(3)}pp`,
		);
		if (!best || Math.abs(res.base - TARGET) < Math.abs(best.base - TARGET)) {
			best = { ...res, value: mid };
		}
		if (pickSide(res)) lo = mid;
		else hi = mid;
	}
	return best;
};

console.log(`Calibrating modes (${SPINS.toLocaleString()} spins/sample, target BASE ~${TARGET * 100}%)...\n`);

const hotBest = binarySearch(
	'HOT',
	1.95,
	2.15,
	(v) => ({ HOT_SYMBOL_BOOST: String(v), BUY_FS_HOT_SYMBOL_BOOST: '3.1' }),
	(r) => r.base < TARGET,
);

const buyBest = binarySearch(
	'BUY',
	3.05,
	3.35,
	(v) => ({
		HOT_SYMBOL_BOOST: String(hotBest.value),
		BUY_FS_HOT_SYMBOL_BOOST: String(v),
	}),
	(r) => r.bonus < r.base,
);

console.log('\n=== Recommended tuning.js defaults ===');
console.log(`HOT_SYMBOL_BOOST:            ${hotBest.value.toFixed(3)}`);
console.log(`BUY_FS_HOT_SYMBOL_BOOST:     ${buyBest.value.toFixed(3)}`);
console.log(
	`Estimated RTP — BASE: ${(buyBest.base * 100).toFixed(2)}%, BONUS: ${(buyBest.bonus * 100).toFixed(2)}%, Δ: ${(buyBest.delta * 100).toFixed(2)} pp`,
);

writeFileSync(
	join(__dir, '.recommended-tuning.json'),
	JSON.stringify(
		{
			HOT_SYMBOL_BOOST: hotBest.value,
			BUY_FS_HOT_SYMBOL_BOOST: buyBest.value,
			baseRtp: buyBest.base,
			bonusRtp: buyBest.bonus,
			delta: buyBest.delta,
		},
		null,
		2,
	),
);
