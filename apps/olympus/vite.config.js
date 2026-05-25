// @ts-ignore
import config from 'config-vite';
import { mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';

import { mockRgsPlugin } from './mock-rgs/server.js';

export default mergeConfig(config(), {
	plugins: [mockRgsPlugin()],
	resolve: {
		alias: {
			'pixi-svelte': fileURLToPath(new URL('../../packages/pixi-svelte/index.ts', import.meta.url)),
		},
	},
	optimizeDeps: {
		exclude: ['pixi-svelte'],
	},
	server: { port: 3005 },
});
