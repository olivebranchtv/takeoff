// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
// Let Vite bundle the worker as a module worker:
import PdfJsWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker';

try {
  // Prefer a real worker (fast, correct MIME):
  // @ts-ignore - Worker type provided by ?worker
  GlobalWorkerOptions.workerPort = new PdfJsWorker();
} catch (e) {
  // Fallback: fake worker (slower, but avoids hard crash)
  console.warn('[pdf] Falling back to fake worker:', e);
}

export type PDFDoc = PDFDocumentProxy;

/** Load a PDF document from raw bytes (ArrayBuffer or Uint8Array). */
export async function loadPdfFromBytes(data: ArrayBuffer | Uint8Array): Promise<PDFDoc> {
  // PDF.js accepts either ArrayBuffer or Uint8Array
  const loadingTask = getDocument({ data });
  return loadingTask.promise as Promise<PDFDoc>;
}
