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
  assemblyId?: string; // Optional link to a standard assembly
  order?: number; // Optional sort order for project tags (lighting schedule order)
};

/* ===== Assembly System (Standard Material Kits) ===== */

export type AssemblyItem = {
  id: string;
  description: string;    // e.g., "4\" Square Box, 1-1/2\" deep"
  unit: string;           // e.g., "EA", "LF", "BOX"
  quantityPer: number;    // Quantity per assembly instance
  category: string;       // e.g., "Boxes", "Devices", "Fittings", "Wire"
  wasteFactor: number;    // e.g., 1.02 for 2% waste
  itemCode?: string;      // Optional link to material_pricing.item_code for cost/labor lookup
  laborOverride?: number; // Optional labor hours override (for cases like wire pulls where labor is per run, not per foot)
  notes?: string;
};

export type Assembly = {
  id: string;
  code: string;           // e.g., "RECEP-20A"
  name: string;           // e.g., "Standard 20A Receptacle Assembly"
  description: string;    // Full description for estimating
  type: 'device' | 'panel' | 'fixture' | 'custom';
  items: AssemblyItem[];
  isActive: boolean;      // Whether this assembly is available for use
};

/* ===== Raceway & Conductor vocab ===== */

/** EMT nominal sizes we support ('' = unset). Match database format exactly. */
export type EMTSize =
  | '1/2"' | '3/4"' | '1"' | '1 1/4"' | '1 1/2"' | '2"'
  | '2 1/2"' | '3"' | '3 1/2"' | '4"' | '';

/** Common conductor sizes (AWG / kcmil). '' = unset. Match database format with # prefix. */
export type WireSize =
  | '18' | '16' | '14' | '12' | '10' | '8' | '6' | '4' | '3' | '2' | '1'
  | '#18' | '#16' | '#14' | '#12' | '#10' | '#8' | '#6' | '#4' | '#3' | '#2' | '#1'
  | '1/0' | '2/0' | '3/0' | '4/0'
  | '250' | '300' | '350' | '400' | '500' | '600' | '750' | '1000'
  | '250MCM' | '350MCM' | '500MCM' | '600MCM' | '750MCM'
  | '';

export type WireMaterial = 'Copper' | 'Aluminum';
export type WireInsulation = 'THHN' | 'XHHW' | 'MTW' | 'RW90' | 'USE-2' | 'RHH/RHW';
export type WireConstruction = 'Str' | 'Sol'; // Stranded or Solid

export type ConductorSpec = {
  count: number;                   // number of conductors in the group
  size: WireSize;                  // AWG/kcmil
  insulation: WireInsulation;      // insulation type (THHN, XHHW, etc.)
  material: WireMaterial;          // Copper or Aluminum
  construction: WireConstruction;  // Stranded (Str) or Solid (Sol)
};

/* ===== Measure options captured per run (persisted + stored on object) ===== */
export type MeasureOptions = {
  /** EMT size for the raceway being measured (optional until set). */
  emtSize?: EMTSize;

  /** Extra feet added to raceway length for each vertex/point. */
  extraRacewayPerPoint: number;

  /** Up to 3 conductor groups (e.g., phase set, neutral, ground). */
  conductors: [ConductorSpec, ConductorSpec, ConductorSpec];

  /** Extra feet per point added for each conductor. */
  extraConductorPerPoint: number;

  /** Junction boxes per point along the run. */
  boxesPerPoint: number;

  /** Multiplicative waste factor (e.g., 1.05 = 5% waste). */
  wasteFactor: number;

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

  /** Raceway totals */
  raceway: {
    emtSize: EMTSize;
    extraFt: number;       // added LF from rules (per-point, etc.)
    lengthFt: number;      // (base + extras) * waste
  };

  /** Conductors (each group total LF already multiplied by count). */
  conductors: Array<{
    size: WireSize;
    insulation: WireInsulation;
    material: WireMaterial;
    count: number;
    lengthFt: number;      // qty * (base + extras) * waste
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

  /** Per-object computed outputs (what feeds the BOM). */
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
