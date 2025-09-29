// src/lib/pdf.ts
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Wire the worker for pdf.js v4
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

/** Load from a File object (used when the user picks a PDF). */
export async function loadPdf(file: File): Promise<PDFDoc> {
  const buf = await file.arrayBuffer();
  return loadPdfFromBytes(buf);
}

/** Load directly from raw bytes (used when opening a .skdproj). */
export async function loadPdfFromBytes(bytes: ArrayBuffer): Promise<PDFDoc> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  return await loadingTask.promise;
}
