// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  site: 'https://dealdoor.co',
  output: 'server',
  server: {
    host: 'localhost',
    port: 4321,
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      noDiscovery: true,
      include: [],
    },
  }
});
