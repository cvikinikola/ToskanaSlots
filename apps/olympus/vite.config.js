// @ts-ignore
import config from 'config-vite';
import { mergeConfig } from 'vite';

/**
 * Mock RGS server for local development.
 *
 * Adds a Vite dev-server middleware that intercepts POST requests to
 * /wallet/authenticate, /wallet/play and /wallet/end-round so the game runs
 * without a real RGS backend.
 *
 * Generates valid bookEvents that match `apps/olympus/src/game/typesBookEvent.ts`.
 *
 * Game model: a Gates-of-Olympus style "pay-anywhere" cluster slot:
 *   • 6 reels × 5 rows
 *   • A symbol pays when 8+ of its kind appear ANYWHERE on the visible grid
 *   • Tumble / cascade — winning symbols explode and new ones fall in
 *   • Multiplier symbols (M, 2x..500x) accumulate during a cascade chain and
 *     are applied to the cascade's tumble win at the end of the chain
 *   • Scatter symbols (S) — 4+ on the initial board trigger 10 free spins
 *   • In free spins, every collected multiplier is added to a persistent
 *     globalMult that applies to every future cascade win
 *
 * Target RTP is calibrated to ~97% by simulating thousands of rounds at boot
 * and applying a constant scale factor to every payout so the long-run
 * average payoutMultiplier converges to TARGET_RTP.
 */

// ─── Tuning ──────────────────────────────────────────────────────────────────

const TARGET_RTP = 0.97;
const CALIBRATION_ROUNDS = 20000;
const FREE_SPINS_AWARDED = 10;
const BONUS_BUY_COST_MULT = 100;

// Stake's web-sdk encodes book amounts in "book units" where 100 = 1× bet.
// (See packages/constants-shared/bet.ts → BOOK_AMOUNT_MULTIPLIER.) Every
// amount we put into a bookEvent must be multiplied by this; the API
// `payout` / `payoutMultiplier` fields stay as raw bet-multiples.
const BOOK_AMOUNT_MULTIPLIER = 100;
const toBookAmount = (xBet) => Math.round(xBet * BOOK_AMOUNT_MULTIPLIER);

// ─── Board / symbols ─────────────────────────────────────────────────────────

const NUM_REELS = 6;
const NUM_ROWS = 5;
const PADDING = 1;
const COLUMN_HEIGHT = NUM_ROWS + PADDING * 2;

// Weighted distribution — lows show up more often than highs, mirroring
// Gates of Olympus reel composition.
const SYMBOL_WEIGHTS = [
  ['L4', 18], ['L3', 16], ['L2', 14], ['L1', 12],
  ['H4', 9],  ['H3', 7],  ['H2', 5],  ['H1', 4],
];
const SYMBOL_TOTAL = SYMBOL_WEIGHTS.reduce((a, [, w]) => a + w, 0);

const SCATTER_RATE = 0.014;     // ~1.4% per cell
const MULTIPLIER_RATE = 0.018;  // ~1.8% per cell

// Multiplier values weighted so low values dominate
const MULTIPLIER_WEIGHTS = [
  [2, 30], [3, 25], [4, 18], [5, 14], [6, 10], [8, 8], [10, 6],
  [12, 4], [15, 3], [20, 2], [25, 1.5], [50, 1], [100, 0.5], [250, 0.2], [500, 0.1],
];
const MULT_TOTAL = MULTIPLIER_WEIGHTS.reduce((a, [, w]) => a + w, 0);

// Pay table: pays[symbol][tier] where tiers are 8-9 / 10-11 / 12+ matches.
// Values are × bet amount (Gates of Olympus inspired).
const PAYOUT_TABLE = {
  H1: [10,  25,  50],
  H2: [5,   15,  25],
  H3: [4,   10,  20],
  H4: [3,   8,   15],
  L1: [1.5, 2.0, 12],
  L2: [1.2, 1.5, 10],
  L3: [1.0, 1.25, 8],
  L4: [0.4, 0.9, 4],
};

const tierIndex = (count) => (count >= 12 ? 2 : count >= 10 ? 1 : 0);

// ─── RNG helpers ─────────────────────────────────────────────────────────────

