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
/** EMT nominal sizes we support ('' = unset). */
export type EMTSize =
  | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"' | '2"'
  | '2-1/2"' | '3"' | '3-1/2"' | '4"' | '';

/** User-configurable inputs captured when starting a Polyline/Freeform run. */
export type MeasureOptions = {
  /** EMT size for the raceway being measured (optional until set by user). */
  emtSize?: EMTSize;

  /** Extra feet added to raceway length for each vertex/point. */
  extraRacewayPerPoint: number;

  /** Up to 3 conductor groups (e.g., phase set, neutral, ground). */
  conductors: Array<{ count: number; size: EMTSize }>; // length 3

  /** Extra feet per point added for each conductor. */
  extraConductorPerPoint: number;

  /** Junction boxes per point along the run. */
  boxesPerPoint: number;

  /** Optional linear waste factor (0–1 = 0%–100%). */
  wastePct?: number;

  /** Display options for drawing. */
  lineColor: string;
  pointColor: string;
  lineWeight: number;
  opaquePoints: boolean;
};

/* ===== Computed measurement result stored on each object ===== */
export type MeasureResult = {
  /** Number of points (vertices) in the run. */
  points: number;

  /** Geometric path length (feet) from vertices at current calibration. */
  baseLengthFt: number;

  /** Raceways */
  raceway: {
    /** EMT size applied to this object. */
    emtSize: EMTSize;
    /** Extra LF added by rules (per-point, waste, etc). */
    extraFt: number;
    /** Final LF used for raceway (baseLengthFt + extras). */
    lengthFt: number;
  };

  /** Conductors (each group total LF already multiplied by count). */
  conductors: Array<{
    size: EMTSize;
    count: number;
    /** Total LF for this group (count × (base + extras)). */
    lengthFt: number;
  }>;

  /** Boxes total for this object. */
  boxes: number;

  /** Optional timestamp for auditing. */
  calculatedAt?: string; // ISO
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

/** Common fields for line-like objects (segment, polyline, freeform). */
type LineLikeBase = {
  id: string;
  pageIndex: number;
  vertices: XY[];

  /** Optional tag code (e.g., device/run code). */
  code?: string;

  /** Optional stored base length (feet) if precomputed. */
  lengthFt?: number;

  /** Per-object inputs (what the user picked in the popup). */
  measure?: MeasureOptions;

  /** Per-object computed outputs (what we feed into the BOM). */
  result?: MeasureResult;

  /** Optional freeform note/comment. */
  note?: string;
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
