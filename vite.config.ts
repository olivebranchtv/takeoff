// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // App alias
      { find: '@', replacement: path.resolve(__dirname, 'src') },

      // ---- Fix 1: some code mistakenly default-imports with-selector; make both work
      {
        find: /use-sync-external-store\/shim\/with-selector(?:\.js)?(?=$|\?)/,
        replacement: path.resolve(
          __dirname,
          'src/shims/useSyncExternalStoreWithSelectorShim.ts'
        ),
      },

      // ---- Fix 2: normalize Konva deep imports to a shim that exposes both default and named `Konva`
      {
        find: /konva\/lib\/Global\.js(\?.*)?/,
        replacement: path.resolve(__dirname, 'src/shims/konvaGlobalShim.ts'),
      },
    ],
  },
  optimizeDeps: {
    // keep dev prebundle away from these sensitive libs
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    // safer minifier for large/wasm-adjacent bundles
    minify: 'terser',
    target: 'esnext',
    worker: { format: 'es' },
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
});
