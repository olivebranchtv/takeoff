import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Line, Text as KText, Transformer, Rect, Circle } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

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

        canvas.width = Math.floor(vp.width * DPR);
        canvas.height = Math.floor(vp.height * DPR);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: zoom * DPR }),
          intent: 'display'
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
          canvas
        });

      } catch (error) {
        // Handle PDF.js rendering cancellation as expected behavior
        if (error instanceof Error && error.message.includes('Rendering cancelled')) {
          console.warn(`PDF rendering cancelled for page ${pageIndex} (expected behavior)`);
        } else {
          console.error(`Error rendering PDF page ${pageIndex}:`, error);
        }
        if (!cancelled) setInfo(null);
      }
    })();

    return () => { cancelled = true; cleanup?.(); };
  }, [pdf, zoom, pageIndex]);

  return info;
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

  const {
    pages, upsertPage, addObject, patchObject, tool, zoom,
    currentTag, setCalibration, selectedIds, selectOnly, clearSelection,
    deleteSelected, undo, redo, activePage, tags
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
    if (!posStage) { liveLabelRef.current = null; return; }

    // If calibrating: show the live pixel length between A and cursor
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
    } else if (drawingRef.current.type === 'polyline') {
      vertsPage = [...vertsPage, toPage(i, posStage)];
    } else if (drawingRef.current.type === 'freeform') {
      vertsPage = [...vertsPage, toPage(i, posStage)];
    }
    const page = pages.find(p => p.pageIndex === activePage);
    const px = pathLength(vertsPage);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : `${Math.round(px)} px`;
    liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
  }

  function commitObject(type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    addObject(activePage, {
      id: crypto.randomUUID(),
      type,
      pageIndex: activePage,
      vertices: vertsPage,
      code: currentTag || undefined,
    } as AnyTakeoffObject);
  }

  const isLeft  = (e: any) => (e?.evt?.button ?? 0) === 0;
  const isRight = (e: any) => (e?.evt?.button ?? 0) === 2;

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

    // If we clicked an object (except when calibrating), select it
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
    } else if (tool === 'segment') {
      drawingRef.current = { type: 'segment', pts: [posPage] };
    } else if (tool === 'polyline') {
      if (!drawingRef.current.type) drawingRef.current = { type: 'polyline', pts: [posPage] };
      else drawingRef.current.pts.push(posPage);
    } else if (tool === 'freeform') {
      drawingRef.current = { type: 'freeform', pts: [posPage] };
      freeformActive.current = true;
    } else if (tool === 'calibrate') {
      // Local-only: collect 2 points, then prompt and commit scale
      if (calibPtsRef.current.length === 0) {
        calibPtsRef.current = [posPage];
        calibLiveRef.current = posPage;
      } else if (calibPtsRef.current.length === 1) {
        calibPtsRef.current = [calibPtsRef.current[0], posPage];
        calibLiveRef.current = posPage;

        try {
          const px = pathLength(calibPtsRef.current);
          const input = prompt('Enter real length between points (feet):', '10');
          const feet = input ? parseFloat(input) : NaN;
          if (!isNaN(feet) && feet > 0) {
            setCalibration(activePage, px / feet, 'ft');
          }
        } finally {
          // Clear local calibration state regardless
          calibPtsRef.current = [];
          calibLiveRef.current = null;
        }
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
              {renderLive(drawingRef.current, s, cursorPageRef.current)}

              {/* CALIBRATION OVERLAY (local; two red dots and a yellow guide) */}
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
  if (pts.length === 2) {
    return { x: (pts[0].x + pts[1].x)/2, y: (pts[0].y + pts[1].y)/2 };
  }
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

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const mid = halfPoint(verts);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[1].x} y={verts[1].y} radius={4} fill="red"/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/>
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
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill="red"/>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
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
        <Line points={pts} stroke="blue" strokeWidth={2}/>
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
  cursorPage: {x:number;y:number} | null
) {
  if (!dr.type) return null;

  if (dr.type === 'segment' && dr.pts.length === 1 && cursorPage) {
    const a = { x: dr.pts[0].x * s, y: dr.pts[0].y * s };
    const b = { x: cursorPage.x * s, y: cursorPage.y * s };
    return (
      <Group>
        <Circle x={a.x} y={a.y} radius={4} fill="red"/>
        <Line points={[a.x, a.y, b.x, b.y]} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }

  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s }));
  if (dr.type === 'polyline' && verts.length >= 1) {
    return <Group><Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/></Group>;
  }
  if (dr.type === 'freeform' && verts.length >= 1) {
    return <Group><Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/></Group>;
  }
  return null;
}

function renderCalibration(calibPts: {x:number;y:number}[], live: {x:number;y:number} | null, s: number) {
  if (calibPts.length === 0) return null;
  const A = calibPts[0];
  const B = calibPts.length === 2 ? calibPts[1] : live;
  const items: React.ReactNode[] = [];
  // first point
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
