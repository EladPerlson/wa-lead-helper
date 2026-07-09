import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
