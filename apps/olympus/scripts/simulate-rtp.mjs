import { runBaseSpin, runBonusBuy } from '../mock-rgs/math/spin.js';
import { createSeededRng } from '../mock-rgs/math/rng.js';
import { BONUS_BUY_COST_MULTIPLIER } from '../mock-rgs/math/tuning.js';

const simulate = (fn, n, costMult = 1, seed = 1) => {
  let totalReturn = 0;
  let maxWin = 0;
  for (let i = 0; i < n; i++) {
    const { totalWin } = fn({ betAmount: 1, rng: createSeededRng(seed + i) });
    totalReturn += totalWin;
    if (totalWin > maxWin) maxWin = totalWin;
  }
  return {
    rtp: (totalReturn / (n * costMult)) * 100,
    maxWin,
  };
};

const baseN = Number(process.argv[2] ?? 25000);
const buyN = Number(process.argv[3] ?? 5000);

const base = simulate(runBaseSpin, baseN, 1, 1000);
const buy = simulate(runBonusBuy, buyN, BONUS_BUY_COST_MULTIPLIER, 500000);

console.log(`[simulate-rtp] base spins=${baseN} RTP=${base.rtp.toFixed(2)}% maxWin=${base.maxWin.toFixed(2)}x`);
console.log(
  `[simulate-rtp] buy spins=${buyN} RTP=${buy.rtp.toFixed(2)}% maxWin=${buy.maxWin.toFixed(2)}x`,
);
