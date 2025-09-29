// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Make both default and named imports work for with-selector:
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
