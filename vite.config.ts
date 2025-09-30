// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'pdf-lib': ['pdfjs-dist'],
          'vendor': ['react', 'react-dom'],
          'ui': ['konva', 'react-konva']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist', 'konva', 'react-konva']
  },
  server: {
    hmr: {
      overlay: false // Reduce HMR error overlay noise
    }
  }
}
)