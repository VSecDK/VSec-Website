import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://vsec.dk',
  integrations: [sitemap()],

  // The CSP in public/_headers uses script-src/style-src 'self' with no
  // 'unsafe-inline'. Astro inlines small scripts and stylesheets by default,
  // which the browser then refuses to run — so force everything to an external,
  // hashed file under /_astro. Keep these settings when adding new scripts.
  build: {
    inlineStylesheets: 'never',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // 0 = never inline an asset as a data URI or inline tag.
      assetsInlineLimit: 0,
    },
  },
  image: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'cdn.discordapp.com',
    ],
  },
});
