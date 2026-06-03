import UI from './src/components/UI.svelte';
import UiGameName from './src/components/UiGameName.svelte';
import UiAssetSprite from './src/components/UiAssetSprite.svelte';

import messagesMap from './src/i18n/messagesMap';
import { i18nDerived } from './src/i18n/i18nDerived';

export * from './src/types';

export {
	applyLandscapeUiRuntime,
	applyPortraitUiRuntime,
	isCompactPortraitHud,
	landscapeActionRowCentersAt,
	landscapeBottomReservePx,
	landscapePanelRowCentersAt,
	landscapeRightReservePx,
	landscapeStackedLayout,
	landscapeTopReservePx,
	portraitBottomReservePx,
	portraitStackedLayout,
	portraitUiRuntime,
	WOODEN_PANEL_HEIGHT,
	WOODEN_PANEL_WIDTH,
	WOODEN_PANEL_LABEL_FONT_MUL,
	WOODEN_PANEL_VALUE_FONT_MUL,
	UI_BASE_FONT_SIZE,
	type LandscapeStackedLayout,
	type PortraitCanvasSizeType,
} from './src/constants';

export { messagesMap, i18nDerived, UI, UiGameName, UiAssetSprite };
