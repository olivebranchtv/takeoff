// src/types.ts

/* ===== Basic geometry ===== */
export type XY = { x: number; y: number };

/* ===== UI / tools ===== */
export type Tool = 'hand' | 'count' | 'segment' | 'polyline' | 'freeform' | 'calibrate';

/* ===== Tag DB ===== */
export type Tag = {
  id: string;
  code: string;
  name: string;
  color: string;
  category?: string;
};

/* ===== Measure options for raceways (persisted + stored per object) ===== */
export type EMTSize =
  | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"' | '2"'
  | '2-1/2"' | '3"' | '3-1/2"' | '4"' | '';

export type MeasureOptions = {
  /** Extra feet added to raceway length for each vertex/point. */
  extraRacewayPerPoint: number;

  /** Up to 3 conductor groups (e.g., phase set, neutral, ground). */
  conductors: Array<{ count: number; size: EMTSize }>; // length 3

  /** Extra feet per point added for each conductor. */
  extraConductorPerPoint: number;

  /** Junction boxes per point along the run. */
  boxesPerPoint: number;

  /** Display options for drawing. */
  lineColor: string;
  pointColor: string;
  lineWeight: number;
  opaquePoints: boolean;
};

/* ===== Takeoff objects ===== */
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
  code?: string;                // allow tagging of line-like items
  measure?: MeasureOptions;     // NEW: per-object measurement options for raceways
};

export type SegmentObject  = LineLikeBase & { type: 'segment'  };
export type PolylineObject = LineLikeBase & { type: 'polyline' };
export type FreeformObject = LineLikeBase & { type: 'freeform' };

export type AnyTakeoffObject =
  | CountObject
  | SegmentObject
  | PolylineObject
  | FreeformObject;

/* ===== Per-page state kept in store ===== */
export type PageState = {
  pageIndex: number;
  canvasWidth?: number;
  canvasHeight?: number;
  pixelsPerFoot?: number; // undefined until calibrated
  unit: 'ft' | 'm';
  calibrated?: boolean;
  objects: AnyTakeoffObject[];
};

/* ===== Project save/load ===== */
export type ProjectSave = {
  fileName?: string;
  name?: string;         // optional project name
  projectName?: string;  // legacy key we also accept on load
  pages: Array<{
    pageIndex: number;
    pixelsPerFoot?: number;
    unit?: 'ft' | 'm';
    objects: AnyTakeoffObject[];
  }>;
  tags: Tag[];
};
