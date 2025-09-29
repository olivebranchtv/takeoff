// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

let workerReady = false;

async function ensureWorker() {
  if (workerReady) return;

  // Try the different filenames that ship with various pdfjs-dist versions.
  let url: string | undefined;
  try { url = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default; } catch {}
  if (!url) try { url = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default; } catch {}
  if (!url) try { url = (await import("pdfjs-dist/build/pdf.worker.min.js?url")).default; } catch {}
  if (!url) try { url = (await import("pdfjs-dist/build/pdf.worker.js?url")).default; } catch {}

  // Last-resort: use the CDN that matches your installed version
  if (!url) url = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

  // Tell PDF.js where to load the worker from
  GlobalWorkerOptions.workerSrc = url as any;
  workerReady = true;
}

export type PDFDoc = import("pdfjs-dist").PDFDocumentProxy;

export async function loadPdfFromBytes(bytes: ArrayBuffer | Uint8Array): Promise<PDFDoc> {
  await ensureWorker();
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const task = getDocument({ data });
  return task.promise;
}
