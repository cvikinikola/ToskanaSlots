/**
 * Asset registry for Toskany Harvest.
 * Symbol sprites are served from `apps/toskany/static/assets/sprites/harvest/`.
 */
import { SPRITE_BASE } from './assetPaths';

const sprite = (path: string, preload = true) =>
	({ type: 'sprite' as const, src: path, preload });

const BASE = SPRITE_BASE;
const MENU_BAR = '/assets/sprites/menuBar';
const COIN = '/assets/sprites/coin';

const assets = {
	// Symbols (webp — faster loading than PNG, same quality at game sizes)
	sym_h1: sprite(`${BASE}/sym_h1.webp`),
	sym_h2: sprite(`${BASE}/sym_h2.webp`),
	sym_h3: sprite(`${BASE}/sym_h3.webp`),
	sym_h4: sprite(`${BASE}/sym_h4.webp`),
	sym_l1: sprite(`${BASE}/sym_l1.webp`),
	sym_l2: sprite(`${BASE}/sym_l2.webp`),
	sym_l3: sprite(`${BASE}/sym_l3.webp`),
	sym_s:  sprite(`${BASE}/sym_s.png`),	sym_m:  sprite(`${MENU_BAR}/multi_icon.png`),

	// Background: looping MP4 via `BackgroundVideo.svelte` (not loaded here).
	logo:         sprite(`${BASE}/logo_tuscany_harvest_night.png`),	logo_day:     sprite(`${BASE}/logo_tuscany_harvest.png`, false),

	// Menu bar panels (PNG)
	menu_panel_lg: sprite(`${MENU_BAR}/panel_lg.png`),
	menu_panel_md: sprite(`${MENU_BAR}/panel_md.png`),
	menu_panel_sm: sprite(`${MENU_BAR}/panel_sm.png`),
	menu_frame_free_spins: sprite(`${MENU_BAR}/frame_free_spins.png`),
	menu_history_tumble: sprite(`${MENU_BAR}/history_tumble.png`),
	menu_frame: sprite(`${MENU_BAR}/frame.webp`),
	menu_plus: sprite(`${MENU_BAR}/plus_icon.png`),
	menu_minus: sprite(`${MENU_BAR}/minus_icon.png`),
	menu_turbo: sprite(`${MENU_BAR}/turbo_icon.png`),	menu_turbo_active: sprite(`${MENU_BAR}/turbo_active.png`),
	menu_spin: sprite(`${MENU_BAR}/spin_btn.png`),
	menu_spin_stop: sprite(`${MENU_BAR}/spin_stop_activ.png`),
	menu_auto_spin: sprite(`${MENU_BAR}/auto_spin_icon.png`),
	menu_buy_bonus: sprite(`${MENU_BAR}/buy_bonus.png`),
	menu_balance: sprite(`${MENU_BAR}/icon_balance.webp`),	menu_win: sprite(`${MENU_BAR}/icon_win.webp`),
	menu_menu: sprite(`${MENU_BAR}/menu.png`),
	menu_bet: sprite(`${MENU_BAR}/icon_bet.webp`),
	menu_paytable_btn: sprite(`${MENU_BAR}/paytuble_btn.png`),
	menu_settings_btn: sprite(`${MENU_BAR}/setings_music_btn.png`),
	menu_info_btn: sprite(`${MENU_BAR}/info_btn.png`),
	menu_sound: sprite(`${MENU_BAR}/btn_sound.webp`),
	menu_mute: sprite(`${MENU_BAR}/btn_mute.webp`),
	menu_exit_btn: sprite(`${MENU_BAR}/exit_btn.png`),

	// Free-spin intro (rooster + sunrise — local glow, night bg stays behind)
	intro_rooster_calm: sprite(`${MENU_BAR}/petao.png`),
	intro_rooster_crow: sprite(`${MENU_BAR}/petao_peva.png`),
	intro_sun: sprite(`${MENU_BAR}/sunce_bez_pozadine.png`),
	intro_sun_rays: sprite(`${MENU_BAR}/zraci_cunca.png`),

	// Free-spin outro panel (Toskany wood + gold frame)
	outro_frame: sprite(`${MENU_BAR}/outro_frame.png`),

	// Free-spin outro coin shower
	coin_00: sprite(`${COIN}/coin_00.png`),
	coin_01: sprite(`${COIN}/coin_01.png`),
	coin_02: sprite(`${COIN}/coin_02.png`),
	coin_03: sprite(`${COIN}/coin_03.png`),
	coin_04: sprite(`${COIN}/coin_04.png`),
	coin_05: sprite(`${COIN}/coin_05.png`),
	coin_06: sprite(`${COIN}/coin_06.png`),
	coin_07: sprite(`${COIN}/coin_07.png`),
	coin_08: sprite(`${COIN}/coin_08.png`),
};

export default assets;
