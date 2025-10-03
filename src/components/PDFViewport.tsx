// src/components/PDFViewport.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Line, Text as KText, Transformer, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject, MeasureOptions } from '@/types';
import MeasureDialog from '@/components/MeasureDialog';

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
        if (pageIndex >= pdf.numPages) throw new Error(`Page index ${pageIndex} out of range`);
        const page = await pdf.getPage(pageIndex + 1);
        if (cancelled) return;

        const baseVp = page.getViewport({ scale: 1 });
        const vp = page.getViewport({ scale: zoom });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        canvas.width = Math.floor(vp.width * DPR);
        canvas.height = Math.floor(vp.height * DPR);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: zoom * DPR }),
          intent: 'display',
        });
        cleanup = () => { try { renderTask.cancel(); } catch {} };
        await renderTask.promise;
        if (cancelled) return;

        setInfo({
          pageIndex,
          baseWidth: baseVp.width,
          baseHeight: baseVp.height,
          width: vp.width,
          height: vp.height,
          canvas,
        });
      } catch (error: any) {
        if (!cancelled) setInfo(null);
        if (!/Rendering cancelled/i.test(error?.message || '')) {
          console.error(`Error rendering PDF page ${pageIndex}:`, error);
        }
      }
    })();

    return () => { cancelled = true; cleanup?.(); };
  }, [pdf, zoom, pageIndex]);

  return info;
}

// ---- measure math for object result (supports wastePct / conductor extras) ----
function computeResult(
  ppf: number | undefined,
  verts: {x:number;y:number}[],
  opts?: MeasureOptions
) {
  const points = verts.length;
  const px = pathLength(verts);
  const baseLengthFt = ppf && ppf > 0 ? (px / ppf) : 0;

  const racewayExtra = (opts?.extraRacewayPerPoint ?? 0) * points;
  const conductorExtraEach = (opts?.extraConductorPerPoint ?? 0) * points;

  const wasteFactor =
    typeof (opts as any)?.wasteFactor === 'number'
      ? Math.max(1, (opts as any).wasteFactor)
      : 1 + Math.max(0, Math.min(1, (opts as any)?.wastePct ?? 0));

  const racewayLen = (baseLengthFt + racewayExtra) * wasteFactor;

  const conductors = (opts?.conductors ?? []).slice(0, 3).map((g: any) => {
    const count = Math.max(0, Math.floor(g?.count ?? 0));
    const lengthFt = count > 0 ? count * (baseLengthFt + conductorExtraEach) * wasteFactor : 0;
    return {
      count,
      size: g?.gauge ?? g?.size ?? '',                   // tolerate legacy `size`
      insulation: g?.insulation ?? 'THHN/THWN-2',
      material: g?.material ?? 'CU',
      lengthFt,
    };
  });

  const boxes = (opts?.boxesPerPoint ?? 0) * points;

  return {
    points,
    baseLengthFt,
    raceway: {
      emtSize: (opts as any)?.emtSize ?? '',
      extraFt: racewayExtra * wasteFactor,
      lengthFt: racewayLen,
    },
    conductors,
    boxes,
    calculatedAt: new Date().toISOString(),
  };
}

