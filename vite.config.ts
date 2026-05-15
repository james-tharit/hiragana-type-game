import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import { getPrerenderRoutes } from './ssg/prerender-routes';

const require = createRequire(import.meta.url);
const vitePrerender = require('vite-plugin-prerender');
const PuppeteerRenderer = vitePrerender.PuppeteerRenderer;

export default defineConfig(async () => {
  const prerenderRoutes = await getPrerenderRoutes();

  return {
    plugins: [
      react(),
      vitePrerender({
        staticDir: path.join(process.cwd(), 'dist'),
        routes: prerenderRoutes,
        renderer: new PuppeteerRenderer({
          maxConcurrentRoutes: 4,
          renderAfterTime: 500,
        }),
      }),
      Sitemap({
        hostname: process.env.SITE_URL ?? 'https://www.wakana.sbs',
        dynamicRoutes: prerenderRoutes,
        generateRobotsTxt: true,
      }),
    ],
    test: {
      setupFiles: './setupTests.ts',
      environment: 'jsdom',
      globals: true,
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
      },
    },
  };
});
