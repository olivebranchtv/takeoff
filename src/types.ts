export type Tool = 'hand' | 'count' | 'segment' | 'polyline' | 'freeform' | 'calibrate';

export type Unit = 'ft' | 'm';

export type Point = { x: number; y: number };

export type Tag = {
  id: string;
  code: string;      // short code: A, A1, EM, GFCI...
  name: string;      // human name
  category: string;  // e.g., "Lights", "Switch", "Receptacle", ...
  color: string;     // hex color like "#FF8000"
};

export type CountObject = {
  id: string;
  type: 'count';
  pageIndex: number;
  x: number; y: number;
  rotation: number;
  code: string;      // links to Tag.code
};

export type SegmentObject = {
  id: string;
  type: 'segment';
  pageIndex: number;
  vertices: Point[]; // PAGE coords
};

export type PolylineObject = {
  id: string;
  type: 'polyline';
  pageIndex: number;
  vertices: Point[]; // PAGE coords
};

export type FreeformObject = {
  id: string;
  type: 'freeform';
  pageIndex: number;
  vertices: Point[]; // PAGE coords
};

export type AnyTakeoffObject =
  | CountObject
  | SegmentObject
  | PolylineObject
  | FreeformObject;

export type PageState = {
  pageIndex: number;
  objects: AnyTakeoffObject[];
  pixelsPerFoot?: number;
  unit: Unit;
  // internal temp storage for calibration clicks
  __calibPts?: Point[];
};

export type ProjectSave = {
  fileName: string;
  pages: PageState[];
  tags: Tag[];
};
