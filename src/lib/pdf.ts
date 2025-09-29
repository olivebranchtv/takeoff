// src/lib/pdf.ts
/**
 * Minimal, worker-free PDF.js setup that plays nicely with Vite.
 * No CDN, no worker files, no terser required.
 */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf.mjs';

export type PDFDoc = any;

// Disable worker entirely to avoid bundling/minification issues in Vite
GlobalWorkerOptions.workerSrc = false;

// Common flags to avoid eval and streaming fetch in locked-down environments.
const COMMON_DOC_OPTS = {
  disableWorker: true,        // <-- important
  isEvalSupported: false,
  useWorkerFetch: false,
  disableRange: true,
  disableStream: true,
};

/** Load a PDF from raw bytes. Accepts ArrayBuffer, Uint8Array, or number[]. */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | number[]
): Promise<PDFDoc> {
  // pdf.js is happiest with a Uint8Array
  const u8 =
    bytes instanceof Uint8Array ? bytes :
    bytes instanceof ArrayBuffer ? new Uint8Array(bytes) :
    new Uint8Array(bytes as number[]);

  const task = getDocument({ data: u8, ...COMMON_DOC_OPTS });
  return task.promise;
}
