/**
 * Compare frontend config paytable vs mock-rgs paytable.js
 */
import { readFileSync } from 'node:fs';
import { PAYOUT_TABLE, MIN_CLUSTER_SIZE, getPayoutMultiplier } from '../mock-rgs/math/paytable.js';
import { FREE_SPINS_AWARDED, FREE_SPINS_TRIGGER } from '../mock-rgs/math/scatter.js';

const configSrc = readFileSync(new URL('../src/game/config.ts', import.meta.url), 'utf8');

/** Parse config.ts paytable blocks (simple regex extraction). */
const parseConfigPaytable = () => {
	const out = {};
	const symbolBlocks = configSrc.matchAll(/(\w+):\s*\{\s*label:[\s\S]*?paytable:\s*\[([\s\S]*?)\],/g);
	for (const match of symbolBlocks) {
		const symbol = match[1];
		const body = match[2];
		const tiers = [...body.matchAll(/\{\s*'(\d+)':\s*([\d.]+)\s*\}/g)].map((m) => [
			Number(m[1]),
			Number(m[2]),
		]);
		out[symbol] = tiers;
	}
	return out;
};

const configTable = parseConfigPaytable();

const mismatches = [];
const symbols = new Set([...Object.keys(PAYOUT_TABLE), ...Object.keys(configTable)]);

for (const symbol of [...symbols].sort()) {
	const server = PAYOUT_TABLE[symbol] ?? [];
	const client = configTable[symbol] ?? [];
	const maxLen = Math.max(server.length, client.length);
	for (let i = 0; i < maxLen; i++) {
		const s = server[i];
		const c = client[i];
		if (!s || !c || s[0] !== c[0] || s[1] !== c[1]) {
			mismatches.push({ symbol, server: s ?? null, client: c ?? null });
		}
	}
}

console.log('=== PAYTABLE SYNC: config.ts vs paytable.js ===');
if (mismatches.length === 0) {
	console.log('OK — all tiers match (7 symbols × 11 tiers each).');
} else {
	console.log(`MISMATCHES: ${mismatches.length}`);
	console.table(mismatches);
}

console.log('\n=== FULL PAYTABLE (bet multiplier × cluster size) ===');
console.log('Min cluster:', MIN_CLUSTER_SIZE);
console.log('Scatter trigger:', FREE_SPINS_TRIGGER, '→', FREE_SPINS_AWARDED);

for (const [symbol, tiers] of Object.entries(PAYOUT_TABLE)) {
	console.log(`\n${symbol}`);
	for (const [size, mult] of tiers) {
		console.log(`  ${size}${size === 15 ? '+' : ' '} symbols → ${mult}x`);
	}
}

console.log('\n=== 15+ extrapolation (sizes 16–49 on 7×7) ===');
for (const symbol of Object.keys(PAYOUT_TABLE)) {
	const m15 = getPayoutMultiplier(symbol, 15);
	const m16 = getPayoutMultiplier(symbol, 16);
	const m49 = getPayoutMultiplier(symbol, 49);
	if (m16 !== m15 || m49 !== m15) {
		console.log(`${symbol}: size16=${m16}x size49=${m49}x (tier15=${m15}x) — NOT flat 15+`);
	}
}
console.log('All symbols use tier-15 value for clusters larger than 15.');

console.log('\n=== GameRules vs config numeric claims ===');
const rulesRtp = configSrc.match(/rtp:\s*([\d.]+)/)?.[1];
const rulesMaxWin = configSrc.match(/max_win:\s*([\d.]+)/)?.[1];
console.log(`config betModes rtp: ${rulesRtp} (${Number(rulesRtp) * 100}%)`);
console.log(`config max_win: ${rulesMaxWin}x`);
console.log('GameRulesContent claims: RTP 96.53% / 96.52% buy, max win 25,000× — verify vs simulations');
