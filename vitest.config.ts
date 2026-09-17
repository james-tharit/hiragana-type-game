import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));

// One vitest run for the whole workspace: the 80% coverage gate is a
// property of the deployed app, not of any single package, so splitting it
// per package would let a thin package hide behind a thick one.
export default defineConfig({
  resolve: {
    alias: {
      '@wakana/core': path.resolve(here, 'packages/core/src'),
      '@wakana/arcade': path.resolve(here, 'packages/arcade/src'),
    },
  },
  plugins: [react()],
  test: {
    setupFiles: './setupTests.ts',
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      include: ['apps/*/src/**/*.{ts,tsx}', 'packages/*/src/**/*.{ts,tsx}'],
      exclude: [
        'apps/web/src/main.tsx',
        'apps/web/src/vite-env.d.ts',
        'packages/*/src/index.ts',
        'packages/arcade/src/DinoGameCanvas.tsx',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
