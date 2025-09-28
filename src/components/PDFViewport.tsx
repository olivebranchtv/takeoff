import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Rect, Line, Text as KText, Transformer } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

/** Geometry saved in PAGE coords; render scales with pageScale. */

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
    if (!pdf) { setInfo(null); return; }
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    (async () => {
      const page = await pdf.getPage(pageIndex + 1);
      const baseVp = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: zoom });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = Math.floor(vp.width * DPR);
      canvas.height = Math.floor(vp.height * DPR);
      canvas.style.width = `${vp.width}px`;
      canvas.style.height = `${vp.height}px`;

      await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: zoom * DPR }) }).promise;
      if (cancelled) return;
      setInfo({
        pageIndex,
        baseWidth: baseVp.width,
        baseHeight: baseVp.height,
        width: vp.width,
        height: vp.height,
        canvas
      });
    })();

    return () => { cancelled = true; };
  }, [pdf, zoom, pageIndex]);

  return info;
}

export default function PDFViewport({ pdf }: Props) {
  const stageRef = useRef<Konva.Stage>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const drawingRef = useRef<{ type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[] }>({ type: null, pts: [] });
  const freeformActive = useRef<boolean>(false);
  const liveLabelRef = useRef<{text:string;x:number;y:number}|null>(null);

  const {
    pages, upsertPage, addObject, patchObject, removeObject,
    tool, zoom, setZoom, currentTag,
    setCalibration, selectedIds, selectOnly, clearSelection, deleteSelected, undo, redo,
    activePage, setActivePage, pageCount, setPageCount, pageLabels, setPageLabels,
    colorForCode, tagByCode
  } = useStore();

  // Ensure per-page state
  useEffect(() => {
    if (!pdf) return;
    if (pages.length === 0) {
      Array.from({ length: pdf.numPages }).forEach((_, idx) =>
        upsertPage({ pageIndex: idx, objects: [], pixelsPerFoot: undefined, unit: 'ft' })
      );
    }
    if (pageCount === 0) setPageCount(pdf.numPages);
    if (pageLabels.length === 0) {
      (async () => {
        try {
          // @ts-ignore
          const raw = await (pdf as any).getPageLabels?.();
          if (raw && Array.isArray(raw)) setPageLabels(raw.map((l: string, i:number)=>l || `Page ${i+1}`));
          else setPageLabels(Array.from({length: pdf.numPages}, (_,i)=>`Page ${i+1}`));
        } catch {
          setPageLabels(Array.from({length: pdf.numPages}, (_,i)=>`Page ${i+1}`));
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf]);

  const info = usePageBitmap(pdf, zoom, activePage);
  const pageScale = (i: PageRenderInfo) => i.width / i.baseWidth;
  const toPage  = (i: PageRenderInfo, spt:{x:number;y:number}) => ({ x: spt.x / pageScale(i), y: spt.y / pageScale(i) });

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * factor);
  }

  function updateLiveLabel(i: PageRenderInfo) {
    const stage = stageRef.current;
    const posStage = stage?.getPointerPosition();
    if (!posStage) { liveLabelRef.current = null; return; }
    if (!drawingRef.current.type) { liveLabelRef.current = null; return; }

    let vertsPage = drawingRef.current.pts.slice();
    if (drawingRef.current.type === 'segment') {
      if (vertsPage.length === 1) vertsPage = [vertsPage[0], toPage(i, posStage)];
    } else if (drawingRef.current.type === 'polyline') {
      vertsPage = [...vertsPage, toPage(i, posStage)];
    }
    const page = pages.find(p => p.pageIndex === activePage);
    const px = pathLength(vertsPage);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : '—';
    liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
  }

  function commitObject(type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    addObject(activePage, { id: crypto.randomUUID(), type, pageIndex: activePage, vertices: vertsPage });
  }

  function onMouseDown(e: any) {
    if (!info) return;
    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition()!;
    const posPage = toPage(info, posStage);

    // select / context
    if (e.target?.attrs?.name?.startsWith('obj-')) {
      const id = e.target.attrs.name.substring(4);
      // right-click → delete that object
      if (e.evt && (e.evt.button === 2)) {
        e.evt.preventDefault();
        removeObject(activePage, id);
        return;
      }
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
      if (!drawingRef.current.type) drawingRef.current = { type: 'polyline', pts: [posPage] };
      else drawingRef.current.pts.push(posPage);
    } else if (tool === 'freeform') {
      drawingRef.current = { type: 'freeform', pts: [posPage] };
      freeformActive.current = true;
    } else if (tool === 'calibrate') {
      const page = pages.find(p => p.pageIndex === activePage)!;
      const next = (page.__calibPts || []).concat(posPage);
      page.__calibPts = next;
      if (next.length === 2) {
        const px = pathLength(next);
        const input = prompt('Enter real length between points (feet):', '10');
        const feet = input ? parseFloat(input) : NaN;
        if (!isNaN(feet) && feet > 0) {
          const ppf = px / feet;
          setCalibration(activePage, ppf, 'ft');
        }
        page.__calibPts = [];
      }
    }
    updateLiveLabel(info);
  }

  function onMouseMove() {
    if (!info) return;
    if (tool === 'freeform' && freeformActive.current) {
      const stage = stageRef.current!;
      const posStage = stage.getPointerPosition()!;
      const posPage = toPage(info, posStage);
      drawingRef.current.pts.push(posPage);
    }
    updateLiveLabel(info);
  }

  function onMouseUp() {
    if (!info) return;
    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition();
    if (!posStage) return;
    if (!drawingRef.current.type) return;

    if (drawingRef.current.type === 'segment') {
      const endPage = toPage(info, posStage);
      const pts = [...drawingRef.current.pts, endPage];
      drawingRef.current = { type: null, pts: [] };
      commitObject('segment', pts);
    } else if (drawingRef.current.type === 'polyline') {
      // commit on dblclick
    } else if (drawingRef.current.type === 'freeform') {
      freeformActive.current = false;
      const simplified = simplifyRDP(drawingRef.current.pts, 1.5);
      drawingRef.current = { type: null, pts: [] };
      commitObject('freeform', simplified);
    }
    liveLabelRef.current = null;
  }

  function onDblClick() {
    if (drawingRef.current.type === 'polyline') {
      const pts = drawingRef.current.pts.slice();
      drawingRef.current = { type: null, pts: [] };
      commitObject('polyline', pts);
    }
    liveLabelRef.current = null;
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
        liveLabelRef.current = null;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePage, deleteSelected, undo, redo]);

  if (!pdf || !info) {
    return <div className="content" onWheel={handleWheel}><div style={{padding:'2rem'}}><div className="drop">Drop a PDF to begin or use the file picker.</div></div></div>;
  }

  const pState = pages.find(p => p.pageIndex === activePage);
  const w = info.width, h = info.height;
  const s = pageScale(info);
  const pageObjects = pState?.objects ?? [];

  const labelFor = (i: number) => (useStore.getState().pageLabels[i] || `Page ${i + 1}`);

  return (
    <div className="content" onWheel={handleWheel}>
      {/* Fallback quick page selector */}
      {pageCount > 1 && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, display: 'flex', gap: 6 }}>
          <button className="btn" onClick={() => setActivePage(Math.max(0, activePage - 1))}>◀</button>
          <select className="btn" value={activePage} onChange={(e)=>setActivePage(parseInt(e.target.value,10))}>
            {Array.from({ length: pageCount }, (_, i) => (
              <option key={i} value={i}>{i + 1} — {labelFor(i)}</option>
            ))}
          </select>
          <button className="btn" onClick={() => setActivePage(Math.min(pageCount - 1, activePage + 1))}>▶</button>
        </div>
      )}

      <div className="pageBox" style={{ width: w, height: h }}>
        <div style={{position:'absolute', inset:0}}>
          <div style={{position:'absolute', inset:0}} ref={(el)=>{
            if (el && info.canvas.parentElement !== el) { el.innerHTML = ''; el.appendChild(info.canvas); }
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
            onContextMenu={(e)=>{ e.evt.preventDefault(); }}
          >
            <Layer listening>
              {pageObjects.map(obj =>
                renderObject(obj, selectedIds.includes(obj.id), s, activePage, patchObject, removeObject, colorForCode, tagByCode)
              )}
              {renderLive(drawingRef.current, s)}
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

function renderObject(
  obj: AnyTakeoffObject,
  selected: boolean,
  s: number,
  pageIndex: number,
  patchObject: (pageIndex:number, id:string, patch: Partial<AnyTakeoffObject>) => void,
  removeObject: (pageIndex:number, id:string) => void,
  colorForCode: (code:string)=>string,
  tagByCode: (code:string)=>ReturnType<typeof useStore.getState>['tagByCode']
) {
  if (obj.type === 'count') {
    const size = 20 * s; // scale square with zoom
    const sx = (obj as any).x * s, sy = (obj as any).y * s;
    const color = colorForCode((obj as any).code);
    const tag = tagByCode((obj as any).code);
    return (
      <Group
        key={obj.id}
        x={sx} y={sy}
        name={`obj-${obj.id}`}
        draggable
        onDragEnd={(e) => {
          const nx = e.target.x() / s;
          const ny = e.target.y() / s;
          patchObject(pageIndex, obj.id, { x: nx, y: ny } as any);
          e.target.position({ x: nx*s, y: ny*s });
        }}
        onContextMenu={(e:any)=>{ e.evt.preventDefault(); removeObject(pageIndex, obj.id); }}
        onMouseDown={(e:any)=>{ if (e.evt.button===2) { e.evt.preventDefault(); removeObject(pageIndex, obj.id); } }}
      >
        <Rect width={size} height={size} offsetX={size/2} offsetY={size/2}
              fill={color} stroke={selected ? '#0d6efd' : '#111'} strokeWidth={selected ? 2 : 1} cornerRadius={3}/>
        {/* small code label */}
        <KText text={(obj as any).code}
               fontSize={12} fill="#000"
               offsetX={-size/2} offsetY={-size/2 - 2} />
      </Group>
    );
  }

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="#0066FF" strokeWidth={2}/>
      </Group>
    );
  }

  if (obj.type === 'polyline') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const pts = verts.flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Line points={pts} stroke="#0066FF" strokeWidth={2}/>
      </Group>
    );
  }

  if (obj.type === 'freeform') {
    const pts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s })).flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Line points={pts} stroke="#0066FF" strokeWidth={2}/>
      </Group>
    );
  }
  return null;
}

function renderLive(
  dr: {type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[]},
  s: number
) {
  if (!dr.type) return null;
  if (dr.type === 'segment' && dr.pts.length === 1) {
    // show a small anchor
    const a = dr.pts[0]; const ax = a.x*s, ay = a.y*s;
    return <Rect x={ax-3} y={ay-3} width={6} height={6} fill="red" />;
  }
  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s }));
  return <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="#0066FF" strokeWidth={2}/>;
}
