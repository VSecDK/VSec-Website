import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://vsec.dk',
  integrations: [tailwind({ applyBaseStyles: false })],
  image: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'cdn.discordapp.com',
    ],
  },
});
