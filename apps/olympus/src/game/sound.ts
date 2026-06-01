import { createSound } from 'utils-sound';

// ─── Music tracks ─────────────────────────────────────────────────────────────

export type MusicName =
	| 'bgm_main'
	| 'bgm_freespin'
	| 'bgm_winlevel_big'
	| 'bgm_winlevel_superwin'
	| 'bgm_winlevel_mega'
	| 'bgm_winlevel_epic'
	| 'bgm_winlevel_max';

// ─── Sound effects ────────────────────────────────────────────────────────────

export type SoundEffectName =
	// Scatter
	| 'sfx_scatter_1'
	| 'sfx_scatter_2'
	| 'sfx_scatter_3'
	| 'sfx_scatter_4'
	| 'sfx_scatter_5'
	// Multiplier
	| 'sfx_multiplier_landing'
	| 'sfx_multiplier_reset'
	| 'sfx_multiplier_update'
	| 'sfx_multiplier_win'
	| 'sfx_multiplier_explosion_a'
	| 'sfx_multiplier_explosion_b'
	// Tumble / win
	| 'sfx_tumble_explode'
	| 'sfx_tumble_fall'
	| 'sfx_winlevel_small'
	| 'sfx_winlevel_end'
	| 'sfx_bigwin_coinloop'
	| 'sfx_youwon_panel'
	// Free spins
	| 'sfx_scatter_win_v2'
	| 'sfx_superfreespin'
	| 'jng_intro_fs'
	// Reels
	| 'sfx_reel_spin'
	| 'sfx_reel_stop_1'
	| 'sfx_symbol_destroy'
	// UI
	| 'sfx_btn_general'
	| 'sfx_btn_spin'
	// Win
	| 'sfx_coin_clink'
	| 'sfx_bird_chirp'
	| 'sfx_cricket'
	| 'sfx_nature_burst';

export type SoundName = MusicName | SoundEffectName;

/** Reserved for utils-sound if we wire the sprite sheet later; stop SFX uses local mp3 in Sound.svelte. */
export const sound = createSound<SoundName>();
