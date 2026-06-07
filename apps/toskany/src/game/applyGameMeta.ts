import { stateMeta, type BetModeMeta } from 'state-shared';

import config from './config';
import { bonusRtpLabel, buyBonusCostMultiplier, maxWinMultiplier } from './gameInfoFormat';

const MENU = '/assets/sprites/menuBar';

/** Local Toskany assets — replaces SDK `DEFAULT_BET_MODE_META` CDN URLs at runtime. */
const emptyAssets = {
	icon: '',
	volatility: '',
	button: '',
	dialogImage: '',
	dialogVolatility: '',
};

const bonusBuyAssets = {
	icon: `${MENU}/scatter_icon.webp`,
	dialogImage: `${MENU}/frame_free_spins.png`,
	dialogVolatility: '',
	volatility: '',
	button: `${MENU}/buy_bonus.png`,
};

/** Toskany Harvest bet modes — only BASE + buy bonus (no ante / super modes). */
const GAME_BET_MODE_META: BetModeMeta = {
	BASE: {
		mode: 'BASE',
		costMultiplier: 1,
		type: 'default',
		parent: '',
		children: '',
		assets: emptyAssets,
		text: {
			title: config.gameInfo.displayName,
			dialog: '',
			button: '',
			tickerIdle: '',
			tickerSpin: '',
		},
		maxWin: maxWinMultiplier,
	},
	BONUS: {
		mode: 'BONUS',
		costMultiplier: buyBonusCostMultiplier,
		type: 'buy',
		parent: '',
		children: '',
		assets: bonusBuyAssets,
		text: {
			title: 'Vendemmia Free Spins',
			dialog: `Instantly trigger Vendemmia Free Spins for ${buyBonusCostMultiplier}× your total bet. On the triggering spin, 3 to 7 Vinar (Scatter) symbols may appear. Spot multipliers remain on the grid for the entire bonus and keep doubling up to ×${config.spotMultipliers.maxMultiplier}. Theoretical RTP: ${bonusRtpLabel}.`,
			description:
				'Buy direct entry to Vendemmia Free Spins with persistent spot multipliers on the 7×7 grid.',
			button: 'BUY',
			tickerIdle: 'PLACE YOUR BET',
			tickerSpin: 'VENDEMMIA FREE SPINS',
		},
		maxWin: maxWinMultiplier,
	},
};

/** Clears SDK sample CDN URLs from gameRuleMeta (Toskany uses custom rules/paytable snippets). */
const GAME_GAME_RULE_META = {
	payTable: [],
	gameRules: [],
	splashScreen: [],
};

export const applyGameMeta = () => {
	stateMeta.betModeMeta = GAME_BET_MODE_META;
	stateMeta.gameRuleMeta = GAME_GAME_RULE_META;
};

applyGameMeta();
