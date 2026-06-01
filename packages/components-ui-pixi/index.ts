import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';
import UiAssetSprite from './src/components/UiAssetSprite.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';

export {
	landscapeBottomReservePx,
	landscapeRightReservePx,
	landscapeStackedLayout,
	landscapeTopReservePx,
	portraitBottomReservePx,
	portraitStackedLayout,
	type LandscapeStackedLayout,
	type PortraitCanvasSizeType,
} from './src/constants';

export { messagesMap, i18nDerived, UI, UiGameName, UiAssetSprite };
