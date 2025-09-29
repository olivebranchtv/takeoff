// src/shims/konvaGlobalShim.ts
import KonvaDefault from 'konva';

// Let both import styles work:
//
//   import Konva from 'konva/lib/Global'        // will get default from this shim
//   import { Konva } from 'konva/lib/Global'    // will get named export from this shim
//
export const Konva = KonvaDefault;
export default KonvaDefault;
