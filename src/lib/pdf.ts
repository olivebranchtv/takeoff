// src/lib/pdf.ts
/**
 * Completely local PDF.js setup with no external dependencies
 * This eliminates all CORS and worker-related issues
 */

import { getDocument, GlobalWorkerOptions, version } from 'pdfjs-dist/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export type PDFDoc = any;

// Set worker source to satisfy PDF.js requirements, but disable worker usage
GlobalWorkerOptions.workerSrc = workerUrl;

// Configuration that prevents any external network requests
const SAFE_DOC_OPTS = {
  // Worker configuration
  disableWorker: true,
  useWorkerFetch: false,
  
  // Network prevention
  disableRange: true,
  disableStream: true,
  disableAutoFetch: true,
  
  // Font and resource prevention
  disableFontFace: true,
  standardFontDataUrl: '',
  cMapUrl: '',
  cMapPacked: false,
  
  // Performance and safety
  verbosity: 0,
  maxImageSize: -1,
  disableCreateObjectURL: true,
  
  // Evaluation safety
  isEvalSupported: false,
};

/** Load a PDF from raw bytes with comprehensive error handling */
export async function loadPdfFromBytes(
  bytes: ArrayBuffer | Uint8Array | number[]
): Promise<PDFDoc> {
  try {
    // Ensure we have a Uint8Array
    const u8 = bytes instanceof Uint8Array ? bytes :
               bytes instanceof ArrayBuffer ? new Uint8Array(bytes) :
               new Uint8Array(bytes as number[]);

    // Validate PDF header
    if (u8.length < 5) {
      throw new Error('File too small to be a valid PDF');
    }

    // Check for PDF signature
    const header = String.fromCharCode(...u8.slice(0, 5));
    if (!header.startsWith('%PDF')) {
      throw new Error('Invalid PDF file: missing PDF header');
    }

    console.log(`Loading PDF: ${u8.length} bytes, version detected: ${version}`);

    const task = getDocument({ 
      data: u8, 
      ...SAFE_DOC_OPTS,
      // Additional safety measures
      password: '',
      stopAtErrors: false,
    });

    // Add progress tracking
    task.onProgress = (progress: any) => {
      console.log(`PDF loading progress: ${progress.loaded}/${progress.total}`);
    };

    const doc = await task.promise;
    console.log(`PDF loaded successfully: ${doc.numPages} pages`);
    return doc;

  } catch (error: any) {
    console.error('PDF loading failed:', error);
    throw new Error(`Failed to load PDF: ${error.message || 'Unknown error'}`);
  }
}