export default function PDFViewport({ pdf }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  // drawing state
  const drawingRef = useRef<{ type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[] }>({ type: null, pts: [] });
  const freeformActive = useRef<boolean>(false);

  // calibration (LOCAL ONLY; no store mutation until confirmed)
  const calibPtsRef = useRef<{x:number;y:number}[]>([]);
  const calibLiveRef = useRef<{x:number;y:number} | null>(null);

  // live helpers
  const cursorPageRef = useRef<{x:number;y:number} | null>(null);
  const [, setPaintTick] = useState(0);
  const liveLabelRef = useRef<{text:string;x:number;y:number}|null>(null);

  // measurement dialog
  const [measureOpen, setMeasureOpen] = useState(false);
  const measureRef = useRef<MeasureOptions | undefined>(undefined);
  const armedToolRef = useRef<'polyline'|'freeform'|null>(null);

  // calibration dialog
  const [calibOpen, setCalibOpen] = useState(false);
  const [calibPxLen, setCalibPxLen] = useState<number>(0);
  const [calibFeetInput, setCalibFeetInput] = useState<string>('10');

  const {
    pages, upsertPage, addObject, patchObject, tool, setTool, zoom,
    currentTag, setCalibration, selectedIds, selectOnly, clearSelection,
    deleteSelected, undo, redo, activePage, tags, getLastMeasureOptions
  } = useStore();

  // open measurement dialog when tool is armed and not currently drawing
  useEffect(() => {
    if ((tool === 'polyline' || tool === 'freeform') && !drawingRef.current.type) {
      armedToolRef.current = tool;
      setMeasureOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool]);

  // initial page scaffolding
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
    if (!posStage) { liveLabelRef.current = null; return; }

    if (tool === 'calibrate' && calibPtsRef.current.length === 1) {
      const a = calibPtsRef.current[0];
      const b = toPage(i, posStage);
      const px = pathLength([a, b]);
      const page = pages.find(p => p.pageIndex === activePage);
      const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
      const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft (current scale)` : `${Math.round(px)} px`;
      liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
      return;
    }

    if (!drawingRef.current.type) { liveLabelRef.current = null; return; }

    let vertsPage = drawingRef.current.pts.slice();
    if (drawingRef.current.type === 'segment') {
      if (vertsPage.length === 1) vertsPage = [vertsPage[0], toPage(i, posStage)];
    } else if (drawingRef.current.type === 'polyline' || drawingRef.current.type === 'freeform') {
      vertsPage = [...vertsPage, toPage(i, posStage)];
    }
    const page = pages.find(p => p.pageIndex === activePage);
    const px = pathLength(vertsPage);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : `${Math.round(px)} px`;
    liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
  }

  function commitObject(type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    const page = pages.find(p => p.pageIndex === activePage);
    const result = computeResult(page?.pixelsPerFoot, vertsPage, measureRef.current);

    addObject(activePage, {
      id: crypto.randomUUID(),
      type,
      pageIndex: activePage,
      vertices: vertsPage,
      code: currentTag || undefined,
      lengthFt: result.raceway.lengthFt, // visual length fallback
      measure: measureRef.current,
      result,
    } as AnyTakeoffObject);

    // ALSO add a count object at the midpoint if there's a currentTag
    // This allows measurements to count as fixtures in the BOM
    if (currentTag && vertsPage.length >= 2) {
      const midIdx = Math.floor(vertsPage.length / 2);
      const midPoint = vertsPage[midIdx];
      addObject(activePage, {
        id: crypto.randomUUID(),
        type: 'count',
        code: currentTag,
        pageIndex: activePage,
        x: midPoint.x,
        y: midPoint.y,
        rotation: 0
      } as any);
    }
  }

  const isLeft  = (e: any) => (e?.evt?.button ?? 0) === 0;
  const isRight = (e: any) => (e?.evt?.button ?? 0) === 2;

  function onMouseDown(e: any) {
    if (!info) return;

    // right-click delete
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

    // select existing (not during calibrate)
    if (tool !== 'calibrate' && e.target?.attrs?.name?.startsWith('obj-')) {
      const id = e.target.attrs.name.substring(4);
      selectOnly(id);
      return;
    } else {
      if (tool !== 'calibrate') clearSelection();
    }

    if (tool === 'hand') return;

    if (tool === 'count') {
      addObject(activePage, {
        id: crypto.randomUUID(),
        type: 'count',
        code: currentTag,
        pageIndex: activePage, x: posPage.x, y: posPage.y, rotation: 0
      } as any);
      return;
    }

    // require options for line-like types
    if ((tool === 'polyline' || tool === 'freeform') && !measureRef.current) {
      armedToolRef.current = tool;
      setMeasureOpen(true);
      return;
    }

    if (tool === 'segment') {
      drawingRef.current = { type: 'segment', pts: [posPage] };
    } else if (tool === 'polyline') {
      if (!drawingRef.current.type) drawingRef.current = { type: 'polyline', pts: [posPage] };
      else drawingRef.current.pts.push(posPage);
    } else if (tool === 'freeform') {
      drawingRef.current = { type: 'freeform', pts: [posPage] };
      freeformActive.current = true;
    } else if (tool === 'calibrate') {
      // collect 2 points, then open a small dialog (no window.prompt)
      if (calibPtsRef.current.length === 0) {
        calibPtsRef.current = [posPage];
        calibLiveRef.current = posPage;
      } else if (calibPtsRef.current.length === 1) {
        calibPtsRef.current = [calibPtsRef.current[0], posPage];
        calibLiveRef.current = posPage;

        const px = pathLength(calibPtsRef.current);
        setCalibPxLen(px);
        setCalibFeetInput('10');
        setCalibOpen(true);

        // keep local markers but stop live drawing
        calibPtsRef.current = [];
        calibLiveRef.current = null;
      }
    }
    updateLiveLabel(info);
    setPaintTick(t => t + 1);
  }

  function onMouseMove() {
    if (!info) return;

    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition();
    if (posStage) {
      const p = toPage(info, posStage);
      cursorPageRef.current = p;
      if (tool === 'calibrate' && calibPtsRef.current.length === 1) {
        calibLiveRef.current = p;
      }
    }

    if (tool === 'freeform' && freeformActive.current) {
      const pt = cursorPageRef.current;
      if (pt) drawingRef.current.pts.push(pt);
    }

    updateLiveLabel(info);
    setPaintTick(t => t + 1);
  }

  function onMouseUp() {
    if (!info) return;
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
      const pts = drawingRef.current.pts;
      const simplified = simplifyRDP(pts, 1.5);
      drawingRef.current = { type: null, pts: [] };
      cursorPageRef.current = null;
      liveLabelRef.current = null;
      if (simplified.length >= 2) commitObject('freeform', simplified);
    }
    setPaintTick(t => t + 1);
  }

  function onDblClick() {
    if (drawingRef.current.type === 'polyline') {
      const pts = drawingRef.current.pts.slice();
      drawingRef.current = { type: null, pts: [] };
      if (pts.length >= 2) commitObject('polyline', pts);
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
        calibPtsRef.current = [];
        calibLiveRef.current = null;
        setPaintTick(t => t + 1);
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
      {/* Measurement options dialog */}
      <MeasureDialog
        open={measureOpen}
        initial={getLastMeasureOptions?.()}
        onCancel={() => {
          setMeasureOpen(false);
          if (armedToolRef.current) setTool('hand');
          armedToolRef.current = null;
        }}
        onSubmit={(opts) => {
          measureRef.current = opts;
          setMeasureOpen(false);
        }}
        title={armedToolRef.current ? `Set Options for ${armedToolRef.current === 'polyline' ? 'Polyline' : 'Freeform'} Run` : 'Measurement Options'}
      />

      {/* Calibration dialog (no window.prompt -> no page reset) */}
      {calibOpen && (
        <div style={backdropStyle} onMouseDown={(e)=>{ if (e.target===e.currentTarget) setCalibOpen(false); }}>
          <div style={panelStyle} onMouseDown={(e)=>e.stopPropagation()}>
            <div style={headerStyle}>
              <div style={{fontWeight:700}}>Calibrate Page</div>
              <button className="btn" onClick={()=>setCalibOpen(false)}>×</button>
            </div>
            <div style={{padding:14}}>
              <div style={{marginBottom:8, color:'#555'}}>Pixel distance between picked points: <b>{calibPxLen.toFixed(1)} px</b></div>
              <label style={{display:'block', marginBottom:6}}>Real length (feet)</label>
              <input
                type="number"
                min={0.0001}
                step={0.1}
                value={calibFeetInput}
                onChange={(e)=>setCalibFeetInput(e.target.value)}
                style={{width:'100%', padding:'6px 8px', border:'1px solid #ccc', borderRadius:6}}
              />
            </div>
            <div style={footerStyle}>
              <button className="btn" onClick={()=>setCalibOpen(false)}>Cancel</button>
              <button
                className="btn primary"
                onClick={()=>{
                  const feet = parseFloat(calibFeetInput);
                  if (Number.isFinite(feet) && feet > 0) {
                    const ppf = calibPxLen / feet;
                    setCalibration(activePage, ppf, 'ft');
                  }
                  setCalibOpen(false);
                }}
              >
                Set Scale
              </button>
            </div>
          </div>
        </div>
      )}

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
              {renderLive(drawingRef.current, s, cursorPageRef.current, measureRef.current)}

              {/* CALIBRATION preview (first point + live cursor) */}
              {renderCalibration(calibPtsRef.current, calibLiveRef.current, s)}

              {liveLabelRef.current && (
                <KText x={liveLabelRef.current.x} y={liveLabelRef.current.y} text={liveLabelRef.current.text} fontSize={12} fill="#000" />
              )}
              <Transformer ref={trRef} rotateEnabled={true} resizeEnabled={false} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

/* --------- helpers to place a badge at the half-length point --------- */
function halfPoint(pts: {x:number;y:number}[]) {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y };
  if (pts.length === 2) return { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y) / 2 };
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

  const SIZE = 20;
  const code = (obj as any).code || '';
  const fill = colorForCode(code);
  const stroke = obj.measure?.lineColor || 'blue';
  const strokeWidth = Math.max(1, obj.measure?.lineWeight ?? 2);

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const mid = halfPoint(verts);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill={obj.measure?.pointColor || 'red'}/>
        <Circle x={verts[1].x} y={verts[1].y} radius={4} fill={obj.measure?.pointColor || 'red'}/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke={stroke} strokeWidth={strokeWidth}/>
        <Group x={mid.x} y={mid.y}>
          <Rect width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} fill={fill} stroke="#222" cornerRadius={4} />
          <KText text={String(code)} width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} align="center" verticalAlign="middle" fontStyle="bold" fontSize={12} fill="#fff" />
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
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill={obj.measure?.pointColor || 'red'}/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill={obj.measure?.pointColor || 'red'}/>
        <Line points={pts} stroke={stroke} strokeWidth={strokeWidth}/>
        <Group x={mid.x} y={mid.y}>
          <Rect width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} fill={fill} stroke="#222" cornerRadius={4} />
          <KText text={String(code)} width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} align="center" verticalAlign="middle" fontStyle="bold" fontSize={12} fill="#fff" />
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
        <Line points={pts} stroke={stroke} strokeWidth={strokeWidth}/>
        {code ? (
          <Group x={mid.x} y={mid.y}>
            <Rect width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} fill={fill} stroke="#222" cornerRadius={4} />
            <KText text={String(code)} width={SIZE} height={SIZE} offsetX={SIZE/2} offsetY={SIZE/2} align="center" verticalAlign="middle" fontStyle="bold" fontSize={12} fill="#fff" />
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
  opts?: MeasureOptions
) {
  if (!dr.type) return null;
  const stroke = opts?.lineColor || 'blue';
  const strokeWidth = Math.max(1, opts?.lineWeight ?? 2);

  if (dr.type === 'segment' && dr.pts.length === 1 && cursorPage) {
    const a = { x: dr.pts[0].x * s, y: dr.pts[0].y * s };
    const b = { x: cursorPage.x * s, y: cursorPage.y * s };
    return (
      <Group>
        <Circle x={a.x} y={a.y} radius={4} fill={opts?.pointColor || 'red'}/>
        <Line points={[a.x, a.y, b.x, b.y]} stroke={stroke} strokeWidth={strokeWidth}/>
      </Group>
    );
  }

  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s }));
  if ((dr.type === 'polyline' || dr.type === 'freeform') && verts.length >= 1) {
    return <Group><Line points={verts.flatMap(v=>[v.x,v.y])} stroke={stroke} strokeWidth={strokeWidth}/></Group>;
  }
  return null;
}

function renderCalibration(calibPts: {x:number;y:number}[], live: {x:number;y:number} | null, s: number) {
  if (calibPts.length === 0) return null;
  const A = calibPts[0];
  const B = calibPts.length === 2 ? calibPts[1] : live;
  const items: React.ReactNode[] = [];
  items.push(<Circle key="a" x={A.x*s} y={A.y*s} radius={5} fill="#ff0000" stroke="#222" strokeWidth={1} />);
  if (B) {
    items.push(
      <Group key="line">
        <Circle x={B.x*s} y={B.y*s} radius={5} fill="#ff0000" stroke="#222" strokeWidth={1} />
        <Line points={[A.x*s, A.y*s, B.x*s, B.y*s]} stroke="#ffd000" strokeWidth={3} dash={[8,6]} />
      </Group>
    );
  }
  return <Group>{items}</Group>;
}

/* --- tiny dialog styles (shared with MeasureDialog look) --- */
const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
};
const panelStyle: React.CSSProperties = {
  width: 420, maxWidth: '96vw', background: '#fff', borderRadius: 10,
  border: '1px solid #ddd', boxShadow: '0 12px 40px rgba(0,0,0,.25)', overflow: 'hidden'
};
const headerStyle: React.CSSProperties = {
  display:'flex', alignItems:'center', justifyContent:'space-between',
  padding:'12px 14px', borderBottom:'1px solid #eee'
};
const footerStyle: React.CSSProperties = {
  display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderTop:'1px solid #eee'
};
