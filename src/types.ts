export type Tool = 'hand' | 'count' | 'segment' | 'polyline' | 'freeform' | 'calibrate';

export type CountObject = {
  id: string; type: 'count'; code: string;
  pageIndex: number; x: number; y: number; rotation: number;
};

export type SegmentObject = {
  id: string; type: 'segment';
  pageIndex: number; vertices: {x:number;y:number}[]; lengthFt?: number;
};

export type PolylineObject = {
  id: string; type: 'polyline';
  pageIndex: number; vertices: {x:number;y:number}[]; lengthFt?: number;
};

export type FreeformObject = {
  id: string; type: 'freeform';
  pageIndex: number; vertices: {x:number;y:number}[]; lengthFt?: number;
};

export type AnyTakeoffObject =
  | CountObject
  | SegmentObject
  | PolylineObject
  | FreeformObject;

export type PageState = {
  pageIndex: number;
  pixelsPerFoot?: number;
  unit?: 'ft' | 'm';
  objects: AnyTakeoffObject[];
  __calibPts?: {x:number;y:number}[]; // transient
};

export type ProjectSave = {
  fileName: string;
  pages: PageState[];
};