// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
// IMPORTANT: use the ESM worker and let Vite turn it into a URL we can point to.
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerSrc;

export type PDFDoc = import('pdfjs-dist').PDFDocumentProxy;

/** Load a PDF from bytes (ArrayBuffer or Uint8Array) */
export async function loadPdfFromBytes(bytes: ArrayBuffer | Uint8Array): Promise<PDFDoc> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const task = getDocument({
    data,
    // keep things simple & compatible across environments
    useWorkerFetch: false,
    isEvalSupported: true,
    disableStream: true,
    disableAutoFetch: false,
  });
  return task.promise;
}
