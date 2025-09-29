// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Keep esbuild away from a few “spicy” deps during dev pre-bundling.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // your existing app alias
      '@': path.resolve(__dirname, 'src'),

      // FIX: Some code imports a *default* from with-selector (but it has no default).
      // Point that module id to our shim that re-exports both named *and* default.
      'use-sync-external-store/shim/with-selector':
        path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts'),
    },
  },
  optimizeDeps: {
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
