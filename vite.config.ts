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

      // ------------------------------------------------------------------
      // FIX 1: react-konva sometimes deep-imports 'konva/lib/Global(.js)'
      // Route that to a shim exposing default + named Konva.
      // ------------------------------------------------------------------
      { find: 'konva/lib/Global.js', replacement: path.resolve(__dirname, 'src/shims/konvaGlobalShim.ts') },
      { find: 'konva/lib/Global',   replacement: path.resolve(__dirname, 'src/shims/konvaGlobalShim.ts') },

      // ------------------------------------------------------------------
      // FIX 2: some deps expect a *default* from with-selector (but it has none).
      // We alias ONLY the *bare* ids (no query/extension), to our shim.
      // Our shim will import the REAL module using '?real' so alias won’t match.
      // This avoids the “Detected cycle while resolving name …” error.
      // ------------------------------------------------------------------
      { find: 'use-sync-external-store/shim/with-selector',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts') },
      { find: 'use-sync-external-store/shim/with-selector.js',
        replacement: path.resolve(__dirname, 'src/shims/useSyncExternalStoreWithSelectorShim.ts') },
    ],
  },
  optimizeDeps: {
    // keep dev pre-bundle away from these heavy libs
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
