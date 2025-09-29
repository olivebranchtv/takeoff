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

      // --- Fix: react-konva deep import & any konva import shape -> our shim
      { find: 'konva/lib/Global.js', replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },
      { find: 'konva/lib/Global',   replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },
      { find: 'konva',              replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },

      // --- Fix: some deps expect default from with-selector (it has none)
      // Alias ONLY the bare ids; shim imports real module with `?real` to avoid alias recursion.
      {
        find: 'use-sync-external-store/shim/with-selector',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts'),
      },
      {
        find: 'use-sync-external-store/shim/with-selector.js',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts'),
      },
    ],
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
