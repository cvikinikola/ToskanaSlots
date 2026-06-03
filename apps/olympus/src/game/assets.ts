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
const MENU_BAR_BUTTONS = `${MENU_BAR}/normalized`;
const NATURE = '/assets/sprites/nature';

const assets = {
	// Grid symbols — H1–H4, L1–L3, S (7 paying + scatter)
	sym_h1: sprite(`${BASE}/sym_h1.webp`),
	sym_h2: sprite(`${BASE}/sym_h2.webp`),
	sym_h3: sprite(`${BASE}/sym_h3.webp`),
	sym_h4: sprite(`${BASE}/sym_h4.webp`),
	sym_l1: sprite(`${BASE}/sym_l1.webp`),
	sym_l2: sprite(`${BASE}/sym_l2.webp`),
	sym_l3: sprite(`${BASE}/sym_l3.webp`),
	sym_s:  sprite(`${BASE}/sym_s.webp`),
	// UI-only (free-spin intro) — never on the grid
	sym_m:  sprite(`${BASE}/sym_m.webp`),

	// Scene — orientation-aware backgrounds (Pragmatic-style).
	// `bg_landscape` / `bg_portrait` for base game; `bg_freespins` during bonus.
	bg:            sprite(`${BASE}/bg.png`),
	bg_landscape:  sprite(`${BASE}/bg_landscape.png`),
	bg_portrait:   sprite(`${BASE}/bg_portrait.png`),
	bg_freespins:  sprite(`${BASE}/bg_freespins.png`),
	frame:        sprite(`${BASE}/frame.svg`),
	logo:         sprite(`${BASE}/logo.png`),
	warrior:      sprite(`${BASE}/warrior.png`),

	// Menu bar replacement art
	// Menu bar panels (balance / win / bet)
	menu_panel_balance: sprite(`${MENU_BAR}/panel_balance.webp`),
	menu_panel_win: sprite(`${MENU_BAR}/panel_win.webp`),
	menu_panel_bet: sprite(`${MENU_BAR}/panel_bet.webp`),
	menu_frame_free_spins: sprite(`${MENU_BAR}/frame_free_spins.png`),
	menu_frame: sprite(`${MENU_BAR}/frame.png`),
	/** Swap paths when portrait/landscape frame PNGs are cut. */
	menu_frame_portrait: sprite(`${MENU_BAR}/frame.png`),
	menu_frame_landscape: sprite(`${MENU_BAR}/frame.png`),
	// Menu bar — normalized WebP buttons (scripts/normalize-menu-buttons.mjs)
	menu_plus: sprite(`${MENU_BAR_BUTTONS}/plus_icon.webp`),
	menu_minus: sprite(`${MENU_BAR_BUTTONS}/minus_icon.webp`),
	menu_stop: sprite(`${MENU_BAR_BUTTONS}/stop_icon.webp`),
	menu_turbo: sprite(`${MENU_BAR_BUTTONS}/turbo_icon.webp`),
	menu_turbo_active: sprite(`${MENU_BAR_BUTTONS}/turbo_active.webp`),
	menu_auto_spin: sprite(`${MENU_BAR_BUTTONS}/auto_spin_icon.webp`),
	menu_buy_bonus: sprite(`${MENU_BAR_BUTTONS}/buy_bonus_icon.webp`),
	menu_menu: sprite(`${MENU_BAR_BUTTONS}/menu_icon.webp`),
	menu_spin: sprite(`${MENU_BAR_BUTTONS}/btn_spin.webp`),
	menu_logo: sprite(`${MENU_BAR}/humer_logo.png`),
	menu_balance: sprite(`${MENU_BAR}/icon_balance.png`),
	menu_win: sprite(`${MENU_BAR}/icon_win.png`),
	menu_bet: sprite(`${MENU_BAR}/icon_bet.png`),

	// Ambient sky wildlife (SVG silhouettes)
	bird_glide_a: sprite(`${NATURE}/bird_glide_a.svg`),
	bird_glide_b: sprite(`${NATURE}/bird_glide_b.svg`),
	bird_glide_c: sprite(`${NATURE}/bird_glide_c.svg`),
	butterfly: sprite(`${NATURE}/butterfly.svg`),

	reelhouse: {
		type: 'spine' as const,
		src: {
			atlas: new URL('../../static/assets/spines/reelhouse/reelhouse_glow.atlas', import.meta.url)
				.href,
			skeleton: new URL('../../static/assets/spines/reelhouse/reelhouse_glow.json', import.meta.url)
				.href,
			scale: 2,
		},
	},
};

export default assets;
