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
	// Symbols (webp — faster loading than PNG, same quality at game sizes)
	sym_h1: sprite(`${BASE}/sym_h1.webp`),
	sym_h2: sprite(`${BASE}/sym_h2.webp`),
	sym_h3: sprite(`${BASE}/sym_h3.webp`),
	sym_h4: sprite(`${BASE}/sym_h4.webp`),
	sym_l1: sprite(`${BASE}/sym_l1.webp`),
	sym_l2: sprite(`${BASE}/sym_l2.webp`),
	sym_l3: sprite(`${BASE}/sym_l3.webp`),
	sym_l4: sprite(`${BASE}/sym_l4.webp`),
	sym_s:  sprite(`${BASE}/sym_s.webp`),
	sym_m:  sprite(`${BASE}/sym_m.webp`),

	// Scene — orientation-aware backgrounds (Pragmatic-style).
	// `bg_landscape` (2560×1080) is used on desktop / wide / tablet / landscape.
	// `bg_portrait`  (1024×1536) is used on phone-portrait viewports.
	bg:            sprite(`${BASE}/bg.webp`),
	bg_landscape:  sprite(`${BASE}/bg_landscape.webp`),
	bg_portrait:   sprite(`${BASE}/bg_portrait.webp`),
	bg_freespins:  sprite(`${BASE}/bg_freespins.webp`),
	frame:        sprite(`${BASE}/frame.svg`),
	logo:         sprite(`${BASE}/logo.webp`),

	// Menu bar replacement art (webp — smaller payload than the original PNGs)
	menu_panel_lg: sprite(`${MENU_BAR}/panel_lg.webp`),
	menu_panel_md: sprite(`${MENU_BAR}/panel_md.webp`),
	menu_panel_sm: sprite(`${MENU_BAR}/panel_sm.webp`),
	menu_frame_free_spins: sprite(`${MENU_BAR}/frame_free_spins.webp`),
	menu_frame: sprite(`${MENU_BAR}/frame.webp`),
	menu_plus: sprite(`${MENU_BAR}/plus_icon.webp`),
	menu_minus: sprite(`${MENU_BAR}/minus_icon.webp`),
	menu_stop: sprite(`${MENU_BAR}/stop_icon.webp`),
	menu_turbo: sprite(`${MENU_BAR}/turbo_icon.webp`),
	menu_turbo_active: sprite(`${MENU_BAR}/turbo_active.webp`),
	menu_spin: sprite(`${MENU_BAR}/btn_spin.webp`),
	menu_auto_spin: sprite(`${MENU_BAR}/auto_spin_icon.webp`),
	menu_buy_bonus: sprite(`${MENU_BAR}/buy_bonus.webp`),
	menu_logo: sprite(`${MENU_BAR}/humer_logo.webp`),
	menu_balance: sprite(`${MENU_BAR}/icon_balance.webp`),
	menu_win: sprite(`${MENU_BAR}/icon_win.webp`),
	menu_menu: sprite(`${MENU_BAR}/menu.webp`),
	menu_bet: sprite(`${MENU_BAR}/icon_bet.webp`),
};

export default assets;
