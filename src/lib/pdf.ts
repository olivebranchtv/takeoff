// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Use the ESM worker and let Vite turn it into a URL we can point to.
// (The '.min.mjs' path exists in pdfjs-dist v4; if your lockfile pins v3/v4 this stays stable.)
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerSrc;

export type PDFDoc = import('pdfjs-dist').PDFDocumentProxy;

/**
 * Load a PDF from bytes (ArrayBuffer or Uint8Array) with conservative options
 * that work well in Vite/browser environments.
 */
export async function loadPdfFromBytes(bytes: ArrayBuffer | Uint8Array): Promise<PDFDoc> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const task = getDocument({
    data,
    // Keep simple for broad compatibility:
    useWorkerFetch: false,
    isEvalSupported: true,
    disableAutoFetch: false,
    disableStream: true,
  });
  return task.promise;
}
