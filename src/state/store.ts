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

/* ===== Raceway & Conductor enums ===== */
export type EMTSize =
  | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"' | '2"'
  | '2-1/2"' | '3"' | '3-1/2"' | '4"' | '';

export type WireSize =
  | '#18' | '#16' | '#14' | '#12' | '#10' | '#8' | '#6' | '#4' | '#3' | '#2' | '#1'
  | '1/0' | '2/0' | '3/0' | '4/0'
  | '250' | '300' | '350' | '400' | '500' | '600' | '750' | '';

export type WireMaterial = 'CU' | 'AL';
export type WireInsulation = 'THHN/THWN-2' | 'XHHW-2' | 'MTW' | 'RW90' | 'USE-2' | 'Other';

export type ConductorSpec = {
  count: number;              // number of conductors in the group
  size: WireSize;             // wire size (AWG/kcmil)
  insulation: WireInsulation; // insulation type
  material: WireMaterial;     // copper or aluminum
};

/* ===== Measure options (persisted + stored per object) ===== */
export type MeasureOptions = {
  // Raceway
  emtSize: EMTSize;               // EMT raceway size
  extraRacewayPerPoint: number;   // ft added per vertex for raceway
  wasteFactor: number;            // multiplicative (e.g., 1.05 = 5% waste)

  // Conductors (up to 3 groups)
  conductors: [ConductorSpec, ConductorSpec, ConductorSpec];
  extraConductorPerPoint: number; // ft added per point per conductor
  boxesPerPoint: number;          // boxes per point along the run

  // Display
  lineColor: string;
  pointColor: string;
  lineWeight: number;
  opaquePoints: boolean;
};

/* ===== Result we compute & attach on each measured object ===== */
export type MeasureResult = {
  points: number;
  baseLengthFt: number; // geometric length from vertices (before extras/waste)
  raceway: {
    emtSize: EMTSize;
    extraFt: number;
    lengthFt: number;   // total raceway LF after extras & waste
  };
  conductors: Array<{
    size: WireSize;
    insulation: WireInsulation;
    material: WireMaterial;
    count: number;
    lengthFt: number;   // total LF for this group (qty * (base+extra) * waste)
  }>;
  boxes: number;        // total boxes along the run
  calculatedAt: string;
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
  // Stored at commit time:
  lengthFt?: number;            // base geometric LF at commit
  measure?: MeasureOptions;     // user-entered options
  result?: MeasureResult;       // computed outputs for BOM
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
