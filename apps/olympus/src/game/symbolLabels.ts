import type { SymbolName } from './types';

export type SymbolLabelEntry = {
	en: string;
	sr: string;
	assetKey: string;
	assetFile: string;
};

/** Canonical Toskany Harvest symbol names — single source of truth for UI & config. */
export const SYMBOL_LABELS: Record<SymbolName, SymbolLabelEntry> = {
	H1: {
		en: 'Red Wine Bottle',
		sr: 'Vino',
		assetKey: 'sym_h1',
		assetFile: 'sym_h1.webp',
	},
	H2: {
		en: 'Pecorino Cheese',
		sr: 'Sir',
		assetKey: 'sym_h2',
		assetFile: 'sym_h2.webp',
	},
	H3: {
		en: 'Black Grapes',
		sr: 'Grožđe crno',
		assetKey: 'sym_h3',
		assetFile: 'sym_h3.webp',
	},
	H4: {
		en: 'Red Grapes',
		sr: 'Grožđe crveno',
		assetKey: 'sym_h4',
		assetFile: 'sym_h4.webp',
	},
	L1: {
		en: 'White Grapes',
		sr: 'Grožđe belo',
		assetKey: 'sym_l1',
		assetFile: 'sym_l1.webp',
	},
	L2: {
		en: 'Olives',
		sr: 'Masline',
		assetKey: 'sym_l2',
		assetFile: 'sym_l2.webp',
	},
	L3: {
		en: 'Sunflower',
		sr: 'Suncokret',
		assetKey: 'sym_l3',
		assetFile: 'sym_l3.webp',
	},
	S: {
		en: 'Vinar',
		sr: 'Vinar',
		assetKey: 'sym_s',
		assetFile: 'sym_s.png',
	},
};

export const UI_SYMBOL_LABELS = {
	M: {
		en: 'Multiplier',
		sr: 'Množilac',
		assetKey: 'sym_m',
		assetFile: 'sym_m.webp',
	},
} as const satisfies Record<string, SymbolLabelEntry>;

export const symbolEnglishLabel = (name: SymbolName) => SYMBOL_LABELS[name].en;

export const symbolSerbianLabel = (name: SymbolName) => SYMBOL_LABELS[name].sr;

export const formatSymbolLabel = (name: SymbolName, both = true) => {
	const entry = SYMBOL_LABELS[name];
	return both ? `${entry.en} / ${entry.sr}` : entry.en;
};

export const symbolAssetPath = (name: SymbolName, base = '/assets/sprites/thor') =>
	`${base}/${SYMBOL_LABELS[name].assetFile}`;
