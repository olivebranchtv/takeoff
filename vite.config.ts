// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // keep esbuild away from pdfjs during dev (avoids worker pre-bundle oddities)
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  build: {
    // terser is safer than esbuild for big libs in some hosted environments
    minify: 'terser',
    target: 'esnext',
    worker: { format: 'es' },
  },
});