const choiceWeighted = (weights, total) => {
  let r = Math.random() * total;
  for (const [v, w] of weights) {
    r -= w;
    if (r <= 0) return v;
  }
  return weights[weights.length - 1][0];
};

const makeSymbol = (allowSpecials, freeSpinMode = false) => {
  // In free spins, multipliers are roughly 2x as common (mirrors Gates feature)
  const multRate = freeSpinMode ? MULTIPLIER_RATE * 2 : MULTIPLIER_RATE;
  if (allowSpecials && !freeSpinMode && Math.random() < SCATTER_RATE) {
    return { name: 'S', scatter: true };
  }
  if (allowSpecials && Math.random() < multRate) {
    return { name: 'M', multiplier: choiceWeighted(MULTIPLIER_WEIGHTS, MULT_TOTAL) };
  }
  return { name: choiceWeighted(SYMBOL_WEIGHTS, SYMBOL_TOTAL) };
};

const makeBoard = (freeSpinMode = false) => {
  const board = [];
  for (let r = 0; r < NUM_REELS; r++) {
    const reel = [];
    for (let i = 0; i < COLUMN_HEIGHT; i++) reel.push(makeSymbol(true, freeSpinMode));
    board.push(reel);
  }
  return board;
};

// ─── Win detection ───────────────────────────────────────────────────────────

/**
 * Pay-anywhere: count occurrences of each non-special symbol on the visible
 * grid. A symbol with count >= 8 produces a win according to the pay table.
 */
const findWinsAndMultipliers = (board) => {
  const winsBySymbol = {};
  const multipliers = [];
  for (let r = 0; r < NUM_REELS; r++) {
    for (let row = 0; row < NUM_ROWS; row++) {
      const sym = board[r][PADDING + row];
      if (sym.name === 'S') continue;
      if (sym.name === 'M') {
        multipliers.push({ reel: r, row, multiplier: sym.multiplier });
        continue;
      }
      (winsBySymbol[sym.name] = winsBySymbol[sym.name] || []).push({ reel: r, row });
    }
  }
  const wins = [];
  for (const [symbol, positions] of Object.entries(winsBySymbol)) {
    if (positions.length < 8) continue;
    const tier = tierIndex(positions.length);
    const pay = (PAYOUT_TABLE[symbol] && PAYOUT_TABLE[symbol][tier]) || 0;
    if (pay <= 0) continue;
    wins.push({ symbol, positions, win: pay });
  }
  return { wins, multipliers };
};

const countScatters = (board) => {
  let n = 0;
  for (let r = 0; r < NUM_REELS; r++) {
    for (let row = 0; row < NUM_ROWS; row++) {
      if (board[r][PADDING + row].name === 'S') n++;
    }
  }
  return n;
};

const tumble = (board, explodingPositions, freeSpinMode) => {
  const explodingByReel = {};
  for (const p of explodingPositions) {
    (explodingByReel[p.reel] = explodingByReel[p.reel] || []).push(p.row);
  }
  const newSymbols = [];
  const newBoard = board.map((reel) => reel.slice());
  for (let r = 0; r < NUM_REELS; r++) {
    const explodedRows = (explodingByReel[r] || []).map((row) => row + PADDING);
    const kept = newBoard[r].filter((_, i) => !explodedRows.includes(i));
    const need = COLUMN_HEIGHT - kept.length;
    const fresh = [];
    for (let i = 0; i < need; i++) fresh.push(makeSymbol(true, freeSpinMode));
    newBoard[r] = [...fresh, ...kept];
    newSymbols.push(fresh);
  }
  return { newBoard, newSymbols };
};

// ─── Round simulation ────────────────────────────────────────────────────────

/**
 * Simulates a single cascade chain on a starting board.
 * tumbleWin = sum of cascade wins (×bet) including any persistent globalMult.
 * Multipliers collected in a base-game chain are summed and applied at the
 * end of the chain. In free spins they accumulate into persistentMultRef.
 */
