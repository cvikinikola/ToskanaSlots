/**
 * Game configuration for Toskany Harvest.
 *
 * 7×7 grid, connected cluster wins (5+ touching horizontally/vertically),
 * tumble/cascade mechanic. Grid symbols: H1–H4, L1–L3, S (7 paying + scatter).
 * Vinar (S) scatter — free spins: 3→10, 4→12, 5→15, 6→20, 7+→30.
 */
import { SYMBOL_LABELS } from './symbolLabels';

const config = {
	providerName: 'sample_provider',
	/** RGS / URL identifier — keep in sync with Stake dashboard game slug. */
	gameName: 'toskany_harvest',
	gameID: '0_0_toskany',
	rtp: 0.972,
	numReels: 7,
	numRows: [7, 7, 7, 7, 7, 7, 7],

	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.972,
			max_win: 25000.0,
			description: 'Standard game entry',
		},
		bonus: {
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.9672,
			max_win: 25000.0,
			description: 'Buy bonus / free spins direct entry',
		},
	},

	/**
	 * Padding rows added above/below the visible grid for each game type.
	 * Used by createReelForCascading to know how many off-screen symbols to generate.
	 */
	paddingReels: {
		basegame: [1, 1, 1, 1, 1, 1, 1],
		freeSpins: [1, 1, 1, 1, 1, 1, 1],
	} as Record<string, number[]>,

	/**
	 * Connected cluster win table: symbol name → { clusterSize: payout multiplier }
	 * Payouts are expressed as multiples of the bet (fixed — RTP tuned via board math).
	 */
	symbols: {
		H1: {
			label: SYMBOL_LABELS.H1.en,
			paytable: [
				{ '5': 2 },
				{ '6': 3 },
				{ '7': 3.5 },
				{ '8': 4 },
				{ '9': 5 },
				{ '10': 10 },
				{ '11': 15 },
				{ '12': 30 },
				{ '13': 70 },
				{ '14': 140 },
				{ '15': 300 },
			],
		},
		H2: {
			label: SYMBOL_LABELS.H2.en,
			paytable: [
				{ '5': 1.5 },
				{ '6': 2 },
				{ '7': 2.5 },
				{ '8': 3 },
				{ '9': 4 },
				{ '10': 8 },
				{ '11': 12 },
				{ '12': 25 },
				{ '13': 60 },
				{ '14': 120 },
				{ '15': 200 },
			],
		},
		H3: {
			label: SYMBOL_LABELS.H3.en,
			paytable: [
				{ '5': 1 },
				{ '6': 1.5 },
				{ '7': 2 },
				{ '8': 2.5 },
				{ '9': 3 },
				{ '10': 6 },
				{ '11': 9 },
				{ '12': 20 },
				{ '13': 40 },
				{ '14': 80 },
				{ '15': 120 },
			],
		},
		H4: {
			label: SYMBOL_LABELS.H4.en,
			paytable: [
				{ '5': 0.8 },
				{ '6': 1 },
				{ '7': 1.5 },
				{ '8': 2 },
				{ '9': 2.5 },
				{ '10': 4 },
				{ '11': 6 },
				{ '12': 10 },
				{ '13': 20 },
				{ '14': 40 },
				{ '15': 80 },
			],
		},
		L1: {
			label: SYMBOL_LABELS.L1.en,
			paytable: [
				{ '5': 0.6 },
				{ '6': 0.8 },
				{ '7': 1 },
				{ '8': 1.5 },
				{ '9': 2 },
				{ '10': 3 },
				{ '11': 5 },
				{ '12': 7 },
				{ '13': 16 },
				{ '14': 30 },
				{ '15': 60 },
			],
		},
		L2: {
			label: SYMBOL_LABELS.L2.en,
			paytable: [
				{ '5': 0.5 },
				{ '6': 0.6 },
				{ '7': 0.8 },
				{ '8': 1 },
				{ '9': 1.5 },
				{ '10': 2 },
				{ '11': 3 },
				{ '12': 5 },
				{ '13': 10 },
				{ '14': 20 },
				{ '15': 40 },
			],
		},
		L3: {
			label: SYMBOL_LABELS.L3.en,
			paytable: [
				{ '5': 0.4 },
				{ '6': 0.5 },
				{ '7': 0.6 },
				{ '8': 0.8 },
				{ '9': 1 },
				{ '10': 1.5 },
				{ '11': 2 },
				{ '12': 2.5 },
				{ '13': 6 },
				{ '14': 12 },
				{ '15': 20 },
			],
		},
		S: {
			label: SYMBOL_LABELS.S.en,
			paytable: [],
		},
	},

	/** Grid spot multipliers — see config.spotMultipliers */
	spotMultipliers: {
		startMultiplier: 2,
		maxMultiplier: 1024,
	/** Base game: visuals cleared when the round finishes (finalWin). Free spins: persist until bonus ends. */
		persistInFreeSpins: true,
	},

	/** Minimum connected cluster size to qualify for a win */
	minClusterSize: 5,

	/** VINAR scatter — counts anywhere on the grid (not cluster). */
	scatter: {
		paysOnAnyPosition: true,
		appearsOnAllReels: true,
	},

	/** Free spins configuration (same table for trigger and retrigger) */
	freeSpins: {
		triggerCount: 3,
		awarded: { 3: 10, 4: 12, 5: 15, 6: 20, 7: 30 },
	},

	/** Display values for Game Rules / Paytable (keep in sync with math + RGS bet limits). */
	gameInfo: {
		displayName: 'Toskany Harvest',
		volatility: 'High',
		gridLabel: '7×7 (49 symbol positions)',
		minClusterSize: 5,
		betLimitsUsd: { min: 0.1, max: 100 },
		/** Stake dashboard / marketing blurb (English). */
		blurb:
			'Toskany Harvest takes you to sunlit Tuscan vineyards on a 7×7 cluster grid. Connect 5 or more matching symbols horizontally or vertically to win. Every win triggers tumbling cascades that can chain again and again. Winning symbols mark multiplier spots on the grid — from ×2 up to ×1024 — that add together on overlapping wins. In Vendemmia Free Spins, land 3–7 Vinar scatter symbols for up to 30 free spins; marked multipliers stay on the board and keep growing until the bonus ends. Where permitted, buy Vendemmia Free Spins for 100× bet. High volatility, 97.20% base RTP, max win 25,000× bet.',
		blurbShort:
			'Toskany Harvest — 7×7 cluster pays (min 5), tumble cascades, spot multipliers (×2–×1024), Vendemmia Free Spins (3–7 scatter), buy bonus 100×, max win 25,000×, RTP 97.20%.',
	},
} as const;

export default config;
