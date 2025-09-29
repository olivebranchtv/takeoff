// src/lib/pdf.ts
/* Local, CDN-free PDF.js setup that works in Vite */
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerReady = false;

function ensureWorker() {
  if (workerReady) return;

  // Prefer modern ESM worker (pdfjs >= 3.x ships .mjs)
  try {
    const w = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
      { type: 'module' }
    );
    // Tell pdf.js to use this worker instance
    GlobalWorkerOptions.workerPort = w as unknown as Worker;
    workerReady = true;
    return;
  } catch {
    // fall through
  }

  // Fallback: classic .js worker (some installations still have it)
  try {
    const w = new Worker(
      new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url),
      { type: 'classic' as any }
    );
    GlobalWorkerOptions.workerPort = w as unknown as Worker;
    workerReady = true;
    return;
  } catch {
    // fall through
  }

  // Final fallback: fake worker (slower but functional)
  console.warn('[pdf] Worker startup failed, using fake worker.');
  GlobalWorkerOptions.workerSrc = ''; // triggers fake worker mode
  workerReady = true;
}

export type PDFDoc = PDFDocumentProxy;

/** Load a PDF from raw bytes (ArrayBuffer or Uint8Array). */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | number[]
): Promise<PDFDoc> {
  ensureWorker();
  // Avoid eval in some hosted environments
  const task = getDocument({ data: bytes as any, isEvalSupported: false });
  return task.promise;
}