const simulateChain = ({ board, freeSpinMode, scale, persistentMultRef, emit }) => {
  let tumbleWin = 0;
  const collectedMults = [];
  const scattersOnInitialBoard = countScatters(board);
  const MAX_CASCADES = 30;

  let cur = board;
  let cascade = 0;
  while (cascade < MAX_CASCADES) {
    cascade++;
    const { wins, multipliers } = findWinsAndMultipliers(cur);
    if (wins.length === 0) break;

    const cascadeWinRaw = wins.reduce((a, w) => a + w.win, 0) * scale;
    const globalMult = freeSpinMode ? persistentMultRef.value : 1;
    const cascadeWin = cascadeWinRaw * globalMult;
    tumbleWin += cascadeWin;

    emit({
      type: 'winInfo',
      totalWin: toBookAmount(tumbleWin),
      wins: wins.map((w) => ({
        symbol: w.symbol,
        win: toBookAmount(w.win * scale * globalMult),
        positions: w.positions,
        meta: {
          globalMult,
          winWithoutMult: toBookAmount(w.win * scale),
          overlay: w.positions[0],
        },
      })),
    });
    emit({ type: 'updateTumbleWin', amount: toBookAmount(tumbleWin) });

    if (multipliers.length > 0) collectedMults.push(...multipliers);

    const exploding = wins.flatMap((w) => w.positions);
    const { newBoard, newSymbols } = tumble(cur, exploding, freeSpinMode);
    emit({ type: 'tumbleBoard', explodingSymbols: exploding, newSymbols });
    cur = newBoard;
  }

  if (collectedMults.length > 0 && tumbleWin > 0) {
    const boardMult = collectedMults.reduce((a, m) => a + m.multiplier, 0);
    if (freeSpinMode) {
      persistentMultRef.value += boardMult;
      emit({ type: 'updateGlobalMult', globalMult: persistentMultRef.value });
    } else {
      const preMult = tumbleWin;
      const totalAfter = preMult * boardMult;
      emit({
        type: 'boardMultiplierInfo',
        multInfo: { positions: collectedMults },
        winInfo: {
          tumbleWin: toBookAmount(preMult),
          boardMult,
          totalWin: toBookAmount(totalAfter),
        },
      });
      tumbleWin = totalAfter;
    }
  }

  return { tumbleWin, scattersOnInitialBoard, finalBoard: cur };
};

const simulateRound = ({ mode, scale, recordEvents = true }) => {
  const events = [];
  let index = 0;
  const emit = recordEvents
    ? (e) => events.push({ index: index++, ...e })
    : () => {};
  let totalWin = 0;

  const isBonusBuy = mode === 'BONUS';
  const board = makeBoard(false);
  if (isBonusBuy) {
    const positions = [];
    for (let r = 0; r < NUM_REELS; r++) {
      for (let row = 0; row < NUM_ROWS; row++) positions.push([r, row]);
    }
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    for (let i = 0; i < 4; i++) {
      const [r, row] = positions[i];
      board[r][PADDING + row] = { name: 'S', scatter: true };
    }
  }

  emit({
    type: 'reveal',
    board,
    paddingPositions: [0],
    anticipation: [0, 0, 0, 0, 0, 0],
    gameType: 'basegame',
  });

  const persistentMultRef = { value: 1 };
  const baseChain = simulateChain({
    board,
    freeSpinMode: false,
    scale,
    persistentMultRef,
    emit,
  });
  totalWin += baseChain.tumbleWin;

  const triggeredFreeSpins = baseChain.scattersOnInitialBoard >= 4 || isBonusBuy;
  if (triggeredFreeSpins) {
    const scatterPositions = [];
    for (let r = 0; r < NUM_REELS; r++) {
      for (let row = 0; row < NUM_ROWS; row++) {
        if (board[r][PADDING + row].name === 'S') {
          scatterPositions.push({ reel: r, row });
        }
      }
    }
    const totalFs = FREE_SPINS_AWARDED;
    emit({ type: 'freeSpinTrigger', totalFs, positions: scatterPositions });
    persistentMultRef.value = 1;
    emit({ type: 'updateGlobalMult', globalMult: 1 });

    let fsTotal = 0;
    for (let fs = 1; fs <= totalFs; fs++) {
      emit({ type: 'updateFreeSpin', amount: fs, total: totalFs });
      const fsBoard = makeBoard(true);
      emit({
        type: 'reveal',
        board: fsBoard,
        paddingPositions: [0],
        anticipation: [0, 0, 0, 0, 0, 0],
        gameType: 'freeSpins',
      });
      const chain = simulateChain({
        board: fsBoard,
        freeSpinMode: true,
        scale,
        persistentMultRef,
        emit,
      });
      fsTotal += chain.tumbleWin;
    }
    totalWin += fsTotal;
    emit({ type: 'freeSpinEnd', amount: toBookAmount(fsTotal), winLevel: 0 });
  }

  emit({ type: 'setTotalWin', amount: toBookAmount(totalWin) });
  emit({ type: 'finalWin', amount: toBookAmount(totalWin) });

  return { bookEvents: events, totalWin };
};

