import { stateI18nDerived } from 'state-shared';

import { i18nDerived as i18nDerivedUiPixi } from 'components-ui-pixi';
import { i18nDerived as i18nDerivedUiHtml } from 'components-ui-html';

export const i18nDerived = {
	...i18nDerivedUiPixi,
	...i18nDerivedUiHtml,
	home: () => stateI18nDerived.translate('HOME'),
	bigWin: () => stateI18nDerived.translate('BIG WIN'),
	superWin: () => stateI18nDerived.translate('SUPER WIN'),
	megaWin: () => stateI18nDerived.translate('MEGA WIN'),
	epicWin: () => stateI18nDerived.translate('EPIC WIN'),
	legendaryWin: () => stateI18nDerived.translate('LEGENDARY WIN'),
	freeSpins: () => stateI18nDerived.translate('FREE SPINS'),
};
