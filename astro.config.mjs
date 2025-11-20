import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://your-domain.com',
  output: 'hybrid',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: false,
  }),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  vite: {
    ssr: {
      noExternal: ['nanostores'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    build: {
      sourcemap: false,
    },
  },
});
