// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  // Optimize dependencies and prevent external requests
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.min.js']
  },
  // Prevent preload warnings
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-lib': ['pdfjs-dist']
        }
      }
    }
  },
  // Development server configuration
  server: {
    hmr: {
      overlay: false // Reduce HMR error overlay noise
    }
  }
});
