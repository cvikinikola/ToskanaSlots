// @ts-ignore
import config from 'config-vite';
import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';

import { mockRgsPlugin } from './mock-rgs/server.js';

export default defineConfig(async () =>
	mergeConfig(await config(), {
		plugins: [mockRgsPlugin()],
		resolve: {
			alias: {
				'pixi-svelte': fileURLToPath(new URL('../../packages/pixi-svelte/index.ts', import.meta.url)),
			},
		},
		optimizeDeps: {
			exclude: ['pixi-svelte'],
		},
		server: {
			port: 3005,
			// Allow ngrok tunnels (subdomain changes each session on free plan).
			allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
		},
	}),
);
