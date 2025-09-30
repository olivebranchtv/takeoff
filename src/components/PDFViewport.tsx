import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Line, Text as KText, Transformer, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

/** ===================== Local UI: Measure Options Modal ===================== */
type EMTSize =
  | '1/2"' | '3/4"' | '1"' | '1-1/4"' | '1-1/2"' | '2"'
  | '2-1/2"' | '3"' | '3-1/2"' | '4"' | '';

const EMT_SIZES: EMTSize[] = ['','1/2"','3/4"','1"','1-1/4"','1-1/2"','2"','2-1/2"','3"','3-1/2"','4"'];

type MeasureOptions = {
  extraRacewayPerPoint: number;
  conductors: Array<{ count: number; size: EMTSize }>; // exactly 3 items
  extraConductorPerPoint: number;
  boxesPerPoint: number;
  lineColor: string;
  pointColor: string;
  lineWeight: number;
  opaquePoints: boolean;
};

function cloneMeasure(o: MeasureOptions): MeasureOptions {
  return {
    ...o,
    conductors: [
      { ...o.conductors[0] },
      { ...o.conductors[1] },
      { ...o.conductors[2] },
    ],
  };
}

function SetMeasureOptionsModal({
  open,
  initial,
  onOK,
  onCancel,
}: {
  open: boolean;
  initial: MeasureOptions;
  onOK: (opts: MeasureOptions) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<MeasureOptions>(() => cloneMeasure(initial));
  useEffect(() => { if (open) setDraft(cloneMeasure(initial)); }, [open, initial]);

  if (!open) return null;

  const L = (label: string) => (
    <label className="text-xs font-medium text-gray-700">{label}</label>
  );

  const box = 'border rounded px-2 py-1 text-sm w-full';
  const row = 'grid grid-cols-12 gap-2 items-center';
  const col = (n: number) => `col-span-${n}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.35)'}}>
      <div className="bg-white rounded-lg shadow-xl w-[560px] max-w-[95vw]">
        <div className="px-4 py-3 border-b">
          <div className="text-sm font-semibold">Set Measure Options</div>
        </div>

        <div className="p-4 space-y-3">
          <div className={row}>
            <div className={col(8)}>
              {L('Extra footage for raceway per point')}
              <input
                className={box}
                type="number"
                value={draft.extraRacewayPerPoint}
                onChange={e=>setDraft({...draft, extraRacewayPerPoint: Number(e.target.value) || 0})}
              />
            </div>
            <div className={col(4)}>
              {L('Line weight')}
              <input
                className={box}
                type="number"
                min={1}
                value={draft.lineWeight}
                onChange={e=>setDraft({...draft, lineWeight: Math.max(1, Number(e.target.value) || 1)})}
              />
            </div>
          </div>

          {/* Conductors rows */}
          {[0,1,2].map(idx => (
            <div className={row} key={idx}>
              <div className={col(4)}>
                {L(`Number of conductors #${idx+1}`)}
                <input
                  className={box}
                  type="number"
                  value={draft.conductors[idx].count}
                  onChange={e=>{
                    const v = Number(e.target.value) || 0;
                    const conductors = draft.conductors.slice();
                    conductors[idx] = { ...conductors[idx], count: v };
                    setDraft({ ...draft, conductors });
                  }}
                />
              </div>
              <div className={col(8)}>
                {L('Size')}
                <select
                  className={box}
                  value={draft.conductors[idx].size}
                  onChange={e=>{
                    const v = e.target.value as EMTSize;
                    const conductors = draft.conductors.slice();
                    conductors[idx] = { ...conductors[idx], size: v };
                    setDraft({ ...draft, conductors });
                  }}
                >
                  {EMT_SIZES.map(s => <option value={s} key={s || 'none'}>{s || '(none)'}</option>)}
                </select>
              </div>
            </div>
          ))}

          <div className={row}>
            <div className={col(6)}>
              {L('Extra footage for conductor per point')}
              <input
                className={box}
                type="number"
                value={draft.extraConductorPerPoint}
                onChange={e=>setDraft({...draft, extraConductorPerPoint: Number(e.target.value) || 0})}
              />
            </div>
            <div className={col(6)}>
              {L('Boxes per point')}
              <input
                className={box}
                type="number"
                value={draft.boxesPerPoint}
                onChange={e=>setDraft({...draft, boxesPerPoint: Number(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className={row}>
            <div className={col(4)}>
              {L('Line color')}
              <input
                className={box}
                type="color"
                value={draft.lineColor}
                onChange={e=>setDraft({...draft, lineColor: e.target.value})}
              />
            </div>
            <div className={col(4)}>
              {L('Point color')}
              <input
                className={box}
                type="color"
                value={draft.pointColor}
                onChange={e=>setDraft({...draft, pointColor: e.target.value})}
              />
            </div>
            <div className={col(4)} style={{display:'flex', alignItems:'end', gap:6}}>
              <input
                id="opaquePoints"
                type="checkbox"
                checked={draft.opaquePoints}
                onChange={e=>setDraft({...draft, opaquePoints: e.target.checked})}
              />
              <label htmlFor="opaquePoints" className="text-sm">Opaque points</label>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-2">
          <button
            className="px-3 py-1 border rounded text-sm"
            onClick={onCancel}
          >Cancel</button>
          <button
            className="px-3 py-1 rounded text-sm text-white"
            style={{background:'#0d6efd'}}
            onClick={()=>onOK(draft)}
          >OK</button>
        </div>
      </div>
    </div>
  );
}
/** ========================================================================== */

type Props = { pdf: PDFDoc | null };

type PageRenderInfo = {
  pageIndex: number;
  baseWidth: number;
  baseHeight: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
};

function usePageBitmap(pdf: PDFDoc | null, zoom: number, pageIndex: number) {
  const [info, setInfo] = useState<PageRenderInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    if (!pdf || pageIndex < 0) { setInfo(null); return; }

    const DPR = Math.max(1, window.devicePixelRatio || 1);

    (async () => {
      try {
        // Validate page index
        if (pageIndex >= pdf.numPages) {
          throw new Error(`Page index ${pageIndex} out of range (0-${pdf.numPages - 1})`);
        }

        const page = await pdf.getPage(pageIndex + 1);
        if (cancelled) return;

        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: zoom });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        
        // Set canvas dimensions safely
        canvas.width = Math.floor(vp.width * DPR);
        canvas.height = Math.floor(vp.height * DPR);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        // Render with error handling
        const renderTask = page.render({ 
          canvasContext: ctx, 
          viewport: page.getViewport({ scale: zoom * DPR }),
          intent: 'display'
        });

        cleanup = () => {
          try {
            renderTask.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
        };

        await renderTask.promise;
        if (cancelled) return;

        setInfo({
          pageIndex,
          baseWidth: baseVp.width,
          baseHeight: baseVp.height,
          width: vp.width,
          height: vp.height,
          canvas
        });

      } catch (error) {
        console.error(`Error rendering PDF page ${pageIndex}:`, error);
        if (!cancelled) setInfo(null);
      }
    })();

    return () => { 
      cancelled = true; 
      cleanup?.();
    };
  }, [pdf, zoom, pageIndex]);

  return info;
}

