import * as PIXI from 'pixi.js';

export const getTextureImageSource = (texture: PIXI.Texture): CanvasImageSource | null => {
	const resource = texture.source.resource as CanvasImageSource | { source?: CanvasImageSource } | null;
	if (!resource) return null;
	if (
		resource instanceof HTMLImageElement ||
		resource instanceof HTMLCanvasElement ||
		resource instanceof ImageBitmap
	) {
		return resource;
	}
	if (typeof resource === 'object' && 'source' in resource) {
		const inner = resource.source;
		if (
			inner instanceof HTMLImageElement ||
			inner instanceof HTMLCanvasElement ||
			inner instanceof ImageBitmap
		) {
			return inner;
		}
	}
	return null;
};

export const isNeutralBlackMattePixel = (
	r: number,
	g: number,
	b: number,
	a: number,
	maxRgb = 10,
	maxChroma = 6,
) => {
	if (a < 8) return true;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	return max <= maxRgb && max - min <= maxChroma;
};

/** Flood-fill neutral black export matte from image borders. */
export const keyNeutralBlackMatteFromBorders = (
	data: Uint8ClampedArray,
	width: number,
	height: number,
	maxRgb = 10,
	maxChroma = 6,
) => {
	const total = width * height;
	const visited = new Uint8Array(total);
	const queue = new Int32Array(total);
	let head = 0;
	let tail = 0;

	const trySeed = (x: number, y: number) => {
		const i = y * width + x;
		if (visited[i]) return;
		const o = i * 4;
		if (!isNeutralBlackMattePixel(data[o], data[o + 1], data[o + 2], data[o + 3], maxRgb, maxChroma)) {
			return;
		}
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

export const rewriteTextureWithPixelPass = (
	texture: PIXI.Texture,
	applied: WeakSet<PIXI.Texture>,
	process: (data: Uint8ClampedArray, width: number, height: number) => void,
): PIXI.Texture => {
	if (applied.has(texture)) return texture;

	const w = texture.source.pixelWidth;
	const h = texture.source.pixelHeight;
	if (!w || !h) return texture;

	const image = getTextureImageSource(texture);
	if (!image) return texture;

	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return texture;

	ctx.drawImage(image, 0, 0, w, h);
	const imageData = ctx.getImageData(0, 0, w, h);
	process(imageData.data, w, h);
	ctx.putImageData(imageData, 0, 0);

	const cutout = PIXI.Texture.from(canvas);
	cutout.source.alphaMode = 'premultiply-alpha-on-upload';
	cutout.source.update();

	applied.add(cutout);
	applied.add(texture);
	return cutout;
};
