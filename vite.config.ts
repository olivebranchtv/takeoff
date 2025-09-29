// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // app alias
      { find: '@', replacement: path.resolve(__dirname, 'src') },

      // Original module alias to avoid circular dependency
      {
        find: '#use-sync-external-store-original',
        replacement: 'use-sync-external-store/shim/with-selector',
      },

      // IMPORTANT: catch imports of:
      //   'use-sync-external-store/shim/with-selector'
      //   'use-sync-external-store/shim/with-selector.js'
      //   'use-sync-external-store/shim/with-selector.js?some=vite-query'
      {
        find: /use-sync-external-store\/shim\/with-selector(?:\.js)?(?=$|\?)/,
        replacement: path.resolve(
          __dirname,
          'src/shims/useSyncExternalStoreWithSelectorShim.ts',
        ),
      },
    ],
  },
  optimizeDeps: {
    // keep dev pre-bundle away from these
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    worker: { format: 'es' },
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
});
