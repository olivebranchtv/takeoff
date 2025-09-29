// src/lib/pdf.ts
/* Local, CDN-free PDF.js setup that works in Vite */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerReady = false;

function ensureWorker() {
  if (workerReady) return;

  // Try modern ESM worker (pdfjs >= 3.x ships .mjs)
  try {
    const w = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
      { type: 'module' }
    );
    GlobalWorkerOptions.workerPort = w;
    workerReady = true;
    return;
  } catch {}

  // Fallback to classic worker path (some installs still have .js)
  try {
    const w = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url),
      // classic worker is fine here
      { type: 'classic' as any }
    );
    GlobalWorkerOptions.workerPort = w;
    workerReady = true;
    return;
  } catch (err) {
    // Final fallback: fake worker (slower, but functional)
    console.warn('[pdf] Worker startup failed, using fake worker:', err);
    GlobalWorkerOptions.workerSrc = ''; // triggers fake worker mode
    workerReady = true;
  }
}

export type PDFDoc = PDFDocumentProxy;

/** Load a PDF from raw bytes (ArrayBuffer or Uint8Array). */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | number[]
): Promise<PDFDoc> {
  ensureWorker();
  const loadingTask = getDocument({ data: bytes as any });
  return loadingTask.promise;
}
