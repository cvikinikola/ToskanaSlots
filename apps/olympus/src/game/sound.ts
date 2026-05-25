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
	| 'sfx_reel_stop_1'
	// UI
	| 'sfx_btn_general'
	| 'sfx_btn_spin'
	// Win
	| 'sfx_coin_clink'
	| 'sfx_thunder'
	| 'sfx_thunder_clap';

export type SoundName = MusicName | SoundEffectName;

/**
 * Sound player instances.
 * Placeholder – wire up to real audio files when assets are ready.
 * The `createSound` factory returns objects compatible with the SDK's sound emitter events.
 */
export const sound = createSound<MusicName, SoundEffectName>({
	music: {},
	sfx: {},
});
