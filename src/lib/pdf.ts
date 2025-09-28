import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Point pdf.js at the locally bundled worker
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerUrl;

export type PDFDoc = pdfjsLib.PDFDocumentProxy;

export async function loadPdf(file: File): Promise<PDFDoc> {
  const buf = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  return await loadingTask.promise;
}