import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Sitemap from 'vite-plugin-sitemap';
import { getPrerenderRoutes } from './ssg/prerender-routes';

const require = createRequire(import.meta.url);
const vitePrerender = require('vite-plugin-prerender');
const PuppeteerRenderer = vitePrerender.PuppeteerRenderer;

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async () => {
  const prerenderRoutes = await getPrerenderRoutes();

  return {
    // ponytail: workspace packages resolve by alias rather than by pnpm's
    // node_modules symlinks, so a build works on a machine that has not run
    // `pnpm install` for the workspace yet. Drop this if the packages are ever
    // published independently.
    resolve: {
      alias: {
        '@wakana/core': path.resolve(here, '../../packages/core/src'),
        '@wakana/arcade': path.resolve(here, '../../packages/arcade/src'),
      },
    },
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
  };
});
