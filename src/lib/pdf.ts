// src/lib/pdf.ts
import { getDocument, GlobalWorkerOptions, version } from "pdfjs-dist";

let workerInitialized = false;

function initWorker() {
  if (workerInitialized) return;
  try {
    // Use the installed pdfjs-dist version when available; otherwise fall back.
    const v = typeof version === "string" && version ? version : "3.11.174";
    // Classic worker URL (works across bundlers)
    const cdn = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.js`;
    (GlobalWorkerOptions as any).workerSrc = cdn;
  } catch {
    // Last-resort fallback
    (GlobalWorkerOptions as any).workerSrc =
      "https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.js";
  }
  workerInitialized = true;
}

export type PDFDoc = import("pdfjs-dist").PDFDocumentProxy;

export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array
): Promise<PDFDoc> {
  initWorker();
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const task = getDocument({ data });
  return task.promise;
}
