// src/shims/konvaGlobalShim.ts
import KonvaDefault from 'konva';

// Make both styles work:
//
//   import Konva from 'konva/lib/Global'         ✅ default
//   import { Konva } from 'konva/lib/Global.js'  ✅ named
//
export const Konva = KonvaDefault;
export default KonvaDefault;
