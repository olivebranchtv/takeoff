// src/lib/pdf.ts
/**
 * Minimal, worker-free PDF.js setup that plays nicely with Vite.
 * No CDN, no worker files, no external dependencies.
 */

import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist/build/pdf.mjs';

export type PDFDoc = any;

// Completely disable worker to avoid all CORS and network issues
GlobalWorkerOptions.workerSrc = '';

// Force all operations to run in main thread without any worker or external fetching
const COMMON_DOC_OPTS = {
  disableWorker: true,
  isEvalSupported: false,
  useWorkerFetch: false,
  disableRange: true,
  disableStream: true,
  disableAutoFetch: true,
  disableFontFace: false,
  standardFontDataUrl: undefined,
  cMapUrl: undefined,
  cMapPacked: false,
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