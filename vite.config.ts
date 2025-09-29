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

      // Fix: some code default-imports with-selector; route to our shim that provides default + named
      {
        find: /use-sync-external-store\/shim\/with-selector(?:\.js)?(?=$|\?)/,
        replacement: path.resolve(
          __dirname,
          'src/shims/useSyncExternalStoreWithSelectorShim.ts'
        ),
      },

      // Fix: react-konva deep import 'konva/lib/Global(.js)'
      { find: 'konva/lib/Global.js', replacement: path.resolve(__dirname, 'src/shims/konvaGlobalShim.ts') },
      { find: 'konva/lib/Global',   replacement: path.resolve(__dirname, 'src/shims/konvaGlobalShim.ts') },
    ],
  },
  optimizeDeps: {
    // keep dev prebundle away from these to avoid esbuild/WASM quirks
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    target: 'esnext',
    // terser is safer here than esbuild for these deps
    minify: 'terser',
    worker: { format: 'es' },
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
});
