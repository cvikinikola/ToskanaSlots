/**
 * Mock RGS server (Vite middleware plugin) for local development.
 *
 * Intercepts `/wallet/authenticate`, `/wallet/play`, `/wallet/end-round`,
 * `/bet/event` so the game runs without a real RGS backend. The play
 * endpoint delegates to the math module (mock-rgs/math/) — the SAME math
 * used by `scripts/gen-books.mjs`, so storybook books and DEV-mode play
 * cannot drift apart.
 *
 * Payouts come from paytable.js + tuning.js scales (target ~96% RTP).
 */

import { runBaseSpin, runBonusBuy } from './math/index.js';
import { BONUS_BUY_COST_MULTIPLIER } from './math/tuning.js';

// ─── Tuning ──────────────────────────────────────────────────────────────────

const BONUS_BUY_COST_MULT = BONUS_BUY_COST_MULTIPLIER;
const BET_MODE_COST_MULTIPLIER = {
  BASE: 1,
  ANTE: 1.2,
  SUPERANTE: 5,
  SUPERSPIN: 25,
  BONUS: BONUS_BUY_COST_MULT,
  SUPER: 200,
};
const BONUS_ROUND_MODES = new Set(['BONUS', 'SUPER']);

// ─── Round (used by both the Vite plugin and gen-books.mjs) ──────────────────

export const playMockRound = ({ mode = 'BASE' } = {}) => {
  const normalizedMode = String(mode).toUpperCase();
  const mathMode = BONUS_ROUND_MODES.has(normalizedMode) ? 'BONUS' : 'BASE';
  return mathMode === 'BONUS'
    ? runBonusBuy({ betAmount: 1 })
    : runBaseSpin({ betAmount: 1 });
};

// ─── Vite plugin ─────────────────────────────────────────────────────────────

export const mockRgsPlugin = () => ({
  name: 'mock-rgs',
  apply: 'serve',

  configureServer(server) {
    const sendJson = (res, data) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.end(JSON.stringify(data));
    };

    const readJson = (req) => new Promise((resolve) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
      });
    });

    server.middlewares.use('/wallet/authenticate', (req, res) => {
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      console.log('[mock-rgs] /wallet/authenticate');
      sendJson(res, {
        balance: { amount: 1000000000000, currency: 'USD' },
        config: {
          gameID: 'thor-1000',
          minBet: 200000,
          maxBet: 240000000,
          stepBet: 100000,
          defaultBetLevel: 1000000,
          betLevels: [
            200000,
            400000,
            500000,
            1000000,
            2000000,
            5000000,
            10000000,
            20000000,
            40000000,
            60000000,
            100000000,
            120000000,
            200000000,
            240000000,
          ],
          betModes: {
            BASE: { mode: 'BASE', costMultiplier: 1, feature: false },
            ANTE: { mode: 'ANTE', costMultiplier: BET_MODE_COST_MULTIPLIER.ANTE, feature: false },
            SUPERANTE: { mode: 'SUPERANTE', costMultiplier: BET_MODE_COST_MULTIPLIER.SUPERANTE, feature: false },
            SUPERSPIN: { mode: 'SUPERSPIN', costMultiplier: BET_MODE_COST_MULTIPLIER.SUPERSPIN, feature: false },
            BONUS: { mode: 'BONUS', costMultiplier: BONUS_BUY_COST_MULT, feature: true },
            SUPER: { mode: 'SUPER', costMultiplier: BET_MODE_COST_MULTIPLIER.SUPER, feature: true },
          },
          jurisdiction: {
            socialCasino: false, disabledFullscreen: false, disabledTurbo: false,
            disabledSuperTurbo: false, disabledAutoplay: false, disabledSlamstop: false,
            disabledSpacebar: false, disabledBuyFeature: false, displayNetPosition: false,
            displayRTP: false, displaySessionTimer: false, minimumRoundDuration: 0,
          },
        },
        round: null,
      });
    });

    let lastBalanceAmount = 1000000000000;

    server.middlewares.use('/wallet/play', async (req, res) => {
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      const body = await readJson(req);
      const mode = String(body?.mode || 'BASE').toUpperCase();
      const amount = Number(body?.amount) || 1000000;
      const costMultiplier = BET_MODE_COST_MULTIPLIER[mode] ?? 1;
      const cost = Math.round(amount * costMultiplier);

      const { bookEvents, totalWin } = playMockRound({ mode });

      const payoutApi = Math.round(totalWin * amount);
      const balanceAfterDebit = lastBalanceAmount - cost;
      lastBalanceAmount = balanceAfterDebit + payoutApi;

      console.log('[mock-rgs] /wallet/play mode=%s cost=%s win=%sx events=%d',
        mode, cost, totalWin.toFixed(2), bookEvents.length);

      sendJson(res, {
        balance: { amount: balanceAfterDebit, currency: 'USD' },
        round: {
          roundID: Date.now(),
          amount,
          payout: payoutApi,
          payoutMultiplier: totalWin,
          active: false,
          mode,
          event: '0',
          state: bookEvents,
        },
      });
    });

    server.middlewares.use('/wallet/end-round', (req, res) => {
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      console.log('[mock-rgs] /wallet/end-round');
      sendJson(res, { balance: { amount: lastBalanceAmount, currency: 'USD' } });
    });

    server.middlewares.use('/bet/event', (req, res) => {
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      sendJson(res, { ok: true });
    });
  },
});
