import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://vsec.dk',
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    domains: [
      'avatars.githubusercontent.com',
      'github.com',
      'cdn.discordapp.com',
    ],
  },
});
