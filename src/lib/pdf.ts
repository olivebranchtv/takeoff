// src/lib/pdf.ts
/* Robust, CDN-free PDF.js setup for Vite + multiple pdfjs-dist layouts */

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerSetup: Promise<void> | null = null;

/** Try several worker locations (mjs/js, min/non-min, legacy). If none found, fall back to fake worker. */
async function setupWorker(): Promise<void> {
  if (workerSetup) return workerSetup;

  workerSetup = (async () => {
    // 1) Best path: use Vite's asset URL for the worker (pdf.js will fetch it)
    const urlCandidates = [
      // modern esm
      'pdfjs-dist/build/pdf.worker.mjs?url',
      'pdfjs-dist/build/pdf.worker.min.mjs?url',
      // non-esm builds that some dist versions still ship
      'pdfjs-dist/build/pdf.worker.js?url',
      'pdfjs-dist/build/pdf.worker.min.js?url',
      // older/legacy paths
      'pdfjs-dist/legacy/build/pdf.worker.js?url',
      'pdfjs-dist/legacy/build/pdf.worker.min.js?url',
    ] as const;

    for (const spec of urlCandidates) {
      try {
        // @vite-ignore avoids Vite trying to statically pre-resolve all of them at once.
        const mod = await import(/* @vite-ignore */ spec as any);
        const url: string | undefined = (mod as any)?.default;
        if (url) {
          GlobalWorkerOptions.workerSrc = url;
          return;
        }
      } catch {
        // try next
      }
    }

    // 2) Fallback: create a Worker instance directly (works when the file exists locally)
    const fileCandidates = [
      'pdfjs-dist/build/pdf.worker.mjs',
      'pdfjs-dist/build/pdf.worker.min.mjs',
      'pdfjs-dist/build/pdf.worker.js',
      'pdfjs-dist/build/pdf.worker.min.js',
      'pdfjs-dist/legacy/build/pdf.worker.js',
      'pdfjs-dist/legacy/build/pdf.worker.min.js',
    ];
    for (const p of fileCandidates) {
      try {
        const u = new URL(p, import.meta.url);
        const type = p.endsWith('.mjs') ? 'module' : 'classic';
        const w = new Worker(u, { type: type as WorkerType });
        // pdf.js supports giving it a Worker instance directly:
        (GlobalWorkerOptions as any).workerPort = w;
        return;
      } catch {
        // try next
      }
    }

    // 3) Last resort: fake worker (slower, but functional)
    console.warn('[pdfjs] No worker file found, using fake worker.');
    GlobalWorkerOptions.workerSrc = '';
  })();

  return workerSetup;
}

export type PDFDoc = PDFDocumentProxy;

/** Load a PDF from raw bytes (ArrayBuffer/Uint8Array/number[]). */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | number[]
): Promise<PDFDoc> {
  await setupWorker();
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes as any);
  const task = getDocument({ data });
  const doc = await task.promise;
  return doc;
}
