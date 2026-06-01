import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

import type { SymbolName } from './types';

/** Short labels for tumble win formula (testing / debug UI). */
export const SYMBOL_BREAKDOWN_LABELS: Partial<Record<SymbolName, string>> = {
	H1: 'vino',
	H2: 'sir',
	H3: 'grozde crno',
	H4: 'grozde belo',
	L1: 'masline',
	L2: 'suncokret',
	L3: 'grozde',
	S: 'scatter',
};

/** Show full formula on tumble panels (5 × grozde × 8 = $…). */
export const SHOW_TUMBLE_WIN_FORMULA = import.meta.env.DEV;

export type TumbleBreakdownLine = {
	count: number;
	symbol: SymbolName;
	/** Final win in book units (after spot mult). */
	amount: number;
	/** Paytable win in book units (before spot mult). */
	baseAmount: number;
	/** Combined spot mult applied to this cluster (×1 when none). */
	spotMult: number;
	/** Human-readable formula for testing. */
	formulaText: string;
};

const symbolLabel = (symbol: SymbolName) =>
	SYMBOL_BREAKDOWN_LABELS[symbol] ?? symbol.toLowerCase();

/** e.g. "5 × grozde = $0.40" or "5 × grozde × 8 = $3.20" */
export const formatTumbleFormulaText = (opts: {
	count: number;
	symbol: SymbolName;
	baseAmount: number;
	spotMult: number;
	amount: number;
}) => {
	const name = symbolLabel(opts.symbol);
	const base = bookEventAmountToCurrencyString(opts.baseAmount);
	const total = bookEventAmountToCurrencyString(opts.amount);
	if (opts.spotMult > 1) {
		return `${opts.count} × ${name} = ${base} × ${opts.spotMult} = ${total}`;
	}
	return `${opts.count} × ${name} = ${total}`;
};

export const buildTumbleBreakdownLine = (win: {
	symbol: SymbolName;
	win: number;
	positions: { reel: number; row: number }[];
	meta: {
		spotMult?: number;
		winWithoutMult?: number;
	};
}): TumbleBreakdownLine => {
	const count = win.positions.length;
	const spotMult = win.meta.spotMult ?? 1;
	const baseAmount = win.meta.winWithoutMult ?? win.win;
	const amount = win.win;
	const formulaText = formatTumbleFormulaText({
		count,
		symbol: win.symbol,
		baseAmount,
		spotMult,
		amount,
	});

	if (SHOW_TUMBLE_WIN_FORMULA) {
		console.info('[tumble]', formulaText);
	}

	return { count, symbol: win.symbol, amount, baseAmount, spotMult, formulaText };
};
