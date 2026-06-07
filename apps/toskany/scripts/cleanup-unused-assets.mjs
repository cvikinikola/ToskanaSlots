/**
 * One-off: list/delete static files not referenced by apps/toskany/src.
 * Run: node scripts/cleanup-unused-assets.mjs [--delete]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const staticDir = path.join(root, 'static');
const deleteMode = process.argv.includes('--delete');

const KEEP_STATIC_ROOT = new Set(['favicon.svg', 'stake-engine-loader.gif']);

/** Whole trees that are SDK / legacy leftovers — never referenced in src. */
const DELETE_DIRS = [
	'assets/spines',
	'assets/fonts',
	'assets/sprites/thor',
	'assets/sprites/freeSpins',
	'assets/sprites/payFrame',
	'assets/sprites/pressToContinueText',
	'assets/sprites/progressBar',
	'assets/sprites/reelsFrame',
	'assets/sprites/symbolsStatic',
	'assets/sprites/uiSlotsAssetsBespoke',
	'assets/sprites/winSmall',
	'models',
];

/** Dead Thor-era components (not imported anywhere). */
const DELETE_SRC = [
	'src/components/SideWarrior.svelte',
	'src/components/AmbientLightning.svelte',
	'src/components/SkyLightning.svelte',
	'src/components/LightningCrackle.svelte',
	'scripts/gen-thor-assets.mjs',
];

function walkFiles(dir, out = []) {
	if (!fs.existsSync(dir)) return out;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, entry.name);
		if (entry.isDirectory()) walkFiles(p, out);
		else out.push(p);
	}
	return out;
}

function collectReferences() {
	const refs = new Set();
	for (const file of walkFiles(srcDir)) {
		const text = fs.readFileSync(file, 'utf8');
		for (const m of text.matchAll(/\/assets\/[A-Za-z0-9_./\- %]+?\.(?:webp|png|svg|mp3|wav|mp4|gif|jpg|jpeg|glb)/g)) {
			refs.add(m[0].split('?')[0]);
		}
		// assets.ts template paths: `${MENU_BAR}/spin_btn.png`, `${BASE}/sym_h1.webp`, etc.
		for (const m of text.matchAll(/\$\{(BASE|MENU_BAR|COIN|SPRITE_BASE|MENU)\}\/([^'`"]+)/g)) {
			const baseMap = {
				BASE: '/assets/sprites/harvest',
				SPRITE_BASE: '/assets/sprites/harvest',
				MENU_BAR: '/assets/sprites/menuBar',
				MENU: '/assets/sprites/menuBar',
				COIN: '/assets/sprites/coin',
			};
			const base = baseMap[m[1]];
			if (base) refs.add(`${base}/${m[2]}`);
		}
	}
	refs.add('/stake-engine-loader.gif');
	return refs;
}

const refs = collectReferences();
const refBasenames = new Set([...refs].map((r) => path.basename(r)));

const toDelete = [];

for (const rel of DELETE_DIRS) {
	const abs = path.join(staticDir, rel);
	if (fs.existsSync(abs)) toDelete.push(abs);
}

for (const rel of DELETE_SRC) {
	const abs = path.join(root, rel);
	if (fs.existsSync(abs)) toDelete.push(abs);
}

// Unused files inside kept dirs (harvest/menuBar/coin/audio)
for (const file of walkFiles(staticDir)) {
	const rel = path.relative(staticDir, file).replace(/\\/g, '/');
	if (DELETE_DIRS.some((d) => rel === d || rel.startsWith(`${d}/`))) continue;
	if (!rel.includes('/') && KEEP_STATIC_ROOT.has(path.basename(file))) continue;

	const url = `/assets/${rel.replace(/^assets\//, '')}`;
	if (refs.has(url)) continue;

	// static/loader.gif — not under /assets/
	if (rel === 'loader.gif') {
		toDelete.push(file);
		continue;
	}

	if (rel.startsWith('assets/')) toDelete.push(file);
}

// Dedupe files vs dirs (delete dirs wholesale)
const dirDeletes = toDelete.filter((p) => fs.existsSync(p) && fs.statSync(p).isDirectory());
const fileDeletes = toDelete.filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());

console.log(`Referenced asset URLs: ${refs.size}`);
console.log(`Dirs to remove: ${dirDeletes.length}`);
for (const d of dirDeletes.sort()) console.log('  [dir]', path.relative(root, d));
console.log(`Files to remove: ${fileDeletes.length}`);
for (const f of fileDeletes.sort()) console.log('  [file]', path.relative(root, f));

if (!deleteMode) {
	console.log('\nDry run — pass --delete to remove.');
	process.exit(0);
}

function rm(p) {
	if (fs.statSync(p).isDirectory()) fs.rmSync(p, { recursive: true, force: true });
	else fs.unlinkSync(p);
}

for (const p of [...dirDeletes, ...fileDeletes]) {
	try {
		rm(p);
	} catch (e) {
		console.error('Failed:', p, e.message);
	}
}
console.log('Done.');
