// @ts-ignore
import config from 'config-vite';
import { mergeConfig } from 'vite';

import { mockRgsPlugin } from './mock-rgs/server.js';

export default mergeConfig(config(), {
  plugins: [mockRgsPlugin()],
  server: { port: 3005 },
});
