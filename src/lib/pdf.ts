import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface PDFDoc {
  doc: any;
  numPages: number;
  getPage: (pageNum: number) => Promise<any>;
}

export async function loadPdfFromBytes(bytes: ArrayBuffer): Promise<PDFDoc> {
  const loadingTask = pdfjsLib.getDocument({ data: bytes });
  const doc = await loadingTask.promise;
  return {
    doc,
    numPages: doc.numPages,
    getPage: (pageNum: number) => doc.getPage(pageNum)
  };
}
