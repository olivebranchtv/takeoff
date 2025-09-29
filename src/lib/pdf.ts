// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';

// Make sure the worker is found by Vite
// (this URL pattern works in Vite, CRA, and most bundlers)
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export type PDFDoc = PDFDocumentProxy;

/** Normalize any input into a Uint8Array that pdf.js is happy with */
function toU8(
  input: ArrayBuffer | Uint8Array | Blob | string
): Uint8Array {
  // base64 string (optionally data URL)
  if (typeof input === 'string') {
    const b64 = input.includes(',') ? input.split(',').pop()! : input.trim();
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Blob
  if (typeof Blob !== 'undefined' && input instanceof Blob) {
    // NOTE: caller should await blob.arrayBuffer() first if passing Blob.
    throw new Error('Pass Blob as ArrayBuffer (await blob.arrayBuffer())');
  }
  // Typed already
  if (input instanceof Uint8Array) return input;
  // ArrayBuffer
  return new Uint8Array(input);
}

/** Load a PDF from bytes. Accepts ArrayBuffer | Uint8Array | base64 string. */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | string
): Promise<PDFDoc> {
  const data = toU8(bytes);
  const task = getDocument({ data });
  const pdf = await task.promise;
  return pdf;
}
