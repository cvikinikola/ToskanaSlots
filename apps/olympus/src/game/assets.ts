/**
 * Asset registry for Hammer of Thor.
 * Placeholder Viking-themed SVGs are registered as `sprite` textures.
 * `preload: true` keeps the loading screen visible until they're ready.
 *
 * Files are served by SvelteKit from `apps/olympus/static/assets/sprites/thor/`
 * at root URL `/assets/sprites/thor/...`.
 */
const sprite = (path: string, preload = true) =>
	({ type: 'sprite' as const, src: path, preload });

const BASE = '/assets/sprites/thor';
const MENU_BAR = '/assets/sprites/menuBar';

const assets = {
	// Symbols (photo-realistic transparent PNGs)
	sym_h1: sprite(`${BASE}/sym_h1.png`),
	sym_h2: sprite(`${BASE}/sym_h2.png`),
	sym_h3: sprite(`${BASE}/sym_h3.png`),
	sym_h4: sprite(`${BASE}/sym_h4.png`),
	sym_l1: sprite(`${BASE}/sym_l1.png`),
	sym_l2: sprite(`${BASE}/sym_l2.png`),
	sym_l3: sprite(`${BASE}/sym_l3.png`),
	sym_l4: sprite(`${BASE}/sym_l4.png`),
	sym_s:  sprite(`${BASE}/sym_s.png`),
	sym_m:  sprite(`${BASE}/sym_m.png`),

	// Scene — orientation-aware backgrounds (Pragmatic-style).
	// `bg_landscape` (2560×1080) is used on desktop / wide / tablet / landscape.
	// `bg_portrait`  (1024×1536) is used on phone-portrait viewports.
	// `bg` and `bg_freespins` are kept as fallbacks (free spins still uses the
	// original aurora artwork until a portrait/landscape pair is provided).
	bg:            sprite(`${BASE}/bg.png`),
	bg_landscape:  sprite(`${BASE}/bg_landscape.png`),
	bg_portrait:   sprite(`${BASE}/bg_portrait.png`),
	bg_freespins:  sprite(`${BASE}/bg_freespins.png`),
	frame:        sprite(`${BASE}/frame.svg`),
	logo:         sprite(`${BASE}/logo.png`),
	warrior:      sprite(`${BASE}/warrior.png`),

	// Menu bar replacement art
	menu_panel_lg: sprite(`${MENU_BAR}/panel_lg.png`),
	menu_panel_md: sprite(`${MENU_BAR}/panel_md.png`),
	menu_panel_sm: sprite(`${MENU_BAR}/panel_sm.png`),
	menu_plus: sprite(`${MENU_BAR}/plus_icon.png`),
	menu_minus: sprite(`${MENU_BAR}/minus_icon.png`),
	menu_stop: sprite(`${MENU_BAR}/stop_icon.png`),
	menu_turbo: sprite(`${MENU_BAR}/turbo_icon.png`),
	menu_spin: sprite(`${MENU_BAR}/btn_spin.png`),
	menu_auto_spin: sprite(`${MENU_BAR}/auto_spin_icon.png`),
	menu_buy_bonus: sprite(`${MENU_BAR}/buy_bonus.png`),
	menu_logo: sprite(`${MENU_BAR}/humer_logo.png`),
	menu_balance: sprite(`${MENU_BAR}/icon_balance.png`),
	menu_win: sprite(`${MENU_BAR}/icon_win.png`),
	menu_menu: sprite(`${MENU_BAR}/menu.png`),
	menu_bet: sprite(`${MENU_BAR}/icon_bet.png`),
};

export default assets;
