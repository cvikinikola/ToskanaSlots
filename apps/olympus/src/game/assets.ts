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
};

export default assets;
