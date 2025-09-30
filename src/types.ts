// src/types.ts
export type XY = { x: number; y: number };

export type Tool = 'hand' | 'count' | 'segment' | 'polyline' | 'freeform' | 'calibrate';

export type Tag = {
  id: string;
  code: string;
  name: string;
  color: string;
  category?: string;
};

export type PageState = {
  pageIndex: number;
  canvasWidth?: number;
  canvasHeight?: number;
  pixelsPerFoot?: number;
  unit?: 'ft' | 'm';
  calibrated: boolean;
  objects: AnyTakeoffObject[];
};

export type CountObject = {
  id: string;
  type: 'count';
  pageIndex: number;
  x: number;
  y: number;
  rotation: number;
  code: string; // required for counts
};

type LineLikeBase = {
  id: string;
  pageIndex: number;
  vertices: XY[];
  code?: string; // <-- allow tagging line-like measurements to a code
};

export type SegmentObject  = LineLikeBase & { type: 'segment'  };
export type PolylineObject = LineLikeBase & { type: 'polyline' };
export type FreeformObject = LineLikeBase & { type: 'freeform' };

export type AnyTakeoffObject =
  | CountObject
  | SegmentObject
  | PolylineObject
  | FreeformObject;

// Project save/load (keep whatever else you already had, this is minimal)
export type ProjectSave = {
  fileName?: string;
  pages: Array<{
    pageIndex: number;
    pixelsPerFoot?: number;
    unit?: 'ft';
    objects: AnyTakeoffObject[];
  }>;
  tags: Tag[];
};
