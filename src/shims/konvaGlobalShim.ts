// src/shims/konvaGlobalShim.ts
import KonvaDefault from 'konva';

// Expose the Konva object as both default and named `Konva`
// so imports like `import { Konva } from 'konva/lib/Global.js'` work.
export const Konva = KonvaDefault;
export default KonvaDefault;
