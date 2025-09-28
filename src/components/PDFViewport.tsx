import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Circle, Line, Text as KText, Transformer } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

type Props = { pdf: PDFDoc | null };

type PageRenderInfo = {
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
};

function usePageBitmaps(pdf: PDFDoc | null, zoom: number) {
  const [pages, setPages] = useState<{pageIndex:number; info?: PageRenderInfo}[]>([]);
  useEffect(() => {
    if (!pdf) { setPages([]); return; }
    let cancelled = false;
    const DPR = Math.max(1, window.devicePixelRatio || 1);
    (async () => {
      const arr: {pageIndex:number; info?: PageRenderInfo}[] = [];
      for (let i=1; i<=pdf.numPages; i++) arr.push({ pageIndex: i-1 });
      setPages(arr);
      for (let i=1; i<=pdf.numPages; i++) {
        if (cancelled) break;
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = Math.floor(viewport.width * DPR);
        canvas.height = Math.floor(viewport.height * DPR);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        await page.render({ canvasContext: ctx, viewport: page.getViewport({ scale: zoom * DPR }) }).promise;
        if (cancelled) break;
        setPages(p => p.map(x => x.pageIndex === i-1 ? ({...x, info:{ width: viewport.width, height: viewport.height, canvas }}) : x));
      }
    })();
    return () => { cancelled = true; };
  }, [pdf, zoom]);
  return pages;
}

