// src/shims/konvaShim.ts
// Normalize all 'konva' imports (and 'konva/lib/Global(.js)') so consumers can
// import default OR named `Konva`, and still get all other Konva exports.

import * as Real from 'konva-real';

// Pick the best Konva namespace the package exposes.
const KonvaAny: any = (Real as any).default ?? (Real as any).Konva ?? Real;

// Re-export: default Konva, named Konva, and re-export the rest.
export const Konva = KonvaAny;
export default KonvaAny;
export * from 'konva-real';
