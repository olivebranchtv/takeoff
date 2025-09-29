// src/lib/pdf.ts
import * as pdfjsLib from 'pdfjs-dist';

// Robust asset URL for the worker in v4:
// (Vite resolves this at build time; no ?url needed.)
const workerUrl = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

export async function loadPdf(file: File): Promise<PDFDoc> {
  const buf = await file.arrayBuffer();
  return loadPdfFromBytes(buf);
}

export async function loadPdfFromBytes(bytes: ArrayBuffer): Promise<PDFDoc> {
  const task = (pdfjsLib as any).getDocument({ data: bytes });
  return await task.promise;
}
