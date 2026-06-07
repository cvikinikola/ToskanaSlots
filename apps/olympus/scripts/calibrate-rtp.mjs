/**
 * Rough RTP calibration helper (7×7 grid, seeded).
 * Sweeps HOT_SYMBOL_BOOST via env and reports RTP on a sample of spins.
 *
 *   node scripts/calibrate-rtp.mjs
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const sim = join(__dir, 'run-simulation.mjs');
const SPINS = Number(process.env.SPINS || 25_000);

const parseRtp = (output, label) => {
	const block = output.split(`=== ${label}`)[1]?.split('=== ')[0] ?? '';
	const match = block.match(/RTP:\s+([\d.]+)%/);
	return match ? Number(match[1]) / 100 : NaN;
};

const runSample = (boost) => {
	const result = spawnSync(
		process.execPath,
		[sim, `--spins=${SPINS}`],
		{
			env: {
				...process.env,
				HOT_SYMBOL_BOOST: String(boost),
				FS_HOT_SYMBOL_BOOST: String(boost * 1.5),
				BUY_FS_HOT_SYMBOL_BOOST: String(boost * 1.43),
			},
			encoding: 'utf8',
			timeout: 600_000,
		},
	);
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		throw new Error(`simulation failed for boost=${boost}`);
	}
	return {
		boost,
		base: parseRtp(result.stdout, 'BASE'),
		bonus: parseRtp(result.stdout, 'BONUS'),
	};
};

console.log(`Calibrating HOT_SYMBOL_BOOST (${SPINS.toLocaleString()} spins/sample)...`);

const samples = [1.66, 2.2, 2.8, 3.4, 4.0].map(runSample);
console.table(
	samples.map((s) => ({
		HOT_SYMBOL_BOOST: s.boost,
		BASE_RTP: `${(s.base * 100).toFixed(2)}%`,
		BONUS_RTP: `${(s.bonus * 100).toFixed(2)}%`,
	})),
);

const target = 0.96;
const best = samples.reduce((a, b) =>
	Math.abs(b.base - target) < Math.abs(a.base - target) ? b : a,
);

console.log(`\nClosest BASE RTP to 96%: HOT_SYMBOL_BOOST=${best.boost} → ${(best.base * 100).toFixed(2)}%`);
console.log('Set these in mock-rgs/math/tuning.js (or env) then re-run: pnpm simulate');
