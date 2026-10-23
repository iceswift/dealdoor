// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import path from 'path';

const publicSite = new URL(process.env.PUBLIC_SITE_URL || 'https://dealdoor.co');

// https://astro.build/config
export default defineConfig({
  site: publicSite.href,
  security: {
    allowedDomains: [{ protocol: publicSite.protocol.slice(0, -1), hostname: publicSite.hostname }],
  },
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
