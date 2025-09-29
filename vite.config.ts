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

      // ---------- KONVA FIX ----------
      // Route ANY import of 'konva' OR 'konva/lib/Global(.js)' to our shim,
      // and give the shim a backdoor ('konva-real') to the real package file.
      { find: 'konva',              replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },
      { find: 'konva/lib/Global.js', replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },
      { find: 'konva/lib/Global',    replacement: path.resolve(__dirname, 'src/shims/konvaShim.ts') },

      // This alias points to the REAL Konva entry file in node_modules.
      // (Most versions expose ESM here.)
      {
        find: 'konva-real',
        replacement: path.resolve(__dirname, 'node_modules/konva/lib/index.js'),
      },

      // ---------- use-sync-external-store FIX ----------
      // Some deps incorrectly default-import this; our shim provides both default + named.
      { find: 'use-sync-external-store/shim/with-selector',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts') },
      { find: 'use-sync-external-store/shim/with-selector.js',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts') },
    ],
  },
  optimizeDeps: {
    // Keep prebundle away from these during dev (avoids esbuild quirks)
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    target: 'esnext',
    minify: 'terser',          // safer for big libs than esbuild minify
    worker: { format: 'es' },
    rollupOptions: { output: { manualChunks: undefined } },
  },
});
