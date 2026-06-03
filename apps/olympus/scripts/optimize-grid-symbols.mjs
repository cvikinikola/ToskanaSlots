/**
 * Normalize grid symbols: 512×512, transparent BG (knock out near-black),
 * optimized WebP for in-game load (assets.ts uses sym_*.webp only).
 *
 * Usage: node scripts/optimize-grid-symbols.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THOR = path.join(__dirname, '../static/assets/sprites/thor');

const GRID = ['sym_h1', 'sym_h2', 'sym_h3', 'sym_h4', 'sym_l1', 'sym_l2', 'sym_l3', 'sym_s'];

/** Typo / legacy PNG names → canonical sym_* base */
const SOURCE_ALIASES = {
	sym_h1: ['sum_h1'],
};

const OUT_SIZE = 512;
const WEBP_QUALITY = 82;
const ALPHA_CUTOFF = 28; // treat near-black as transparent

async function pickSource(base) {
	const candidates = [
		...['.png', '.webp'].map((ext) => base + ext),
		...(SOURCE_ALIASES[base] ?? []).flatMap((stem) => ['.png', '.webp'].map((ext) => stem + ext)),
	];

	for (const file of candidates) {
		const p = path.join(THOR, file);
		try {
			const s = await stat(p);
			return { path: p, file, size: s.size };
		} catch {
			/* try next */
		}
	}
	return null;
}

/** Knock out dark background; keep subject + soft glow. */
async function removeDarkBackground(inputPath) {
	const { data, info } = await sharp(inputPath)
		.ensureAlpha()
		.resize(OUT_SIZE, OUT_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.raw()
		.toBuffer({ resolveWithObject: true });

	const out = Buffer.from(data);
	for (let i = 0; i < info.width * info.height; i++) {
		const o = i * 4;
		const r = out[o];
		const g = out[o + 1];
		const b = out[o + 2];
		if (r <= ALPHA_CUTOFF && g <= ALPHA_CUTOFF && b <= ALPHA_CUTOFF) {
			out[o + 3] = 0;
		}
	}

	return sharp(out, {
		raw: { width: info.width, height: info.height, channels: 4 },
	});
}

async function optimizeOne(base) {
	const src = await pickSource(base);
	if (!src) {
		console.warn(`skip ${base}: no .png or .webp`);
		return;
	}

	const pipeline = await removeDarkBackground(src.path);
	const outPath = path.join(THOR, `${base}.webp`);
	const before = (await stat(outPath).catch(() => null))?.size;

	await pipeline
		.webp({ quality: WEBP_QUALITY, alphaQuality: 100, effort: 6 })
		.toFile(outPath);

	const after = (await stat(outPath)).size;
	const meta = await sharp(outPath).metadata();

	console.log(
		`${base}: ${src.file} ${Math.round(src.size / 1024)}KB → webp ${Math.round(after / 1024)}KB (${meta.width}×${meta.height})` +
			(before ? ` [was ${Math.round(before / 1024)}KB]` : ''),
	);
}

console.log(`Grid symbols → ${OUT_SIZE}px transparent WebP (q=${WEBP_QUALITY})\n`);
for (const base of GRID) {
	await optimizeOne(base);
}
console.log('\nDone. Game loads only sym_*.webp from assets.ts.');