export default function PDFViewport({ pdf }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // drawing state
  const drawingRef = useRef<{ type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[] }>({ type: null, pts: [] });
  const freeformActive = useRef<boolean>(false);

  // measure dialog state
  const [measureOpen, setMeasureOpen] = useState(false);
  const startPointRef = useRef<{x:number;y:number}|null>(null);
  const activeMeasureOptsRef = useRef<MeasureOptions | null>(null);

  // live helpers
  const cursorPageRef = useRef<{x:number;y:number} | null>(null);
  const [, setPaintTick] = useState(0);
  const liveLabelRef = useRef<{text:string;x:number;y:number}|null>(null);

  const {
    pages, upsertPage, addObject, patchObject, tool, zoom,
    currentTag, setCalibration, selectedIds, selectOnly, clearSelection,
    deleteSelected, undo, redo, activePage, tags,
    lastMeasureOptions, setLastMeasureOptions,
  } = useStore();

  useEffect(() => {
    if (!pdf) return;
    if (pages.length === 0) {
      Array.from({length: pdf.numPages}).forEach((_, idx) =>
        upsertPage({ pageIndex: idx, objects: [], pixelsPerFoot: undefined, unit: 'ft' })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf]);

  const info = usePageBitmap(pdf, zoom, activePage);
  const pageScale = (i: PageRenderInfo) => i.width / i.baseWidth;

  const toStage = (i: PageRenderInfo, p:{x:number;y:number}) => ({ x: p.x * pageScale(i), y: p.y * pageScale(i) });
  const toPage  = (i: PageRenderInfo, spt:{x:number;y:number}) => ({ x: spt.x / pageScale(i), y: spt.y / pageScale(i) });

  function colorForCode(code?: string) {
    const t = tags.find(tt => tt.code.toUpperCase() === (code || '').toUpperCase());
    if (!t) return '#444';
    return (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color;
  }

  function updateLiveLabel(i: PageRenderInfo) {
    const stage = stageRef.current;
    const posStage = stage?.getPointerPosition();
    if (!posStage || !drawingRef.current.type) { liveLabelRef.current = null; return; }

    let vertsPage = drawingRef.current.pts.slice();
    if (drawingRef.current.type === 'segment') {
      if (vertsPage.length === 1) vertsPage = [vertsPage[0], toPage(i, posStage)];
    } else if (drawingRef.current.type === 'polyline') {
      vertsPage = [...vertsPage, toPage(i, posStage)];
    }
    const page = pages.find(p => p.pageIndex === activePage);
    const px = pathLength(vertsPage);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : `${Math.round(px)} px`;
    liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
  }

  function commitObject(type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    // attach the current measure options if any (cast as any to avoid union friction)
    const measure = activeMeasureOptsRef.current ? { ...activeMeasureOptsRef.current } : undefined;
    addObject(activePage, {
      id: crypto.randomUUID(),
      type,
      pageIndex: activePage,
      vertices: vertsPage,
      code: currentTag || undefined,
      measure, // stored for BOM + rendering
    } as AnyTakeoffObject);
  }

  const isLeft  = (e: any) => (e?.evt?.button ?? 0) === 0;
  const isRight = (e: any) => (e?.evt?.button ?? 0) === 2;

  function promptMeasureIfNeeded(initialPoint: {x:number;y:number}) {
    // only for polyline/freeform, and only at the start (when no drawing is active)
    if (tool !== 'polyline' && tool !== 'freeform') return false;
    if (drawingRef.current.type) return false;
    startPointRef.current = initialPoint;
    setMeasureOpen(true);
    return true;
  }

  function onMouseDown(e: any) {
    if (!info) return;

    // Right-click: delete object under cursor
    if (isRight(e)) {
      if (e.target?.attrs?.name?.startsWith('obj-')) {
        const id = e.target.attrs.name.substring(4);
        selectOnly(id);
        deleteSelected(activePage);
      }
      return;
    }
    if (!isLeft(e)) return;

    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition()!;
    const posPage = toPage(info, posStage);
    cursorPageRef.current = posPage;

    if (e.target?.attrs?.name?.startsWith('obj-')) {
      const id = e.target.attrs.name.substring(4);
      selectOnly(id);
      return;
    } else {
      clearSelection();
    }

    if (tool === 'hand') return;

    if (tool === 'count') {
      addObject(activePage, {
        id: crypto.randomUUID(),
        type: 'count',
        code: currentTag,
        pageIndex: activePage, x: posPage.x, y: posPage.y, rotation: 0
      } as any);
    } else if (tool === 'segment') {
      drawingRef.current = { type: 'segment', pts: [posPage] };
    } else if (tool === 'polyline') {
      // open measure dialog at the first click
      if (!drawingRef.current.type) {
        const blocked = promptMeasureIfNeeded(posPage);
        if (blocked) return; // wait for modal
        drawingRef.current = { type: 'polyline', pts: [posPage] };
      } else {
        drawingRef.current.pts.push(posPage);
      }
    } else if (tool === 'freeform') {
      // open measure dialog at the first click
      if (!drawingRef.current.type) {
        const blocked = promptMeasureIfNeeded(posPage);
        if (blocked) return; // wait for modal
        drawingRef.current = { type: 'freeform', pts: [posPage] };
        freeformActive.current = true;
      } else {
        drawingRef.current.pts.push(posPage);
      }
    } else if (tool === 'calibrate') {
      const page = pages.find(p => p.pageIndex === activePage)!;
      const next = (page as any).__calibPts ? [...(page as any).__calibPts, posPage] : [posPage];
      (page as any).__calibPts = next;
      if (next.length === 2) {
        const px = pathLength(next);
        const input = prompt('Enter real length between points (feet):', '10');
        const feet = input ? parseFloat(input) : NaN;
        if (!isNaN(feet) && feet > 0) setCalibration(activePage, px / feet, 'ft');
        (page as any).__calibPts = [];
      }
    }
    updateLiveLabel(info);
    setPaintTick(t => t + 1);
  }

  function onMouseMove(e?: any) {
    if (!info) return;

    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition();
    if (posStage) {
      cursorPageRef.current = toPage(info, posStage);
    }

    if (tool === 'freeform' && freeformActive.current && (!e || isLeft(e))) {
      drawingRef.current.pts.push(cursorPageRef.current!);
    }
    updateLiveLabel(info);
    setPaintTick(t => t + 1);
  }

  function onMouseUp(e?: any) {
    if (!info) return;
    if (e && !isLeft(e)) return;
    if (!drawingRef.current.type) return;

    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition();
    if (!posStage) { drawingRef.current = { type:null, pts: [] }; return; }

    if (drawingRef.current.type === 'segment') {
      const endPage = toPage(info, posStage);
      const pts = [...drawingRef.current.pts, endPage];
      const px = pathLength(pts);
      drawingRef.current = { type: null, pts: [] };
      cursorPageRef.current = null;
      liveLabelRef.current = null;
      if (px > 0.5) commitObject('segment', pts);
    } else if (drawingRef.current.type === 'polyline') {
      // commit on double-click
    } else if (drawingRef.current.type === 'freeform') {
      freeformActive.current = false;
      const simplified = simplifyRDP(drawingRef.current.pts, 1.5);
      drawingRef.current = { type: null, pts: [] };
      commitObject('freeform', simplified);
    }
    setPaintTick(t => t + 1);
  }

  function onDblClick() {
    if (drawingRef.current.type === 'polyline') {
      const pts = drawingRef.current.pts.slice();
      drawingRef.current = { type: null, pts: [] };
      commitObject('polyline', pts);
    }
    cursorPageRef.current = null;
    liveLabelRef.current = null;
    setPaintTick(t => t + 1);
  }

  // transformer binding
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const stage = stageRef.current;
    if (!stage) return;
    const layer = stage.findOne('Layer') as Konva.Layer;
    const nodes = selectedIds
      .map(id => stage.findOne(`.obj-${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    layer?.batchDraw();
  }, [selectedIds, activePage]);

  // shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Delete') {
        deleteSelected(activePage);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        undo(activePage);
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase()==='z' && e.shiftKey))) {
        redo(activePage);
      } else if (e.key === 'Escape') {
        drawingRef.current = { type: null, pts: [] };
        cursorPageRef.current = null;
        liveLabelRef.current = null;
        freeformActive.current = false;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePage, deleteSelected, undo, redo]);

  if (!pdf || !info) {
    return (
      <div className="content">
        <div style={{padding:'2rem'}}><div className="drop">Drop a PDF to begin or use the file picker.</div></div>
      </div>
    );
  }

  const pState = pages.find(p => p.pageIndex === activePage);
  const w = info.width, h = info.height;
  const s = pageScale(info);
  const pageObjects = pState?.objects ?? [];

  return (
    <div className="content" onContextMenu={(e)=>e.preventDefault()}>
      <div className="pageBox" style={{ width: w, height: h }}>
        <div style={{position:'absolute', inset:0}}>
          {/* bitmap */}
          <div style={{position:'absolute', inset:0}} ref={(el) => {
            if (el && info.canvas && info.canvas.parentElement !== el) { 
              el.innerHTML = ''; 
              el.appendChild(info.canvas); 
            }
          }}/>
          <div className="calib">
            {pState?.pixelsPerFoot ? `Calibrated: ${pState.pixelsPerFoot.toFixed(2)} px/ft` : 'Not calibrated'}
          </div>
          <Stage
            width={w} height={h} style={{position:'absolute', inset:0}}
            ref={stageRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onDblClick={onDblClick}
            onContextMenu={(e:any)=>e.evt?.preventDefault()}
          >
            <Layer listening>
              {/* DRAWN OBJECTS */}
              {pageObjects.map(obj =>
                renderObject(
                  obj,
                  selectedIds.includes(obj.id),
                  s,
                  activePage,
                  patchObject,
                  colorForCode,
                  selectOnly,
                  deleteSelected
                )
              )}

              {/* LIVE PREVIEW + TOOLTIP */}
              {renderLive(drawingRef.current, s, cursorPageRef.current, activeMeasureOptsRef.current)}
              {liveLabelRef.current && (
                <KText x={liveLabelRef.current.x} y={liveLabelRef.current.y} text={liveLabelRef.current.text} fontSize={12} fill="#000" />
              )}
              <Transformer ref={trRef} rotateEnabled={true} resizeEnabled={false} />
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Measure options modal */}
      <SetMeasureOptionsModal
        open={measureOpen}
        initial={lastMeasureOptions as unknown as MeasureOptions}
        onCancel={()=>{
          setMeasureOpen(false);
          startPointRef.current = null;
          activeMeasureOptsRef.current = null;
        }}
        onOK={(opts)=>{
          // persist "last used"
          setLastMeasureOptions(opts);
          activeMeasureOptsRef.current = opts;

          // if user initiated this by first click, seed drawing with that point
          if (startPointRef.current) {
            if (tool === 'polyline') {
              drawingRef.current = { type: 'polyline', pts: [startPointRef.current] };
            } else if (tool === 'freeform') {
              drawingRef.current = { type: 'freeform', pts: [startPointRef.current] };
              freeformActive.current = true;
            }
          }
          setMeasureOpen(false);
          setPaintTick(t=>t+1);
        }}
      />
    </div>
  );
}

/* --------- helpers to place a badge at the half-length point --------- */
function halfPoint(pts: {x:number;y:number}[]) {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y };
  if (pts.length === 2) {
    return { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y)/2 };
  }
  // polyline: walk to half total length
  let total = 0;
  for (let i=1;i<pts.length;i++) {
    const dx = pts[i].x - pts[i-1].x, dy = pts[i].y - pts[i-1].y;
    total += Math.hypot(dx, dy);
  }
  const target = total / 2;
  let acc = 0;
  for (let i=1;i<pts.length;i++) {
    const a = pts[i-1], b = pts[i];
    const seg = Math.hypot(b.x-a.x, b.y-a.y);
    if (acc + seg >= target) {
      const t = (target - acc) / seg;
      return { x: a.x + t*(b.x-a.x), y: a.y + t*(b.y-a.y) };
    }
    acc += seg;
  }
  return pts[Math.floor(pts.length/2)];
}

/* --------- Renderers --------- */

function renderObject(
  obj: AnyTakeoffObject,
  selected: boolean,
  s: number,
  pageIndex: number,
  patchObject: (pageIndex:number, id:string, patch: Partial<AnyTakeoffObject>) => void,
  colorForCode: (code?: string) => string,
  selectOnly: (id:string) => void,
  deleteSelected: (pageIndex:number) => void
) {
  const onCtxDelete = (e: any) => {
    e.evt?.preventDefault?.();
    selectOnly(obj.id);
    deleteSelected(pageIndex);
  };

  const measure = (obj as any).measure as MeasureOptions | undefined;
  const strokeColor = measure?.lineColor ?? 'blue';
  const strokeWidth = Math.max(1, measure?.lineWeight ?? 2);
  const pointColor = measure?.pointColor ?? '#ff0000';
  const pointOpaque = !!measure?.opaquePoints;

  // 20x20 square tag with centered code
  if (obj.type === 'count') {
    const SIZE = 20;
    const sx = (obj as any).x * s, sy = (obj as any).y * s;
    const code = (obj as any).code || '';
    const fill = colorForCode(code);
    return (
      <Group
        key={obj.id}
        x={sx} y={sy}
        name={`obj-${obj.id}`}
        draggable
        onContextMenu={onCtxDelete}
        onDragEnd={(e) => {
          const nx = e.target.x();
          const ny = e.target.y();
          patchObject(pageIndex, obj.id, { x: nx / s, y: ny / s } as any);
          e.target.position({ x: nx, y: ny });
        }}
      >
        <Rect
          width={SIZE} height={SIZE}
          offsetX={SIZE/2} offsetY={SIZE/2}
          fill={fill}
          stroke={selected ? '#0d6efd' : '#222'}
          strokeWidth={selected ? 2 : 1}
          cornerRadius={4}
        />
        <KText
          text={String(code)}
          width={SIZE} height={SIZE}
          offsetX={SIZE/2} offsetY={SIZE/2}
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
          fontSize={12}
          fill="#fff"
        />
      </Group>
    );
  }

  // measurement label badge helper
  const SIZE = 20;
  const code = (obj as any).code || '';
  const fill = colorForCode(code);

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const mid = halfPoint(verts);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill={pointColor} opacity={pointOpaque ? 1 : 0.6}/>
        <Circle x={verts[1].x} y={verts[1].y} radius={4} fill={pointColor} opacity={pointOpaque ? 1 : 0.6}/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke={strokeColor} strokeWidth={strokeWidth}/>
        {/* centered code badge */}
        <Group x={mid.x} y={mid.y}>
          <Rect
            width={SIZE} height={SIZE}
            offsetX={SIZE/2} offsetY={SIZE/2}
            fill={fill}
            stroke="#222"
            cornerRadius={4}
          />
          <KText
            text={String(code)}
            width={SIZE} height={SIZE}
            offsetX={SIZE/2} offsetY={SIZE/2}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fontSize={12}
            fill="#fff"
          />
        </Group>
      </Group>
    );
  }

  if (obj.type === 'polyline') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const pts = verts.flatMap(v=>[v.x,v.y]);
    const mid = halfPoint(verts);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        {/* endpoints */}
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill={pointColor} opacity={pointOpaque ? 1 : 0.6}/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill={pointColor} opacity={pointOpaque ? 1 : 0.6}/>
        <Line points={pts} stroke={strokeColor} strokeWidth={strokeWidth}/>
        {/* centered code badge */}
        <Group x={mid.x} y={mid.y}>
          <Rect
            width={SIZE} height={SIZE}
            offsetX={SIZE/2} offsetY={SIZE/2}
            fill={fill}
            stroke="#222"
            cornerRadius={4}
          />
          <KText
            text={String(code)}
            width={SIZE} height={SIZE}
            offsetX={SIZE/2} offsetY={SIZE/2}
            align="center"
            verticalAlign="middle"
            fontStyle="bold"
            fontSize={12}
            fill="#fff"
          />
        </Group>
      </Group>
    );
  }

  if (obj.type === 'freeform') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const pts = verts.flatMap(v=>[v.x,v.y]);
    const mid = halfPoint(verts);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Line points={pts} stroke={strokeColor} strokeWidth={strokeWidth}/>
        {/* centered code badge (if a code was assigned) */}
        {code ? (
          <Group x={mid.x} y={mid.y}>
            <Rect
              width={SIZE} height={SIZE}
              offsetX={SIZE/2} offsetY={SIZE/2}
              fill={fill}
              stroke="#222"
              cornerRadius={4}
            />
            <KText
              text={String(code)}
              width={SIZE} height={SIZE}
              offsetX={SIZE/2} offsetY={SIZE/2}
              align="center"
              verticalAlign="middle"
              fontStyle="bold"
              fontSize={12}
              fill="#fff"
            />
          </Group>
        ) : null}
      </Group>
    );
  }
  return null;
}

function renderLive(
  dr: {type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[]},
  s: number,
  cursorPage: {x:number;y:number} | null,
  measure?: MeasureOptions | null
) {
  if (!dr.type) return null;

  const strokeColor = measure?.lineColor ?? 'blue';
  const strokeWidth = Math.max(1, measure?.lineWeight ?? 2);
  const pointColor = measure?.pointColor ?? '#ff0000';
  const pointOpaque = !!measure?.opaquePoints;

  // Segment: live A→B line while dragging
  if (dr.type === 'segment' && dr.pts.length === 1 && cursorPage) {
    const a = { x: dr.pts[0].x * s, y: dr.pts[0].y * s };
    const b = { x: cursorPage.x * s, y: cursorPage.y * s };
    return (
      <Group>
        <Circle x={a.x} y={a.y} radius={4} fill={pointColor} opacity={pointOpaque ? 1 : 0.6}/>
        <Line points={[a.x, a.y, b.x, b.y]} stroke={strokeColor} strokeWidth={strokeWidth}/>
      </Group>
    );
  }

  // Polyline / Freeform live trail
  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s }));
  if ((dr.type === 'polyline' || dr.type === 'freeform') && verts.length >= 1) {
    return <Group><Line points={verts.flatMap(v=>[v.x,v.y])} stroke={strokeColor} strokeWidth={strokeWidth}/></Group>;
  }
  return null;
}
