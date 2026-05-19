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
			paytable: [{ '8': 10 }, { '9': 25 }, { '12': 50 }, { '15': 125 }, { '20': 250 }, { '30': 2500 }],
		},
		H2: {
			label: 'Athena',
			paytable: [{ '8': 8 }, { '9': 20 }, { '12': 40 }, { '15': 100 }, { '20': 200 }, { '30': 2000 }],
		},
		H3: {
			label: 'Poseidon',
			paytable: [{ '8': 5 }, { '9': 12 }, { '12': 25 }, { '15': 75 }, { '20': 150 }, { '30': 1500 }],
		},
		H4: {
			label: 'Hades',
			paytable: [{ '8': 3 }, { '9': 8 }, { '12': 15 }, { '15': 50 }, { '20': 100 }, { '30': 1000 }],
		},
		// Low-value symbols (artifacts)
		L1: {
			label: 'Medusa',
			paytable: [{ '8': 2 }, { '9': 5 }, { '12': 10 }, { '15': 25 }, { '20': 50 }, { '30': 500 }],
		},
		L2: {
			label: 'Pegasus',
			paytable: [{ '8': 1.5 }, { '9': 4 }, { '12': 8 }, { '15': 20 }, { '20': 40 }, { '30': 400 }],
		},
		L3: {
			label: 'Minotaur',
			paytable: [{ '8': 1 }, { '9': 3 }, { '12': 6 }, { '15': 15 }, { '20': 30 }, { '30': 300 }],
		},
		L4: {
			label: 'Lyre',
			paytable: [{ '8': 0.5 }, { '9': 2 }, { '12': 4 }, { '15': 10 }, { '20': 20 }, { '30': 200 }],
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

	/** Multiplier values that can appear on 'M' symbols */
	multiplierValues: [2, 3, 5, 8, 10, 15, 20, 25, 50, 100],

	/** Free spins configuration */
	freeSpins: {
		/** Number of scatters needed to trigger */
		triggerCount: 4,
		/** Free spins awarded per trigger level */
		awarded: { 4: 15, 5: 20, 6: 25 },
	},
} as const;

export default config;
