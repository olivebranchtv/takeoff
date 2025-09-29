// src/shims/konvaShim.ts
// Normalize any 'konva' import (and 'konva/lib/Global(.js)') to expose a stable default + named `Konva`,
// and pass-through all other named exports.
//
// IMPORTANT: import the REAL module via explicit path + ?real to bypass our vite alias.
import * as Real from 'konva/lib/index.js?real';

// Choose the best "Konva" object form available.
const KonvaAny: any =
  (Real as any).default ?? (Real as any).Konva ?? (Real as any);

// Re-export: both default and named `Konva`, plus all other named exports.
export const Konva = KonvaAny;
export default KonvaAny;

// Also forward all other symbols (Stage, Layer, Shape, Util, etc.)
export * from 'konva/lib/index.js?real';
