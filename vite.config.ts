// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Avoid esbuild’s occasional WASM crash on heavy ESM deps (pdfjs, konva, etc.)
// and use terser for minification instead.
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // keep esbuild away from these during dev pre-bundle
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    target: 'esnext',
    // safer than esbuild for these libs in some environments
    minify: 'terser',
    // pdf.js worker needs ES module format in modern builds
    worker: { format: 'es' },
    rollupOptions: {
      // keep rollup from over-splitting pdfjs
      output: { manualChunks: undefined },
    },
  },
});
