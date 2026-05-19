// Generates Viking-themed placeholder SVG art for "Hammer of Thor".
// Aim: Gates-of-Olympus style polish — big character on left, ornate frame,
// dramatic Asgard sky, glowing gems, alternate free-spins backdrop.
// Usage: node scripts/gen-thor-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'static', 'assets', 'sprites', 'thor');
mkdirSync(OUT, { recursive: true });

const write = (name, content) => {
	writeFileSync(join(OUT, name), content.trim() + '\n', 'utf8');
	console.log('wrote', name);
};

// ─── Gem symbol generator ────────────────────────────────────────────────────
function gemSymbol({ shape, gem, hi, glow }) {
	const cx = 150, cy = 150;
	const ringOuter = 130;
	const ringInner = 110;
	const G = glow || hi;

	const defs = `
	<defs>
		<radialGradient id="aura" cx="50%" cy="50%" r="55%">
			<stop offset="0%" stop-color="#${G}" stop-opacity="0.9"/>
			<stop offset="55%" stop-color="#${G}" stop-opacity="0.25"/>
			<stop offset="100%" stop-color="#${G}" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="goldRing" cx="50%" cy="35%" r="70%">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="40%" stop-color="#ffd147"/>
			<stop offset="80%" stop-color="#a8741a"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</radialGradient>
		<radialGradient id="ringInside" cx="50%" cy="50%" r="55%">
			<stop offset="0%" stop-color="#1a0a14"/>
			<stop offset="80%" stop-color="#0a0408"/>
			<stop offset="100%" stop-color="#000"/>
		</radialGradient>
		<radialGradient id="gemFill" cx="38%" cy="32%" r="78%">
			<stop offset="0%" stop-color="#ffffff"/>
			<stop offset="18%" stop-color="#${hi}"/>
			<stop offset="65%" stop-color="#${gem}"/>
			<stop offset="100%" stop-color="#1a0a14"/>
		</radialGradient>
		<radialGradient id="shine" cx="35%" cy="22%" r="38%">
			<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
			<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="rivet" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="100%" stop-color="#7a5418"/>
		</linearGradient>
	</defs>`;

	const aura = `<circle cx="${cx}" cy="${cy}" r="148" fill="url(#aura)"/>`;
	const ring = `
		<circle cx="${cx}" cy="${cy}" r="${ringOuter}" fill="url(#goldRing)"/>
		<circle cx="${cx}" cy="${cy}" r="${ringInner}" fill="url(#ringInside)"/>
		<circle cx="${cx}" cy="${cy - 4}" r="${ringInner + 2}" fill="none" stroke="#fff8d4" stroke-width="2" stroke-opacity="0.55"/>
		<circle cx="${cx}" cy="${cy + 4}" r="${ringInner + 2}" fill="none" stroke="#3a2208" stroke-width="2" stroke-opacity="0.7"/>`;
	const rivets = [0, 90, 180, 270]
		.map((a) => {
			const r = (a * Math.PI) / 180;
			const x = cx + Math.cos(r) * (ringOuter - 14);
			const y = cy + Math.sin(r) * (ringOuter - 14);
			return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="url(#rivet)" stroke="#3a2208" stroke-width="1"/>`;
		})
		.join('');

	let gemShape = '';
	let facets = '';
	const R = 88;

	if (shape === 'round') {
		gemShape = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#gemFill)" stroke="#${hi}" stroke-width="2.5"/>`;
		facets = `
			<path d="M${cx - R * 0.7},${cy - R * 0.4} L${cx + R * 0.7},${cy - R * 0.4} L${cx + R * 0.5},${cy + R * 0.7} L${cx - R * 0.5},${cy + R * 0.7} Z" fill="#${hi}" fill-opacity="0.22"/>
			<ellipse cx="${cx - R * 0.28}" cy="${cy - R * 0.45}" rx="${R * 0.45}" ry="${R * 0.18}" fill="url(#shine)"/>`;
	} else if (shape === 'square') {
		const s = R * 1.55;
		const x0 = cx - s / 2, y0 = cy - s / 2;
		gemShape = `<rect x="${x0}" y="${y0}" width="${s}" height="${s}" rx="10" fill="url(#gemFill)" stroke="#${hi}" stroke-width="2.5"/>`;
		facets = `
			<path d="M${x0},${y0} L${cx},${cy} L${x0 + s},${y0} Z" fill="#${hi}" fill-opacity="0.32"/>
			<path d="M${x0},${y0 + s} L${cx},${cy} L${x0 + s},${y0 + s} Z" fill="#000" fill-opacity="0.35"/>
			<path d="M${x0},${y0} L${cx},${cy} L${x0},${y0 + s} Z" fill="#000" fill-opacity="0.22"/>
			<ellipse cx="${cx - s * 0.2}" cy="${y0 + s * 0.18}" rx="${s * 0.24}" ry="${s * 0.1}" fill="url(#shine)"/>`;
	} else if (shape === 'diamond') {
		const d = R * 1.05;
		gemShape = `<path d="M${cx},${cy - d} L${cx + d},${cy} L${cx},${cy + d} L${cx - d},${cy} Z" fill="url(#gemFill)" stroke="#${hi}" stroke-width="2.5"/>`;
		facets = `
			<path d="M${cx},${cy - d} L${cx + d * 0.5},${cy - d * 0.1} L${cx},${cy} L${cx - d * 0.5},${cy - d * 0.1} Z" fill="#${hi}" fill-opacity="0.38"/>
			<path d="M${cx},${cy} L${cx + d * 0.5},${cy + d * 0.1} L${cx},${cy + d} L${cx - d * 0.5},${cy + d * 0.1} Z" fill="#000" fill-opacity="0.32"/>
			<ellipse cx="${cx - d * 0.18}" cy="${cy - d * 0.42}" rx="${d * 0.2}" ry="${d * 0.08}" fill="url(#shine)"/>`;
	} else if (shape === 'oval') {
		const rx = R * 0.85, ry = R * 1.05;
		gemShape = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#gemFill)" stroke="#${hi}" stroke-width="2.5"/>`;
		facets = `<ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.45}" rx="${rx * 0.4}" ry="${ry * 0.15}" fill="url(#shine)"/>`;
	}

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
${defs}
${aura}
${ring}
${rivets}
${gemShape}
${facets}
</svg>`;
}

write('sym_h1.svg', gemSymbol({ shape: 'round',   gem: 'd62828', hi: 'ff8a8a', glow: 'ff3b3b' }));
write('sym_h2.svg', gemSymbol({ shape: 'square',  gem: '0894d6', hi: '8de8ff', glow: '4cc9f0' }));
write('sym_h3.svg', gemSymbol({ shape: 'diamond', gem: '20b070', hi: '8df0b5', glow: '2ec27e' }));
write('sym_h4.svg', gemSymbol({ shape: 'oval',    gem: '8a3fcc', hi: 'd9a8ff', glow: 'b46aff' }));
write('sym_l1.svg', gemSymbol({ shape: 'diamond', gem: 'f0a930', hi: 'fff3b0', glow: 'ffd147' }));
write('sym_l2.svg', gemSymbol({ shape: 'round',   gem: '36b9d8', hi: 'baf0ff', glow: '7ddef0' }));
write('sym_l3.svg', gemSymbol({ shape: 'diamond', gem: 'ff6a1f', hi: 'ffc499', glow: 'ff8a3b' }));
write('sym_l4.svg', gemSymbol({ shape: 'round',   gem: 'b8c1cc', hi: 'ffffff', glow: 'eaf0f8' }));

// Scatter — Thor head with horned helmet
write('sym_s.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
	<defs>
		<radialGradient id="sAura" cx="50%" cy="50%" r="55%">
			<stop offset="0%" stop-color="#ffd147" stop-opacity="0.9"/>
			<stop offset="55%" stop-color="#ffd147" stop-opacity="0.25"/>
			<stop offset="100%" stop-color="#ffd147" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="sRing" cx="50%" cy="35%" r="70%">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="50%" stop-color="#ffd147"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</radialGradient>
		<linearGradient id="sBg" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#3a1f10"/>
			<stop offset="100%" stop-color="#1a0c08"/>
		</linearGradient>
		<linearGradient id="helmet" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="50%" stop-color="#c89236"/>
			<stop offset="100%" stop-color="#5a3a18"/>
		</linearGradient>
		<linearGradient id="horn" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff3d4"/>
			<stop offset="100%" stop-color="#7a5a2a"/>
		</linearGradient>
	</defs>
	<circle cx="150" cy="150" r="148" fill="url(#sAura)"/>
	<circle cx="150" cy="150" r="135" fill="url(#sRing)"/>
	<circle cx="150" cy="150" r="118" fill="url(#sBg)"/>
	<path d="M95,108 Q40,80 28,118 Q22,150 50,140 Q75,128 100,128 Z" fill="url(#horn)" stroke="#3a2208" stroke-width="2.5"/>
	<path d="M205,108 Q260,80 272,118 Q278,150 250,140 Q225,128 200,128 Z" fill="url(#horn)" stroke="#3a2208" stroke-width="2.5"/>
	<path d="M85,130 Q150,60 215,130 L218,168 Q150,150 82,168 Z" fill="url(#helmet)" stroke="#3a2208" stroke-width="2.5"/>
	<circle cx="120" cy="148" r="5" fill="#fff8d4" stroke="#3a2208" stroke-width="1"/>
	<circle cx="180" cy="148" r="5" fill="#fff8d4" stroke="#3a2208" stroke-width="1"/>
	<rect x="146" y="130" width="8" height="50" fill="url(#helmet)" stroke="#3a2208" stroke-width="1.5"/>
	<ellipse cx="150" cy="180" rx="32" ry="26" fill="#e6c08a"/>
	<ellipse cx="138" cy="178" rx="3" ry="5" fill="#1a0608"/>
	<ellipse cx="162" cy="178" rx="3" ry="5" fill="#1a0608"/>
	<path d="M120,194 Q150,260 180,194 Q175,230 150,238 Q125,230 120,194 Z" fill="#b48c4a" stroke="#5a3a1a" stroke-width="1.5"/>
	<path d="M70,250 Q150,220 230,250 L230,300 L70,300 Z" fill="#7a4a1f"/>
	<text x="150" y="288" text-anchor="middle" font-family="serif" font-weight="900" font-size="22" fill="#ffd700" stroke="#1a0608" stroke-width="3" paint-order="stroke">SCATTER</text>
</svg>
`);

// Multiplier — Mjolnir with lightning aura
write('sym_m.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="300" height="300">
	<defs>
		<radialGradient id="mAura" cx="50%" cy="50%" r="55%">
			<stop offset="0%" stop-color="#7df0ff" stop-opacity="0.9"/>
			<stop offset="55%" stop-color="#4cc9f0" stop-opacity="0.25"/>
			<stop offset="100%" stop-color="#4cc9f0" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="mRing" cx="50%" cy="35%" r="70%">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="50%" stop-color="#ffd147"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</radialGradient>
		<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#ffffff"/>
			<stop offset="40%" stop-color="#a8b2c0"/>
			<stop offset="100%" stop-color="#3a4250"/>
		</linearGradient>
		<linearGradient id="haft" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#a8743a"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</linearGradient>
	</defs>
	<circle cx="150" cy="150" r="148" fill="url(#mAura)"/>
	<circle cx="150" cy="150" r="135" fill="url(#mRing)"/>
	<circle cx="150" cy="150" r="118" fill="#0a1428"/>
	<g fill="#7df0ff" stroke="#fff" stroke-width="1.5">
		<path d="M70,80 L100,130 L80,130 L120,200 L95,150 L110,150 Z" opacity="0.85"/>
		<path d="M230,80 L200,130 L220,130 L180,200 L205,150 L190,150 Z" opacity="0.85"/>
	</g>
	<rect x="138" y="120" width="24" height="130" fill="url(#haft)" stroke="#1a0a04" stroke-width="2.5"/>
	<rect x="134" y="240" width="32" height="18" fill="#a8743a" stroke="#1a0a04" stroke-width="2.5"/>
	<rect x="138" y="160" width="24" height="6" fill="#3a1a06"/>
	<rect x="138" y="180" width="24" height="6" fill="#3a1a06"/>
	<rect x="138" y="200" width="24" height="6" fill="#3a1a06"/>
	<rect x="62" y="78" width="176" height="68" rx="6" fill="url(#steel)" stroke="#1a1a22" stroke-width="3"/>
	<rect x="72" y="86" width="22" height="50" fill="#fff8d4" fill-opacity="0.25"/>
	<g fill="#3a1a06" font-family="serif" font-weight="900" font-size="28">
		<text x="120" y="125" text-anchor="middle">ᚦ</text>
		<text x="180" y="125" text-anchor="middle">ᛟ</text>
	</g>
</svg>
`);

// Background (base) — storm sky + Bifrost + Asgard
write('bg.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
	<defs>
		<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#0a0822"/>
			<stop offset="35%" stop-color="#1a1f4a"/>
			<stop offset="65%" stop-color="#3b1f4a"/>
			<stop offset="100%" stop-color="#08040a"/>
		</linearGradient>
		<radialGradient id="sun" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="40%" stop-color="#ffd147" stop-opacity="0.55"/>
			<stop offset="100%" stop-color="#ffd147" stop-opacity="0"/>
		</radialGradient>
		<radialGradient id="cloud" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#5a4a7a" stop-opacity="0.85"/>
			<stop offset="100%" stop-color="#5a4a7a" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="bifrost" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="#ff3b3b" stop-opacity="0.55"/>
			<stop offset="20%" stop-color="#ffd147" stop-opacity="0.55"/>
			<stop offset="40%" stop-color="#7df07d" stop-opacity="0.55"/>
			<stop offset="60%" stop-color="#7ddef0" stop-opacity="0.55"/>
			<stop offset="80%" stop-color="#7d8af0" stop-opacity="0.55"/>
			<stop offset="100%" stop-color="#b46aff" stop-opacity="0.55"/>
		</linearGradient>
		<linearGradient id="mountain" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#2a2050"/>
			<stop offset="100%" stop-color="#0a0814"/>
		</linearGradient>
		<linearGradient id="firelight" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#ffb24d" stop-opacity="0.45"/>
			<stop offset="100%" stop-color="#ffb24d" stop-opacity="0"/>
		</linearGradient>
	</defs>
	<rect width="1920" height="1080" fill="url(#sky)"/>
	<circle cx="960" cy="380" r="360" fill="url(#sun)"/>
	<path d="M-100,820 Q960,260 2020,820" fill="none" stroke="url(#bifrost)" stroke-width="60" opacity="0.85"/>
	<path d="M-100,820 Q960,300 2020,820" fill="none" stroke="url(#bifrost)" stroke-width="22" opacity="0.65"/>
	<ellipse cx="350" cy="280" rx="380" ry="100" fill="url(#cloud)"/>
	<ellipse cx="1500" cy="240" rx="420" ry="110" fill="url(#cloud)"/>
	<ellipse cx="960" cy="180" rx="500" ry="90" fill="url(#cloud)" opacity="0.7"/>
	<g fill="#fff8d4" stroke="#ffd147" stroke-width="2" opacity="0.9">
		<path d="M280,260 L260,360 L300,360 L240,520 L290,420 L255,420 Z"/>
		<path d="M1620,240 L1600,340 L1640,340 L1580,500 L1630,400 L1595,400 Z"/>
	</g>
	<g fill="#fff8d4" opacity="0.6">
		<path d="M460,300 L450,380 L478,380 L430,500 L468,420 L444,420 Z"/>
	</g>
	<path d="M0,780 L160,580 L280,700 L420,500 L600,680 L780,520 L960,640 L1140,520 L1320,680 L1500,500 L1640,700 L1760,580 L1920,780 L1920,1080 L0,1080 Z" fill="url(#mountain)" opacity="0.95"/>
	<g fill="#0a0814" stroke="#3a2208" stroke-width="1.5">
		<rect x="900" y="560" width="120" height="140"/>
		<polygon points="900,560 960,490 1020,560"/>
		<rect x="850" y="600" width="40" height="100"/>
		<polygon points="850,600 870,560 890,600"/>
		<rect x="1030" y="600" width="40" height="100"/>
		<polygon points="1030,600 1050,560 1070,600"/>
	</g>
	<g fill="#ffb24d">
		<rect x="930" y="610" width="10" height="18"/>
		<rect x="980" y="610" width="10" height="18"/>
		<rect x="930" y="650" width="10" height="18"/>
		<rect x="980" y="650" width="10" height="18"/>
	</g>
	<ellipse cx="960" cy="1000" rx="1100" ry="160" fill="url(#firelight)"/>
	<path d="M0,940 Q480,890 960,930 Q1440,970 1920,920 L1920,1080 L0,1080 Z" fill="#0a0608"/>
	<g>
		<circle cx="240" cy="930" r="12" fill="#ffb24d" opacity="0.85"/>
		<circle cx="240" cy="930" r="24" fill="#ffb24d" opacity="0.25"/>
		<circle cx="1680" cy="930" r="12" fill="#ffb24d" opacity="0.85"/>
		<circle cx="1680" cy="930" r="24" fill="#ffb24d" opacity="0.25"/>
	</g>
</svg>
`);

// Background (free spins) — aurora + bright Bifrost
write('bg_freespins.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">
	<defs>
		<linearGradient id="auroraSky" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#0a0428"/>
			<stop offset="40%" stop-color="#1a2a5a"/>
			<stop offset="80%" stop-color="#2a0a3a"/>
			<stop offset="100%" stop-color="#0a0414"/>
		</linearGradient>
		<radialGradient id="divine" cx="50%" cy="40%" r="60%">
			<stop offset="0%" stop-color="#ffd9a8" stop-opacity="0.7"/>
			<stop offset="50%" stop-color="#b46aff" stop-opacity="0.35"/>
			<stop offset="100%" stop-color="#b46aff" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="auroraA" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%"   stop-color="#7df07d" stop-opacity="0"/>
			<stop offset="30%"  stop-color="#7df07d" stop-opacity="0.7"/>
			<stop offset="70%"  stop-color="#7ddef0" stop-opacity="0.7"/>
			<stop offset="100%" stop-color="#b46aff" stop-opacity="0"/>
		</linearGradient>
		<linearGradient id="auroraB" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%"   stop-color="#b46aff" stop-opacity="0"/>
			<stop offset="40%"  stop-color="#ff7df0" stop-opacity="0.65"/>
			<stop offset="80%"  stop-color="#7df0ff" stop-opacity="0.55"/>
			<stop offset="100%" stop-color="#7df07d" stop-opacity="0"/>
		</linearGradient>
		<linearGradient id="bifrostFS" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color="#ff7df0" stop-opacity="0.85"/>
			<stop offset="50%" stop-color="#fff8d4" stop-opacity="0.85"/>
			<stop offset="100%" stop-color="#7d8af0" stop-opacity="0.85"/>
		</linearGradient>
		<linearGradient id="mountainFS" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#3a2a6a"/>
			<stop offset="100%" stop-color="#0a0414"/>
		</linearGradient>
	</defs>
	<rect width="1920" height="1080" fill="url(#auroraSky)"/>
	<path d="M-50,200 Q480,80 960,220 Q1440,360 1980,180 L1980,330 Q1440,510 960,360 Q480,210 -50,360 Z" fill="url(#auroraA)"/>
	<path d="M-50,420 Q480,280 960,440 Q1440,600 1980,400 L1980,560 Q1440,720 960,580 Q480,440 -50,580 Z" fill="url(#auroraB)" opacity="0.8"/>
	<ellipse cx="960" cy="420" rx="900" ry="500" fill="url(#divine)"/>
	<path d="M-100,820 Q960,220 2020,820" fill="none" stroke="url(#bifrostFS)" stroke-width="80" opacity="0.85"/>
	<path d="M-100,820 Q960,260 2020,820" fill="none" stroke="#fff8d4" stroke-width="14" opacity="0.6"/>
	<g fill="#fff8d4">
		<circle cx="180" cy="120" r="2.5"/><circle cx="320" cy="60" r="2"/>
		<circle cx="520" cy="140" r="3"/><circle cx="720" cy="80" r="2"/>
		<circle cx="1100" cy="100" r="2.5"/><circle cx="1280" cy="60" r="2"/>
		<circle cx="1480" cy="130" r="3"/><circle cx="1680" cy="90" r="2"/>
		<circle cx="240" cy="240" r="1.5"/><circle cx="1620" cy="220" r="1.5"/>
	</g>
	<path d="M0,820 L160,620 L280,740 L420,540 L600,720 L780,560 L960,680 L1140,560 L1320,720 L1500,540 L1640,740 L1760,620 L1920,820 L1920,1080 L0,1080 Z" fill="url(#mountainFS)"/>
	<g fill="#ffd9ff" opacity="0.5">
		<polygon points="420,540 450,580 390,580"/>
		<polygon points="780,560 810,600 750,600"/>
		<polygon points="1140,560 1170,600 1110,600"/>
		<polygon points="1500,540 1530,580 1470,580"/>
	</g>
	<path d="M0,960 Q480,910 960,950 Q1440,990 1920,940 L1920,1080 L0,1080 Z" fill="#0a0414"/>
</svg>
`);

// Reel frame — ornate Norse runic gold with large THOR plaque
write('frame.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 800" width="900" height="800">
	<defs>
		<linearGradient id="goldFrame" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="40%" stop-color="#ffd147"/>
			<stop offset="100%" stop-color="#5a3a08"/>
		</linearGradient>
		<linearGradient id="goldFrameInner" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#7a5418"/>
			<stop offset="50%" stop-color="#ffd147"/>
			<stop offset="100%" stop-color="#fff8d4"/>
		</linearGradient>
		<linearGradient id="plaque" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="50%" stop-color="#e6b94d"/>
			<stop offset="100%" stop-color="#7a5418"/>
		</linearGradient>
		<radialGradient id="gem" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#ff8a8a"/>
			<stop offset="60%" stop-color="#d62828"/>
			<stop offset="100%" stop-color="#3a0608"/>
		</radialGradient>
	</defs>
	<rect x="40" y="80" width="820" height="660" rx="22" fill="none" stroke="url(#goldFrame)" stroke-width="44"/>
	<rect x="76" y="116" width="748" height="588" rx="14" fill="none" stroke="url(#goldFrameInner)" stroke-width="6"/>
	<rect x="86" y="126" width="728" height="568" rx="10" fill="none" stroke="#fff8d4" stroke-width="1.5" stroke-opacity="0.6"/>

	<g fill="url(#goldFrame)" stroke="#3a2208" stroke-width="2">
		<circle cx="40" cy="410" r="32"/>
		<circle cx="40" cy="410" r="14" fill="#3a1430"/>
		<circle cx="860" cy="410" r="32"/>
		<circle cx="860" cy="410" r="14" fill="#3a1430"/>
	</g>
	<text x="40" y="418" text-anchor="middle" font-family="serif" font-weight="900" font-size="22" fill="#ffd147">ᚦ</text>
	<text x="860" y="418" text-anchor="middle" font-family="serif" font-weight="900" font-size="22" fill="#ffd147">ᛟ</text>

	<!-- TOP large ornate plaque with THOR -->
	<g transform="translate(450 70)">
		<path d="M-220,0 L-200,-50 L200,-50 L220,0 L180,40 L-180,40 Z"
			fill="url(#plaque)" stroke="#3a2208" stroke-width="3"/>
		<path d="M-190,-5 L-175,-38 L175,-38 L190,-5 L165,28 L-165,28 Z"
			fill="none" stroke="#3a2208" stroke-width="1.5" stroke-opacity="0.55"/>
		<circle cx="-200" cy="0" r="14" fill="url(#gem)" stroke="#3a2208" stroke-width="2"/>
		<circle cx="200"  cy="0" r="14" fill="url(#gem)" stroke="#3a2208" stroke-width="2"/>
		<text y="14" text-anchor="middle" font-family="serif" font-weight="900" font-size="46" fill="#3a1006" stroke="#fff8d4" stroke-width="0.8" paint-order="stroke">THOR</text>
		<text x="-130" y="14" text-anchor="middle" font-family="serif" font-weight="900" font-size="32" fill="#3a1006">ᚦ</text>
		<text x="130"  y="14" text-anchor="middle" font-family="serif" font-weight="900" font-size="32" fill="#3a1006">ᛟ</text>
	</g>

	<!-- BOTTOM ornament with crossed hammers -->
	<g transform="translate(450 740)">
		<path d="M-160,0 L-140,30 L140,30 L160,0 L130,-26 L-130,-26 Z"
			fill="url(#plaque)" stroke="#3a2208" stroke-width="3"/>
		<g transform="translate(-60 4) rotate(-30)">
			<rect x="-3" y="-22" width="6" height="44" fill="#5a3a18" stroke="#1a0a04" stroke-width="1"/>
			<rect x="-18" y="-30" width="36" height="18" fill="#a8b2c0" stroke="#1a1a22" stroke-width="1.5"/>
		</g>
		<g transform="translate(60 4) rotate(30)">
			<rect x="-3" y="-22" width="6" height="44" fill="#5a3a18" stroke="#1a0a04" stroke-width="1"/>
			<rect x="-18" y="-30" width="36" height="18" fill="#a8b2c0" stroke="#1a1a22" stroke-width="1.5"/>
		</g>
		<circle cx="0" cy="4" r="10" fill="url(#gem)" stroke="#3a2208" stroke-width="2"/>
	</g>
</svg>
`);

// Logo
write('logo.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" width="900" height="420">
	<defs>
		<linearGradient id="logoGold" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="50%" stop-color="#ffd147"/>
			<stop offset="100%" stop-color="#5a3a08"/>
		</linearGradient>
		<linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#3a1430"/>
			<stop offset="100%" stop-color="#1a0a18"/>
		</linearGradient>
		<linearGradient id="steelLogo" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#ffffff"/>
			<stop offset="50%" stop-color="#a8b2c0"/>
			<stop offset="100%" stop-color="#3a4250"/>
		</linearGradient>
		<radialGradient id="logoAura" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stop-color="#ffd147" stop-opacity="0.55"/>
			<stop offset="100%" stop-color="#ffd147" stop-opacity="0"/>
		</radialGradient>
	</defs>
	<ellipse cx="450" cy="210" rx="440" ry="190" fill="url(#logoAura)"/>
	<g fill="#7df0ff" opacity="0.7">
		<path d="M120,60 L150,140 L120,140 L170,260 L130,180 L160,180 Z"/>
		<path d="M780,60 L750,140 L780,140 L730,260 L770,180 L740,180 Z"/>
	</g>
	<path d="M40,60 L860,60 L820,150 L860,240 L40,240 L80,150 Z" fill="url(#ribbon)" stroke="url(#logoGold)" stroke-width="6"/>
	<path d="M60,80 L840,80 L808,150 L840,220 L60,220 L92,150 Z" fill="none" stroke="url(#logoGold)" stroke-width="1.5" stroke-opacity="0.65"/>
	<text x="450" y="120" text-anchor="middle" font-family="serif" font-weight="800" font-size="48" fill="url(#logoGold)" stroke="#3a1006" stroke-width="2.5" paint-order="stroke">HAMMER OF</text>
	<text x="450" y="210" text-anchor="middle" font-family="serif" font-weight="900" font-size="100" fill="url(#logoGold)" stroke="#3a1006" stroke-width="3.5" paint-order="stroke">THOR</text>
	<g transform="translate(450 310)">
		<ellipse cx="0" cy="0" rx="140" ry="42" fill="#3a1430" stroke="url(#logoGold)" stroke-width="5"/>
		<ellipse cx="0" cy="0" rx="128" ry="32" fill="none" stroke="url(#logoGold)" stroke-width="1.5" stroke-opacity="0.6"/>
		<text y="16" text-anchor="middle" font-family="serif" font-weight="900" font-size="56" fill="url(#logoGold)" stroke="#3a1006" stroke-width="2.5" paint-order="stroke">1000</text>
	</g>
	<g transform="translate(110 150) rotate(-25)">
		<rect x="-7" y="-12" width="14" height="100" fill="#5a3a18" stroke="#1a0a04" stroke-width="2"/>
		<rect x="-50" y="-60" width="100" height="48" rx="4" fill="url(#steelLogo)" stroke="#1a1a22" stroke-width="2.5"/>
		<rect x="-44" y="-54" width="14" height="36" fill="#fff8d4" fill-opacity="0.3"/>
	</g>
	<g transform="translate(790 150) rotate(25)">
		<rect x="-7" y="-12" width="14" height="100" fill="#5a3a18" stroke="#1a0a04" stroke-width="2"/>
		<rect x="-50" y="-60" width="100" height="48" rx="4" fill="url(#steelLogo)" stroke="#1a1a22" stroke-width="2.5"/>
		<rect x="-44" y="-54" width="14" height="36" fill="#fff8d4" fill-opacity="0.3"/>
	</g>
	<g fill="#fff8d4">
		<circle cx="220" cy="60" r="3"/>
		<circle cx="680" cy="60" r="3"/>
		<circle cx="180" cy="260" r="2"/>
		<circle cx="720" cy="260" r="2"/>
	</g>
</svg>
`);

// Side warrior — Thor with raised Mjolnir + lightning aura, facing right.
write('warrior.svg', `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 1100" width="700" height="1100">
	<defs>
		<radialGradient id="thorAura" cx="50%" cy="35%" r="55%">
			<stop offset="0%" stop-color="#7df0ff" stop-opacity="0.6"/>
			<stop offset="55%" stop-color="#4cc9f0" stop-opacity="0.18"/>
			<stop offset="100%" stop-color="#4cc9f0" stop-opacity="0"/>
		</radialGradient>
		<linearGradient id="cape" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#7a1a22"/>
			<stop offset="100%" stop-color="#1a0608"/>
		</linearGradient>
		<linearGradient id="capeInner" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#a82836"/>
			<stop offset="100%" stop-color="#3a0608"/>
		</linearGradient>
		<linearGradient id="armor" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff8d4"/>
			<stop offset="35%" stop-color="#ffd147"/>
			<stop offset="70%" stop-color="#a8741a"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</linearGradient>
		<linearGradient id="armorDark" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#5a3a18"/>
			<stop offset="100%" stop-color="#1a0a04"/>
		</linearGradient>
		<linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#f0c89a"/>
			<stop offset="100%" stop-color="#a8744a"/>
		</linearGradient>
		<linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#e0b87a"/>
			<stop offset="100%" stop-color="#7a4a1a"/>
		</linearGradient>
		<linearGradient id="horn" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#fff3d4"/>
			<stop offset="100%" stop-color="#7a5a2a"/>
		</linearGradient>
		<linearGradient id="steelW" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#ffffff"/>
			<stop offset="40%" stop-color="#a8b2c0"/>
			<stop offset="100%" stop-color="#2a3240"/>
		</linearGradient>
		<linearGradient id="haftW" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="#a8743a"/>
			<stop offset="100%" stop-color="#3a2208"/>
		</linearGradient>
	</defs>

	<ellipse cx="350" cy="500" rx="340" ry="540" fill="url(#thorAura)"/>

	<!-- Lightning bolts radiating from raised hammer -->
	<g fill="#7df0ff" stroke="#fff8d4" stroke-width="2" opacity="0.85">
		<path d="M540,40 L480,140 L520,140 L440,260 L500,180 L470,180 Z"/>
		<path d="M620,80 L580,200 L610,200 L540,320 L590,240 L565,240 Z"/>
		<path d="M460,30 L430,120 L460,120 L400,240 L440,160 L420,160 Z"/>
	</g>

	<!-- Cape -->
	<path d="M150,360 Q60,640 110,1020 L230,1020 Q200,700 220,420 Z" fill="url(#cape)" stroke="#1a0608" stroke-width="2.5"/>
	<path d="M550,360 Q640,640 590,1020 L470,1020 Q500,700 480,420 Z" fill="url(#cape)" stroke="#1a0608" stroke-width="2.5"/>
	<path d="M200,400 Q170,640 190,940 L240,940 Q230,700 240,420 Z" fill="url(#capeInner)" opacity="0.65"/>
	<path d="M500,400 Q530,640 510,940 L460,940 Q470,700 460,420 Z" fill="url(#capeInner)" opacity="0.65"/>

	<!-- RAISED right arm holding Mjolnir, swung up to the viewer's right -->
	<g transform="translate(520 360) rotate(-18)">
		<path d="M-30,0 Q-10,-140 50,-180 L80,-160 Q40,-100 30,40 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
		<g transform="translate(60 -170) rotate(-15)">
			<path d="M-22,0 Q-10,-120 30,-150 L60,-130 Q30,-80 26,20 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
			<ellipse cx="44" cy="-138" rx="28" ry="22" fill="url(#armorDark)" stroke="#1a0608" stroke-width="2"/>
			<g transform="translate(46 -150) rotate(8)">
				<rect x="-7" y="-180" width="14" height="180" fill="url(#haftW)" stroke="#1a0a04" stroke-width="2.5"/>
				<rect x="-9" y="-30" width="18" height="14" fill="#a8743a" stroke="#1a0a04" stroke-width="2"/>
				<rect x="-7" y="-100" width="14" height="5" fill="#3a1a06"/>
				<rect x="-7" y="-120" width="14" height="5" fill="#3a1a06"/>
				<rect x="-7" y="-140" width="14" height="5" fill="#3a1a06"/>
				<rect x="-72" y="-240" width="144" height="68" rx="6" fill="url(#steelW)" stroke="#1a1a22" stroke-width="3"/>
				<rect x="-64" y="-232" width="20" height="48" fill="#fff8d4" fill-opacity="0.3"/>
				<text x="0" y="-198" text-anchor="middle" font-family="serif" font-weight="900" font-size="30" fill="#3a1a06">ᚦ</text>
			</g>
		</g>
	</g>

	<!-- Legs -->
	<path d="M260,720 Q250,920 270,1060 L330,1060 Q325,920 330,720 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
	<path d="M370,720 Q375,920 370,1060 L430,1060 Q450,920 440,720 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
	<rect x="262" y="1030" width="74" height="40" rx="4" fill="url(#armorDark)" stroke="#1a0608" stroke-width="2.5"/>
	<rect x="368" y="1030" width="74" height="40" rx="4" fill="url(#armorDark)" stroke="#1a0608" stroke-width="2.5"/>
	<rect x="262" y="1010" width="74" height="6" fill="#fff8d4"/>
	<rect x="368" y="1010" width="74" height="6" fill="#fff8d4"/>

	<!-- Torso -->
	<path d="M210,360 Q170,560 220,740 L480,740 Q530,560 490,360 Q350,310 210,360 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="3"/>
	<path d="M250,400 L450,400" stroke="#3a2208" stroke-width="2" opacity="0.7"/>
	<path d="M240,470 L460,470" stroke="#3a2208" stroke-width="2" opacity="0.7"/>
	<rect x="210" y="620" width="280" height="46" fill="#3a2208" stroke="#1a0608" stroke-width="2.5"/>
	<rect x="332" y="616" width="46" height="54" fill="url(#armor)" stroke="#1a0608" stroke-width="2"/>
	<circle cx="355" cy="643" r="10" fill="#3a1430"/>
	<g transform="translate(350 470)">
		<circle r="48" fill="url(#armor)" stroke="#1a0608" stroke-width="3"/>
		<circle r="36" fill="#3a1430" stroke="#1a0608" stroke-width="2"/>
		<rect x="-5" y="-22" width="10" height="36" fill="#ffd147"/>
		<rect x="-22" y="-26" width="44" height="14" rx="2" fill="#ffd147"/>
	</g>
	<ellipse cx="200" cy="370" rx="50" ry="34" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
	<ellipse cx="500" cy="370" rx="50" ry="34" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
	<circle cx="200" cy="370" r="8" fill="#3a1430" stroke="#1a0608" stroke-width="1.5"/>
	<circle cx="500" cy="370" r="8" fill="#3a1430" stroke="#1a0608" stroke-width="1.5"/>

	<!-- Left arm (relaxed) -->
	<path d="M170,380 Q120,520 140,680 L200,680 Q190,540 220,400 Z" fill="url(#armor)" stroke="#1a0608" stroke-width="2.5"/>
	<ellipse cx="170" cy="680" rx="40" ry="28" fill="url(#armorDark)" stroke="#1a0608" stroke-width="2.5"/>

	<!-- Head + helmet -->
	<g transform="translate(350 230)">
		<path d="M-65,-32 Q-130,-60 -150,-22 Q-150,8 -120,-2 Q-95,-12 -68,-12 Z" fill="url(#horn)" stroke="#3a2208" stroke-width="3"/>
		<path d="M65,-32 Q130,-60 150,-22 Q150,8 120,-2 Q95,-12 68,-12 Z" fill="url(#horn)" stroke="#3a2208" stroke-width="3"/>
		<path d="M-78,-10 Q0,-110 78,-10 L82,40 Q0,18 -82,40 Z" fill="url(#armor)" stroke="#3a2208" stroke-width="3"/>
		<path d="M-3,-100 L3,-100 L8,30 L-8,30 Z" fill="url(#armorDark)"/>
		<rect x="-7" y="0" width="14" height="60" fill="url(#armor)" stroke="#3a2208" stroke-width="2"/>
		<circle cx="-46" cy="22" r="5" fill="#fff8d4" stroke="#3a2208" stroke-width="1"/>
		<circle cx="46"  cy="22" r="5" fill="#fff8d4" stroke="#3a2208" stroke-width="1"/>
		<ellipse cx="0" cy="60" rx="44" ry="36" fill="url(#skin)"/>
		<ellipse cx="-18" cy="50" rx="5" ry="6" fill="#1a0608"/>
		<ellipse cx="18" cy="50" rx="5" ry="6" fill="#1a0608"/>
		<path d="M-32,40 L-8,46" stroke="#3a1a06" stroke-width="4" stroke-linecap="round"/>
		<path d="M32,40 L8,46" stroke="#3a1a06" stroke-width="4" stroke-linecap="round"/>
		<path d="M-44,76 Q-50,180 0,200 Q50,180 44,76 Q30,110 0,110 Q-30,110 -44,76 Z" fill="url(#hair)" stroke="#3a1a06" stroke-width="2"/>
		<path d="M-20,160 Q0,200 20,160" stroke="#3a1a06" stroke-width="2" fill="none"/>
	</g>
</svg>
`);