// ─── RTP calibration ─────────────────────────────────────────────────────────

/**
 * Per-mode RTP calibration. Run many rounds at scale=1 to measure each mode's
 * raw RTP, then derive a scale factor that lands the long-run average payout
 * near TARGET_RTP for that mode. BASE and BONUS need separate scales because
 * BONUS-buy always triggers free spins and is therefore much more volatile /
 * generous than a natural base spin.
 *
 * For BONUS the relevant denominator is the bonus cost (100x bet), so the
 * raw RTP is computed as (avg bonus payout in x bet) / BONUS_BUY_COST_MULT.
 */
const calibrateMode = (mode) => {
  let totalWin = 0;
  for (let i = 0; i < CALIBRATION_ROUNDS; i++) {
    totalWin += simulateRound({ mode, scale: 1, recordEvents: false }).totalWin;
  }
  const denominator = mode === 'BONUS' ? BONUS_BUY_COST_MULT : 1;
  const rawRtp = totalWin / CALIBRATION_ROUNDS / denominator;
  if (rawRtp <= 0) return 1;
  const scale = TARGET_RTP / rawRtp;
  console.log(
    '[mock-rgs] RTP calibration mode=%s raw=%s%% target=%s%% scale=%s',
    mode,
    (rawRtp * 100).toFixed(2),
    (TARGET_RTP * 100).toFixed(2),
    scale.toFixed(4),
  );
  return scale;
};

let CACHED_SCALES = null;
const getScale = (mode) => {
  if (CACHED_SCALES === null) {
    CACHED_SCALES = { BASE: calibrateMode('BASE'), BONUS: calibrateMode('BONUS') };
  }
  return CACHED_SCALES[mode] ?? CACHED_SCALES.BASE;
};

// ─── Mock plugin ─────────────────────────────────────────────────────────────

const mockRgsPlugin = {
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
        balance: { amount: 100000000000, currency: 'USD' },
        config: {
          gameID: 'thor-1000',
          minBet: 100000,
          maxBet: 1000000000,
          stepBet: 100000,
          defaultBetLevel: 1000000,
          betLevels: [100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000],
          betModes: {
            BASE: { mode: 'BASE', costMultiplier: 1, feature: false },
            BONUS: { mode: 'BONUS', costMultiplier: BONUS_BUY_COST_MULT, feature: true },
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

    let lastBalanceAmount = 100000000000;

    server.middlewares.use('/wallet/play', async (req, res) => {
      if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
      const body = await readJson(req);
      const mode = body?.mode || 'BASE';
      const amount = Number(body?.amount) || 1000000;
      const cost = mode === 'BONUS' ? amount * BONUS_BUY_COST_MULT : amount;

      const scale = getScale(mode);
      const { bookEvents, totalWin } = simulateRound({ mode, scale });

      const payoutApi = Math.round(totalWin * amount);
      lastBalanceAmount = lastBalanceAmount - cost + payoutApi;

      console.log('[mock-rgs] /wallet/play mode=%s cost=%s win=%sx events=%d',
        mode, cost, totalWin.toFixed(2), bookEvents.length);

      sendJson(res, {
        balance: { amount: lastBalanceAmount, currency: 'USD' },
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
};

export default mergeConfig(config(), {
  plugins: [mockRgsPlugin],
  server: { port: 3005 },
});
