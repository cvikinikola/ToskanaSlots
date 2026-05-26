// Don't convert this to a ts file, because of this https://github.com/vitejs/vite/issues/5370
import { defineConfig } from 'vite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const NODE_ENV = process.env.NODE_ENV;
let dev = NODE_ENV === 'development';
const hasLinguiConfig = () =>
	['lingui.config.js', 'lingui.config.cjs', 'lingui.config.mjs', 'lingui.config.ts'].some(
		(fileName) => existsSync(resolve(process.cwd(), fileName)),
	);
const hasSvelteKitApp = () => existsSync(resolve(process.cwd(), 'src/app.html'));

export default async () => {
	const plugins = [];

	if (hasSvelteKitApp()) {
		const { sveltekit } = await import('@sveltejs/kit/vite');
		plugins.push(sveltekit());
	}

	if (hasLinguiConfig()) {
		const { lingui } = await import('@lingui/vite-plugin');
		plugins.push(lingui());
	}

	return defineConfig({
		plugins,
		logLevel: 'info',
		build: {
			assetsInlineLimit: Infinity,
			sourcemap: dev ? true : false,
			output: {
				sourcemap: dev ? true : false,
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					api: 'modern-compiler',
				},
			},
		},
	});
};
