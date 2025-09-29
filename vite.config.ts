// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Some deps are “spicy” for esbuild in certain hosted environments.
// We ask Vite not to prebundle them with esbuild, and we switch minifier to terser.

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // keep esbuild away from these during dev pre-bundle
    exclude: ['konva', 'react-konva', 'pdfjs-dist', 'zustand'],
  },
  build: {
    // Use terser instead of esbuild to avoid the WASM “Maximum call stack size exceeded”
    minify: 'terser',
    target: 'esnext',
    // ensure workers are emitted as ES modules
    worker: { format: 'es' },
    rollupOptions: {
      // pdfjs emits big chunks; terser is safer here
      output: { manualChunks: undefined },
    },
    // optional: speed vs safety – leave defaults unless you need smaller output
    // terserOptions: { compress: { passes: 2 } },
  },
});