export default function PDFViewport({ pdf }: Props) {
  const stageRefs = useRef<Record<number, Konva.Stage>>({});
  const trRef = useRef<Konva.Transformer>(null);
  const [activePage, setActivePage] = useState<number>(0);
  const drawingRef = useRef<{ type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[] }>({ type: null, pts: [] });
  const freeformActive = useRef<boolean>(false);
  const liveLabelRef = useRef<{text:string;x:number;y:number}|null>(null);

  const {
    pages, upsertPage, addObject, replaceObjects, tool, zoom, setZoom, currentTag,
    setCalibration, selectedIds, selectOnly, clearSelection, deleteSelected, undo, redo
  } = useStore();

  // init per-page state on new pdf
  useEffect(() => {
    if (!pdf) return;
    if (pages.length === 0) {
      Array.from({length: pdf.numPages}).forEach((_, idx) =>
        upsertPage({ pageIndex: idx, objects: [], pixelsPerFoot: undefined, unit: 'ft' })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf]);

  const bitmaps = usePageBitmaps(pdf, zoom);

  // zoom on wheel (center)
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * factor);
  }

  function updateLiveLabel(pageIndex:number) {
    const stage = stageRefs.current[pageIndex];
    const pos = stage?.getPointerPosition();
    if (!pos) { liveLabelRef.current = null; return; }
    if (!drawingRef.current.type) { liveLabelRef.current = null; return; }
    const pts = drawingRef.current.pts.slice();
    if (drawingRef.current.type === 'segment') {
      if (pts.length === 1) {
        const temp = [pts[0], pos];
        liveLabelRef.current = { text: lengthText(pageIndex, temp), x: pos.x+8, y: pos.y-12 };
      }
    } else if (drawingRef.current.type === 'polyline') {
      const temp = [...pts, pos];
      liveLabelRef.current = { text: lengthText(pageIndex, temp), x: pos.x+8, y: pos.y-12 };
    } else if (drawingRef.current.type === 'freeform') {
      liveLabelRef.current = { text: lengthText(pageIndex, pts), x: pos.x+8, y: pos.y-12 };
    }
  }

  function lengthText(pageIndex:number, verts:{x:number;y:number}[]) {
    const page = pages.find(p => p.pageIndex === pageIndex);
    const px = pathLength(verts);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    return page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : '—';
  }

  function commitObject(pageIndex:number, type:'segment'|'polyline'|'freeform', verts:{x:number;y:number}[]) {
    addObject(pageIndex, { id: crypto.randomUUID(), type, pageIndex, vertices: verts });
  }

  function onStageMouseDown(pageIndex: number, e: any) {
    const stage = stageRefs.current[pageIndex];
    const pos = stage.getPointerPosition()!;
    if (e.target?.attrs?.name?.startsWith('obj-')) {
      // select
      const id = e.target.attrs.name.substring(4);
      selectOnly(id);
      return;
    } else {
      clearSelection();
    }

    if (tool === 'hand') return;

    if (tool === 'count') {
      addObject(pageIndex, {
        id: crypto.randomUUID(),
        type: 'count',
        code: currentTag,
        pageIndex, x: pos.x, y: pos.y, rotation: 0
      });
    } else if (tool === 'segment') {
      drawingRef.current = { type: 'segment', pts: [pos] };
    } else if (tool === 'polyline') {
      if (!drawingRef.current.type) drawingRef.current = { type: 'polyline', pts: [pos] };
      else drawingRef.current.pts.push(pos);
    } else if (tool === 'freeform') {
      drawingRef.current = { type: 'freeform', pts: [pos] };
      freeformActive.current = true;
    } else if (tool === 'calibrate') {
      const page = pages.find(p => p.pageIndex === pageIndex)!;
      const next = (page.__calibPts || []).concat(pos);
      page.__calibPts = next;
      if (next.length === 2) {
        const px = pathLength(next);
        const input = prompt('Enter real length between points (feet):', '10');
        const feet = input ? parseFloat(input) : NaN;
        if (!isNaN(feet) && feet > 0) {
          const ppf = px / feet;
          setCalibration(pageIndex, ppf, 'ft');
        }
        page.__calibPts = [];
      }
    }
    updateLiveLabel(pageIndex);
  }

  function onStageMouseMove(pageIndex: number) {
    if (tool === 'freeform' && freeformActive.current) {
      const stage = stageRefs.current[pageIndex];
      const pos = stage.getPointerPosition()!;
      drawingRef.current.pts.push(pos);
    }
    updateLiveLabel(pageIndex);
  }

  function onStageMouseUp(pageIndex: number) {
    const stage = stageRefs.current[pageIndex];
    const pos = stage.getPointerPosition();
    if (!pos) return;
    if (!drawingRef.current.type) return;

    if (drawingRef.current.type === 'segment') {
      const pts = [...drawingRef.current.pts, pos];
      drawingRef.current = { type: null, pts: [] };
      commitObject(pageIndex, 'segment', pts);
    } else if (drawingRef.current.type === 'polyline') {
      // commit on double-click
    } else if (drawingRef.current.type === 'freeform') {
      freeformActive.current = false;
      const simplified = simplifyRDP(drawingRef.current.pts, 1.5);
      drawingRef.current = { type: null, pts: [] };
      commitObject(pageIndex, 'freeform', simplified);
    }
    liveLabelRef.current = null;
  }

  function onStageDblClick(pageIndex: number) {
    if (drawingRef.current.type === 'polyline') {
      const pts = drawingRef.current.pts.slice();
      drawingRef.current = { type: null, pts: [] };
      commitObject(pageIndex, 'polyline', pts);
    }
    liveLabelRef.current = null;
  }

  // attach transformer to selected nodes
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const stage = stageRefs.current[activePage];
    if (!stage) return;
    const layer = stage.findOne('Layer') as Konva.Layer;
    const nodes = selectedIds
      .map(id => stage.findOne(`.obj-${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    layer?.batchDraw();
  }, [selectedIds, activePage]);

  // key shortcuts: Delete, Ctrl/Cmd+Z/Y
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

  return (
    <div className="content" onWheel={handleWheel}>
      {!pdf && <div style={{padding:'2rem'}}><div className="drop">Drop a PDF to begin or use the file picker.</div></div>}
      {pdf && bitmaps.map(({ pageIndex, info }) => {
        const pState = pages.find(p => p.pageIndex === pageIndex);
        const w = info?.width ?? 800, h = info?.height ?? 1000;
        const pageObjects = pState?.objects ?? [];
        return (
          <div key={pageIndex} className="pageBox" style={{ width: w, height: h }} onMouseEnter={() => setActivePage(pageIndex)}>
            {info?.canvas && (
              <div style={{position:'absolute', inset:0}}>
                <div style={{position:'absolute', inset:0}} ref={(el)=>{
                  if (el && info.canvas.parentElement !== el) { el.innerHTML = ''; el.appendChild(info.canvas); }
                }}/>
                <div className="calib">
                  {pState?.pixelsPerFoot ? `Calibrated: ${pState.pixelsPerFoot.toFixed(2)} px/ft` : 'Not calibrated'}
                </div>
                <Stage
                  width={w} height={h} style={{position:'absolute', inset:0}}
                  ref={(node)=>{ if (node) stageRefs.current[pageIndex] = node }}
                  onMouseDown={(e)=>onStageMouseDown(pageIndex, e)}
                  onMouseMove={()=>onStageMouseMove(pageIndex)}
                  onMouseUp={()=>onStageMouseUp(pageIndex)}
                  onDblClick={()=>onStageDblClick(pageIndex)}
                >
                  <Layer listening>
                    {/* existing objects */}
                    {pageObjects.map(obj => renderObject(obj, selectedIds.includes(obj.id)))}
                    {/* live preview + tooltip */}
                    {renderLive(drawingRef.current, pageIndex, selectedIds)}
                    {liveLabelRef.current && (
                      <KText x={liveLabelRef.current.x} y={liveLabelRef.current.y} text={liveLabelRef.current.text} fontSize={12} fill="#000" />
                    )}
                    <Transformer ref={trRef} rotateEnabled={true} resizeEnabled={false} />
                  </Layer>
                </Stage>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderObject(obj: AnyTakeoffObject, selected:boolean) {
  if (obj.type === 'count') {
    return (
      <Group key={obj.id} x={obj.x} y={obj.y} name={`obj-${obj.id}`} draggable>
        <Circle radius={9} fill={selected ? '#0d6efd' : '#222'} />
        <KText text={obj.code} fontSize={12} fill="#fff" offsetX={6} offsetY={6}/>
      </Group>
    );
  }
  if (obj.type === 'segment') {
    const verts = obj.vertices;
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} draggable>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[1].x} y={verts[1].y} radius={4} fill="red"/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  if (obj.type === 'polyline') {
    const verts = obj.vertices;
    const pts = verts.flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} draggable>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill="red"/>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  if (obj.type === 'freeform') {
    const pts = obj.vertices.flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} draggable>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  return null;
}

function renderLive(dr:{type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[]}, pageIndex:number, selectedIds:string[]) {
  if (!dr.type) return null;
  const verts = dr.pts;
  if (dr.type === 'segment' && verts.length === 1) {
    return (
      <Group>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
      </Group>
    );
  }
  if (dr.type === 'polyline' && verts.length >= 1) {
    return (
      <Group>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  if (dr.type === 'freeform' && verts.length >= 1) {
    return (
      <Group>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  return null;
}