import { bookEventAmountToCurrencyString } from 'utils-shared/amount';

import type { SymbolName } from './types';
import type { BookEventOfType } from './typesBookEvent';

export type TumbleBreakdownLine = {
	count: number;
	symbol: SymbolName;
	/** Post–spot-mult win (`win.win`, book units). */
	amount: number;
	/** Pre–spot-mult win (`win.meta.winWithoutMult`). */
	baseAmount: number;
	/** Applied spot multiplier (1 = none). Sum of spot values on winning cells. */
	spotMult: number;
};

type WinPayload = BookEventOfType<'winInfo'>['wins'][number];

export const buildTumbleBreakdownLine = (win: WinPayload): TumbleBreakdownLine => ({
	count: win.positions.length,
	symbol: win.symbol,
	amount: win.win,
	baseAmount: win.meta.winWithoutMult,
	spotMult: win.meta.spotMult ?? 1,
});

export const formatTumbleWinPaysText = (line: TumbleBreakdownLine): string => {
	const base = bookEventAmountToCurrencyString(line.baseAmount);
	if (line.spotMult > 1) {
		const total = bookEventAmountToCurrencyString(line.amount);
		return `pays ${base} * ${line.spotMult} = ${total}`;
	}
	return `pays ${base}`;
};

export const formatTumbleHistoryLine = (line: TumbleBreakdownLine): string => {
	const total = bookEventAmountToCurrencyString(line.amount);
	if (line.spotMult > 1) {
		return `×${line.spotMult} = ${total}`;
	}
	return `= ${total}`;
};
