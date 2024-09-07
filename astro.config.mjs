// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
    site: process.env.NODE_ENV === 'development' ? 'http://localhost:4321' : 'https://ivanleo.com',
    integrations: [mdx(), sitemap(), tailwind()],
});