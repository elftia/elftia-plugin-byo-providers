import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const nodeExternals = [...builtinModules, ...builtinModules.map((name) => `node:${name}`)];

export default defineConfig({
  resolve: {
    alias: {
      '@byo': resolve(import.meta.dirname, 'src'),
    },
  },
  publicDir: false,
  build: {
    outDir: resolve(import.meta.dirname, 'dist/byo-providers/main'),
    emptyOutDir: true,
    target: 'node20',
    minify: false,
    sourcemap: false,
    ssr: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/main/index.ts'),
      formats: ['cjs'],
      fileName: () => 'index.cjs',
    },
    rollupOptions: {
      external: [...nodeExternals, '@elftia/plugin-types'],
      output: {
        exports: 'named',
        entryFileNames: 'index.cjs',
        chunkFileNames: 'chunks/[name]-[hash].cjs',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
