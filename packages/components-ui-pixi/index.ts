import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';
import UiAssetSprite from './src/components/UiAssetSprite.svelte';
import LabelBet from './src/components/LabelBet.svelte';
import ButtonIncrease from './src/components/ButtonIncrease.svelte';
import ButtonDecrease from './src/components/ButtonDecrease.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';

export * from './src/constants';
export { messagesMap, i18nDerived, UI, UiGameName, UiAssetSprite, LabelBet, ButtonIncrease, ButtonDecrease };
