/**
 * Build Stake marketing tile assets into apps/toskany/marketing/tile/
 *
 * Outputs:
 *   ToskanyHarvest-BG.png|jpg — environmental square background (2048×2048 default)
 *   ToskanyHarvest-FG.png  — Deka character, transparent PNG
 *   {provider}-Logo.png    — provider logo (transparent)
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, '..');
const outDir = path.join(appRoot, 'marketing', 'tile');
const assets = path.join(appRoot, 'static', 'assets');
const harvest = path.join(assets, 'sprites', 'harvest');

const TILE_SIZE = Number(process.env.TILE_SIZE ?? 2048);
const PROVIDER_SLUG = process.env.PROVIDER_SLUG ?? 'sample_provider';
const MAX_BG_FG_BYTES = 3 * 1024 * 1024;

fs.mkdirSync(outDir, { recursive: true });

const require = createRequire(import.meta.url);
let sharp;
try {
	sharp = require('sharp');
} catch {
	console.error('Missing sharp. Run: pnpm add -D sharp --filter toskany');
	process.exit(1);
}

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const pickBgSource = () => {
	const candidates = [
		path.join(assets, 'deka_v2_bg_day.jpg'),
		path.join(assets, 'deka_v2_bg_day.png'),
		path.join(assets, 'deka_v2_bg.jpg'),
		path.join(assets, 'deka_v2_bg.png'),
	];
	return candidates.find((p) => fs.existsSync(p)) ?? candidates[candidates.length - 1];
};

const buildBgBase = (srcPath) =>
	sharp(srcPath)
		.resize(TILE_SIZE, TILE_SIZE, {
			fit: 'cover',
			position: 'attention',
			kernel: sharp.kernel.lanczos3,
		})
		.sharpen({ sigma: 0.6, m1: 0.5, m2: 0.25, x1: 2, y2: 10, y3: 20 });

const vignetteSvg = () =>
	Buffer.from(`<svg width="${TILE_SIZE}" height="${TILE_SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="black" stop-opacity="0"/>
      <stop offset="100%" stop-color="#140c08" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

const exportBgWithinBudget = async (srcPath, fgBytes) => {
	const budget = MAX_BG_FG_BYTES - fgBytes;
	const pngPath = path.join(outDir, 'ToskanyHarvest-BG.png');
	const jpgPath = path.join(outDir, 'ToskanyHarvest-BG.jpg');

	for (const stale of [pngPath, jpgPath]) {
		if (fs.existsSync(stale)) fs.unlinkSync(stale);
	}

	const base = buildBgBase(srcPath).composite([{ input: vignetteSvg(), blend: 'over' }]);

	// Try lossless PNG first (fits at 1200px, rarely at 2048px).
	await base.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(pngPath);
	if (fs.statSync(pngPath).size <= budget) {
		return { path: pngPath, bytes: fs.statSync(pngPath).size, format: 'png' };
	}
	fs.unlinkSync(pngPath);

	// High-res BG → JPEG (allowed by checklist); pick highest quality under budget.
	let best = null;
	for (let q = 98; q >= 70; q -= 2) {
		await base
			.clone()
			.jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:4:4' })
			.toFile(jpgPath);
		const bytes = fs.statSync(jpgPath).size;
		if (bytes <= budget) {
			best = { path: jpgPath, bytes, format: 'jpg', quality: q };
			break;
		}
	}

	if (!best) {
		throw new Error(`BG cannot fit ${TILE_SIZE}px within 3 MB budget (FG uses ${formatKb(fgBytes)}).`);
	}

	return best;
};

// ── Matte keying (ported from textureMatteUtils.ts / dekaTextureCutout.ts) ───

const isNeutralBlackMatte = (r, g, b, a, maxRgb = 10, maxChroma = 6) => {
	if (a < 8) return true;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	return max <= maxRgb && max - min <= maxChroma;
};

const keyNeutralBlackMatteFromBorders = (data, width, height, maxRgb = 10, maxChroma = 6) => {
	const total = width * height;
	const visited = new Uint8Array(total);
	const queue = new Int32Array(total);
	let head = 0;
	let tail = 0;

	const trySeed = (x, y) => {
		const i = y * width + x;
		if (visited[i]) return;
		const o = i * 4;
		if (!isNeutralBlackMatte(data[o], data[o + 1], data[o + 2], data[o + 3], maxRgb, maxChroma)) return;
		visited[i] = 1;
		queue[tail++] = i;
	};

	for (let x = 0; x < width; x++) {
		trySeed(x, 0);
		trySeed(x, height - 1);
	}
	for (let y = 0; y < height; y++) {
		trySeed(0, y);
		trySeed(width - 1, y);
	}

	while (head < tail) {
		const i = queue[head++];
		const o = i * 4;
		data[o] = 0;
		data[o + 1] = 0;
		data[o + 2] = 0;
		data[o + 3] = 0;

		const x = i % width;
		const y = Math.floor(i / width);
		if (x > 0) trySeed(x - 1, y);
		if (x < width - 1) trySeed(x + 1, y);
		if (y > 0) trySeed(x, y - 1);
		if (y < height - 1) trySeed(x, y + 1);
	}
};

const isMagentaChroma = (r, g, b, a) => {
	if (a < 8) return false;
	if (r < 130 || b < 130) return false;
	if (g > 95) return false;
	if (r - g < 70 || b - g < 70) return false;
	return true;
};

const keyMagentaChromaPixels = (data) => {
	for (let i = 0; i < data.length; i += 4) {
		if (isMagentaChroma(data[i], data[i + 1], data[i + 2], data[i + 3])) {
			data[i] = 0;
			data[i + 1] = 0;
			data[i + 2] = 0;
			data[i + 3] = 0;
		}
	}
};

const isNeutralLightExportMatte = (r, g, b, a, minChannel = 172, maxChroma = 20) => {
	if (a < 6) return true;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	if (max < minChannel) return false;
	return max - min <= maxChroma;
};

const keyGlobalNeutralLightMattePixels = (data, minChannel = 172, maxChroma = 20) => {
	for (let i = 0; i < data.length; i += 4) {
		if (isNeutralLightExportMatte(data[i], data[i + 1], data[i + 2], data[i + 3], minChannel, maxChroma)) {
			data[i] = 0;
			data[i + 1] = 0;
			data[i + 2] = 0;
			data[i + 3] = 0;
		}
	}
};

const isNeutralLightMatteBorder = (r, g, b, a, minChannel = 168, maxChroma = 24) => {
	if (a < 6) return true;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	if (max < minChannel) return false;
	return max - min <= maxChroma;
};

const keyNeutralLightMatteFromBorders = (data, width, height, minChannel = 168, maxChroma = 24) => {
	const total = width * height;
	const visited = new Uint8Array(total);
	const queue = new Int32Array(total);
	let head = 0;
	let tail = 0;

	const trySeed = (x, y) => {
		const i = y * width + x;
		if (visited[i]) return;
		const o = i * 4;
		if (!isNeutralLightMatteBorder(data[o], data[o + 1], data[o + 2], data[o + 3], minChannel, maxChroma)) return;
		visited[i] = 1;
		queue[tail++] = i;
	};

	for (let x = 0; x < width; x++) {
		trySeed(x, 0);
		trySeed(x, height - 1);
	}
	for (let y = 0; y < height; y++) {
		trySeed(0, y);
		trySeed(width - 1, y);
	}

	while (head < tail) {
		const i = queue[head++];
		const o = i * 4;
		data[o] = 0;
		data[o + 1] = 0;
		data[o + 2] = 0;
		data[o + 3] = 0;

		const x = i % width;
		const y = Math.floor(i / width);
		if (x > 0) trySeed(x - 1, y);
		if (x < width - 1) trySeed(x + 1, y);
		if (y > 0) trySeed(x, y - 1);
		if (y < height - 1) trySeed(x, y + 1);
	}
};

const cutoutDeka = async (srcPath) => {
	const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	keyNeutralBlackMatteFromBorders(data, info.width, info.height);
	return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
};

const cutoutDayLogo = async (srcPath) => {
	const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	keyMagentaChromaPixels(data);
	keyNeutralLightMatteFromBorders(data, info.width, info.height);
	keyGlobalNeutralLightMattePixels(data, 168, 22);
	keyGlobalNeutralLightMattePixels(data, 148, 16);
	return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
};

const trimAndScale = async (pngBuffer, maxHeight) => {
	const img = sharp(pngBuffer);
	const meta = await img.metadata();
	const trimmed = await img.trim().toBuffer();
	const tMeta = await sharp(trimmed).metadata();
	const scale = Math.min(1, maxHeight / (tMeta.height ?? maxHeight));
	const w = Math.round((tMeta.width ?? 0) * scale);
	const h = Math.round((tMeta.height ?? 0) * scale);
	if (scale < 1) {
		return sharp(trimmed).resize(w, h, { fit: 'inside' }).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
	}
	return sharp(trimmed).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
};

console.log(`Building marketing tile assets -> ${outDir}`);

const bgSrc = pickBgSource();
const bgMeta = await sharp(bgSrc).metadata();
console.log(`  BG source: ${path.basename(bgSrc)} (${bgMeta.width}x${bgMeta.height}) -> ${TILE_SIZE}x${TILE_SIZE}`);

// ── FG (build first — BG budget depends on FG size) ──────────────────────────
const fgSrc = path.join(assets, 'deka_v2_idle.png');
const fgCut = await cutoutDeka(fgSrc);
const fgBuffer = await trimAndScale(fgCut, 1400);
const fgPath = path.join(outDir, 'ToskanyHarvest-FG.png');
fs.writeFileSync(fgPath, fgBuffer);
const fgMeta = await sharp(fgPath).metadata();
const fgBytes = fs.statSync(fgPath).size;
console.log(`  FG: ${fgPath} (${fgMeta.width}x${fgMeta.height}, ${formatKb(fgBytes)})`);

// ── BG (high-res, fits BG+FG <= 3 MB) ───────────────────────────────────────
const bgOut = await exportBgWithinBudget(bgSrc, fgBytes);
const bgMetaOut = await sharp(bgOut.path).metadata();
const bgLabel =
		bgOut.format === 'jpg' ? `${bgOut.path} (JPEG q${bgOut.quality})` : bgOut.path;
console.log(
	`  BG: ${bgLabel} (${bgMetaOut.width}x${bgMetaOut.height}, ${formatKb(bgOut.bytes)})`,
);

// ── Provider logo ────────────────────────────────────────────────────────────
const logoSrc = path.join(harvest, 'logo_tuscany_harvest.png');
const logoCut = await cutoutDayLogo(logoSrc);
const logoBuffer = await trimAndScale(logoCut, 480);
const logoPath = path.join(outDir, `${PROVIDER_SLUG}-Logo.png`);
fs.writeFileSync(logoPath, logoBuffer);
const logoMeta = await sharp(logoPath).metadata();
console.log(`  Logo: ${logoPath} (${logoMeta.width}x${logoMeta.height}, ${formatKb(fs.statSync(logoPath).size)})`);

const total = bgOut.bytes + fgBytes;
console.log(`  BG+FG total: ${(total / (1024 * 1024)).toFixed(2)} MB (limit 3 MB)`);

console.log('Done.');
