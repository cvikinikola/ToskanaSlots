/**
 * Game configuration for the Olympus-style slot.
 *
 * 6×5 grid, cluster wins (8+), tumble/cascade mechanic.
 * Multiplier symbols (M) accumulate a global multiplier during free spins.
 * Free spins triggered by 4+ scatter symbols (S).
 */
const config = {
	providerName: 'sample_provider',
	gameName: 'sample_olympus',
	gameID: '0_0_olympus',
	rtp: 0.97,
	numReels: 6,
	numRows: [5, 5, 5, 5, 5, 5],

	betModes: {
		base: {
			cost: 1.0,
			feature: true,
			buyBonus: false,
			rtp: 0.97,
			max_win: 5000.0,
			description: 'Standard game entry',
		},
		bonus: {
			cost: 100.0,
			feature: false,
			buyBonus: true,
			rtp: 0.97,
			max_win: 5000.0,
			description: 'Buy bonus / free spins direct entry',
		},
	},

	/**
	 * Padding rows added above/below the visible grid for each game type.
	 * Used by createReelForCascading to know how many off-screen symbols to generate.
	 */
	paddingReels: {
		basegame: [1, 1, 1, 1, 1, 1],
		freeSpins: [1, 1, 1, 1, 1, 1],
	} as Record<string, number[]>,

	/**
	 * Cluster win table: symbol name → { clusterSize: payout multiplier }
	 * Payouts are expressed as multiples of the bet.
	 */
	symbols: {
		// High-value symbols (mythological figures)
		H1: {
			label: 'Zeus',
			paytable: [{ '8': 5 }, { '9': 12.5 }, { '12': 25 }, { '15': 62.5 }, { '20': 125 }, { '30': 1250 }],
		},
		H2: {
			label: 'Athena',
			paytable: [{ '8': 4 }, { '9': 10 }, { '12': 20 }, { '15': 50 }, { '20': 100 }, { '30': 1000 }],
		},
		H3: {
			label: 'Poseidon',
			paytable: [{ '8': 2.5 }, { '9': 6 }, { '12': 12.5 }, { '15': 37.5 }, { '20': 75 }, { '30': 750 }],
		},
		H4: {
			label: 'Hades',
			paytable: [{ '8': 1.5 }, { '9': 4 }, { '12': 7.5 }, { '15': 25 }, { '20': 50 }, { '30': 500 }],
		},
		// Low-value symbols (artifacts)
		L1: {
			label: 'Medusa',
			paytable: [{ '8': 1 }, { '9': 2.5 }, { '12': 5 }, { '15': 12.5 }, { '20': 25 }, { '30': 250 }],
		},
		L2: {
			label: 'Pegasus',
			paytable: [{ '8': 0.75 }, { '9': 2 }, { '12': 4 }, { '15': 10 }, { '20': 20 }, { '30': 200 }],
		},
		L3: {
			label: 'Minotaur',
			paytable: [{ '8': 0.5 }, { '9': 1.5 }, { '12': 3 }, { '15': 7.5 }, { '20': 15 }, { '30': 150 }],
		},
		L4: {
			label: 'Lyre',
			paytable: [{ '8': 0.25 }, { '9': 1 }, { '12': 2 }, { '15': 5 }, { '20': 10 }, { '30': 100 }],
		},
		// Special symbols
		S: {
			label: 'Scatter',
			paytable: [],
		},
		M: {
			label: 'Multiplier',
			paytable: [],
		},
	},

	/** Minimum cluster size to qualify for a win */
	minClusterSize: 8,

	/** Multiplier values that can appear on 'M' symbols (Gates-of-Olympus ladder) */
	multiplierValues: [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100, 250, 500],

	/** Free spins configuration */
	freeSpins: {
		/** Number of scatters needed to trigger */
		triggerCount: 4,
		/** Free spins awarded per trigger level */
		awarded: { 4: 15, 5: 20, 6: 25 },
	},
} as const;

export default config;
