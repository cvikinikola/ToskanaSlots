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
	sym_h4: sprite(`${BASE}/sym_h4.png`),
	sym_l1: sprite(`${BASE}/sym_l1.png`),
	sym_l2: sprite(`${BASE}/sym_l2.webp`),
	sym_l3: sprite(`${BASE}/sym_l3.webp`),
	sym_l4: sprite(`${BASE}/sym_l4.webp`),
	sym_s:  sprite(`${BASE}/sym_s.png`),
	sym_m:  sprite(`${BASE}/sym_m.webp`),

	// Background: looping MP4 via `BackgroundVideo.svelte` (not loaded here).
	frame:        sprite(`${BASE}/frame.svg`),
	logo:         sprite(`${BASE}/logo.webp`),

	// Menu bar panels (PNG)
	menu_panel_lg: sprite(`${MENU_BAR}/panel_lg.png`),
	menu_panel_md: sprite(`${MENU_BAR}/panel_md.png`),
	menu_panel_sm: sprite(`${MENU_BAR}/panel_sm.png`),
	menu_frame_free_spins: sprite(`${MENU_BAR}/frame_free_spins.webp`),
	menu_history_tumble: sprite(`${MENU_BAR}/history_tumble.png`),
	menu_frame: sprite(`${MENU_BAR}/frame.webp`),
	menu_plus: sprite(`${MENU_BAR}/plus_icon.png`),
	menu_minus: sprite(`${MENU_BAR}/minus_icon.png`),
	menu_stop: sprite(`${MENU_BAR}/stop_icon.webp`),
	menu_turbo: sprite(`${MENU_BAR}/turbo_icon.png`),
	menu_turbo_active: sprite(`${MENU_BAR}/turbo_active.png`),
	menu_spin: sprite(`${MENU_BAR}/spin_btn.png`),
	menu_spin_stop: sprite(`${MENU_BAR}/spin_stop_activ.png`),
	menu_auto_spin: sprite(`${MENU_BAR}/auto_spin_icon.png`),
	menu_buy_bonus: sprite(`${MENU_BAR}/buy_bonus.png`),
	menu_logo: sprite(`${MENU_BAR}/humer_logo.webp`),
	menu_balance: sprite(`${MENU_BAR}/icon_balance.webp`),
	menu_win: sprite(`${MENU_BAR}/icon_win.webp`),
	menu_menu: sprite(`${MENU_BAR}/menu.png`),
	menu_bet: sprite(`${MENU_BAR}/icon_bet.webp`),
};

export default assets;
