import config from './config';

/** Format RTP decimal (e.g. 0.972) as display percentage (97.20%). */
export const formatRtpPercent = (rtp: number) => `${(rtp * 100).toFixed(2)}%`;

export const formatUsd = (amount: number) =>
	new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export const gameDisplayName = config.gameInfo.displayName;
export const gameBlurb = config.gameInfo.blurb;
export const gameBlurbShort = config.gameInfo.blurbShort;
export const baseRtpLabel = formatRtpPercent(config.betModes.base.rtp);
export const bonusRtpLabel = formatRtpPercent(config.betModes.bonus.rtp);
export const maxWinMultiplier = config.betModes.base.max_win;
export const buyBonusCostMultiplier = config.betModes.bonus.cost;
