/**
 * Trim transparent padding from menu-bar button WebPs, then scale visible artwork
 * so every button shares the same height (plus/minus reference).
 *
 * Usage: node scripts/normalize-menu-buttons.mjs
 */
import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_BAR = path.join(__dirname, '../static/assets/sprites/menuBar');
const OUTPUT_DIR = path.join(MENU_BAR, 'normalized');

const SQUARE_BUTTONS = ['plus_icon.webp', 'minus_icon.webp'];
const WIDE_BUTTONS = [
	'menu_icon.webp',
	'stop_icon.webp',
	'turbo_icon.webp',
	'turbo_active.webp',
	'auto_spin_icon.webp',
	'buy_bonus_icon.webp',
];

const TRIM_THRESHOLD = 10;
const WEBP_QUALITY = 92;

async function trimmedMeta(filePath) {
	const { data, info } = await sharp(filePath)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });

	let minX = info.width;
	let minY = info.height;
	let maxX = 0;
	let maxY = 0;

	for (let y = 0; y < info.height; y++) {
		for (let x = 0; x < info.width; x++) {
			const alpha = data[(y * info.width + x) * 4 + 3];
			if (alpha > TRIM_THRESHOLD) {
				minX = Math.min(minX, x);
				minY = Math.min(minY, y);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, y);
			}
		}
	}

	if (maxX < minX || maxY < minY) {
		throw new Error(`No opaque pixels in ${filePath}`);
	}

	return {
		left: minX,
		top: minY,
		width: maxX - minX + 1,
		height: maxY - minY + 1,
	};
}

async function referenceHeight() {
	const heights = await Promise.all(
		SQUARE_BUTTONS.map(async (file) => {
			const bounds = await trimmedMeta(path.join(MENU_BAR, file));
			return bounds.height;
		}),
	);
	return Math.max(...heights);
}

async function normalizeButton(file, refHeight, square) {
	const input = path.join(MENU_BAR, file);
	const bounds = await trimmedMeta(input);

	const scale = square
		? Math.min(refHeight / bounds.width, refHeight / bounds.height)
		: refHeight / bounds.height;
	const scaledW = Math.max(1, Math.round(bounds.width * scale));
	const scaledH = Math.max(1, Math.round(bounds.height * scale));
	const canvasW = square ? refHeight : scaledW;
	const canvasH = refHeight;

	const artwork = await sharp(input)
		.extract({
			left: bounds.left,
			top: bounds.top,
			width: bounds.width,
			height: bounds.height,
		})
		.resize(scaledW, scaledH, { fit: 'fill' })
		.png()
		.toBuffer();

	const left = Math.round((canvasW - scaledW) / 2);
	const top = Math.round((canvasH - scaledH) / 2);

	const output = await sharp({
		create: {
			width: canvasW,
			height: canvasH,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([{ input: artwork, left, top }])
		.webp({ quality: WEBP_QUALITY, alphaQuality: 100, lossless: false })
		.toBuffer();

	await writeFile(path.join(OUTPUT_DIR, file), output);

	console.log(
		`${file}: trim ${bounds.width}x${bounds.height} -> canvas ${canvasW}x${canvasH} (art ${scaledW}x${scaledH})`,
	);
}

const refHeight = await referenceHeight();
await mkdir(OUTPUT_DIR, { recursive: true });
console.log(`Reference visible height (plus/minus): ${refHeight}px\n`);

for (const file of SQUARE_BUTTONS) {
	await normalizeButton(file, refHeight, true);
}
for (const file of WIDE_BUTTONS) {
	await normalizeButton(file, refHeight, false);
}

const spinHeight = Math.round(refHeight * 1.18);
await normalizeButton('btn_spin.webp', spinHeight, true);

console.log('\nDone.');
