import React, { useEffect, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { useStore } from '@/state/store';
import { Stage, Layer, Group, Circle, Line, Text as KText, Transformer } from 'react-konva';
import Konva from 'konva';
import { pathLength, simplifyRDP } from '@/utils/geometry';
import type { AnyTakeoffObject } from '@/types';

/**
 * We store ALL points in PAGE coordinates at pdf.js viewport scale=1.
 * Rendering applies pageScale = renderedWidth / baseWidth.
 * Pointer events convert stage <-> page using that scale.
 */

type Props = { pdf: PDFDoc | null };

type PageRenderInfo = {
  pageIndex: number;
  baseWidth: number;   // pdf viewport width at scale=1
  baseHeight: number;  // pdf viewport height at scale=1
  width: number;       // rendered width for current zoom
  height: number;      // rendered height for current zoom
  canvas: HTMLCanvasElement;
};

function usePageBitmaps(pdf: PDFDoc | null, zoom: number) {
  const [pages, setPages] = useState<PageRenderInfo[]>([]);

  useEffect(() => {
    if (!pdf) { setPages([]); return; }
    let cancelled = false;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

    (async () => {
      const out: PageRenderInfo[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // base at scale=1 (our persistent coord space)
        const baseVp = page.getViewport({ scale: 1 });

        // current display viewport at zoom
        const vp = page.getViewport({ scale: zoom });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = Math.floor(vp.width * DPR);
        canvas.height = Math.floor(vp.height * DPR);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        await page.render({
          canvasContext: ctx,
          viewport: page.getViewport({ scale: zoom * DPR })
        }).promise;

        if (cancelled) return;

        out.push({
          pageIndex: i - 1,
          baseWidth: baseVp.width,
          baseHeight: baseVp.height,
          width: vp.width,
          height: vp.height,
          canvas
        });
      }
      if (!cancelled) setPages(out);
    })();

    return () => { cancelled = true; };
  }, [pdf, zoom]);

  return pages;
}

export default function PDFViewport({ pdf }: Props) {
  const stageRefs = useRef<Record<number, Konva.Stage>>({});
  const trRef = useRef<Konva.Transformer>(null);
  const [activePage, setActivePage] = useState<number>(0);

  // drawing state is kept in PAGE coords
  const drawingRef = useRef<{ type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[] }>({ type: null, pts: [] });
  const freeformActive = useRef<boolean>(false);
  const liveLabelRef = useRef<{text:string;x:number;y:number}|null>(null); // label in STAGE coords

  const {
    pages, upsertPage, addObject, replaceObjects, patchObject, tool, zoom, setZoom, currentTag,
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

  const pageScale = (info: PageRenderInfo) => info.width / info.baseWidth;

  // helpers: stage <-> page coords
  const toStage = (info: PageRenderInfo, p:{x:number;y:number}) => {
    const s = pageScale(info);
    return { x: p.x * s, y: p.y * s };
  };
  const toPage = (info: PageRenderInfo, spt:{x:number;y:number}) => {
    const s = pageScale(info);
    return { x: spt.x / s, y: spt.y / s };
  };

  // zoom on wheel
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(zoom * factor);
  }

  function updateLiveLabel(info: PageRenderInfo, pageIndex:number) {
    const stage = stageRefs.current[pageIndex];
    const posStage = stage?.getPointerPosition();
    if (!posStage) { liveLabelRef.current = null; return; }
    if (!drawingRef.current.type) { liveLabelRef.current = null; return; }

    // Build a preview path in PAGE coords for length calc
    let vertsPage: {x:number;y:number}[] = drawingRef.current.pts.slice();
    if (drawingRef.current.type === 'segment') {
      if (vertsPage.length === 1) {
        const endPage = toPage(info, posStage);
        vertsPage = [vertsPage[0], endPage];
      }
    } else if (drawingRef.current.type === 'polyline') {
      const endPage = toPage(info, posStage);
      vertsPage = [...vertsPage, endPage];
    } // freeform is already page coords while dragging

    const page = pages.find(p => p.pageIndex === pageIndex);
    const px = pathLength(vertsPage);
    const ft = page?.pixelsPerFoot ? (px / page.pixelsPerFoot) : 0;
    const text = page?.pixelsPerFoot ? `${ft.toFixed(2)} ft` : '—';
    liveLabelRef.current = { text, x: posStage.x + 8, y: posStage.y - 12 };
  }

  function commitObject(pageIndex:number, type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    addObject(pageIndex, { id: crypto.randomUUID(), type, pageIndex, vertices: vertsPage });
  }

  function onStageMouseDown(info: PageRenderInfo, pageIndex: number, e: any) {
    const stage = stageRefs.current[pageIndex];
    const posStage = stage.getPointerPosition()!;
    const posPage = toPage(info, posStage);

    // select existing
    if (e.target?.attrs?.name?.startsWith('obj-')) {
      const id = e.target.attrs.name.substring(4);
      selectOnly(id);
      return;
    } else {
      clearSelection();
    }

    if (tool === 'hand') return;

    if (tool === 'count') {
      // store in PAGE coords
      addObject(pageIndex, {
        id: crypto.randomUUID(),
        type: 'count',
        code: currentTag,
        pageIndex, x: posPage.x, y: posPage.y, rotation: 0
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
      const page = pages.find(p => p.pageIndex === pageIndex)!;
      const next = (page.__calibPts || []).concat(posPage);
      page.__calibPts = next;
      if (next.length === 2) {
        const px = pathLength(next);
        const input = prompt('Enter real length between points (feet):', '10');
        const feet = input ? parseFloat(input) : NaN;
        if (!isNaN(feet) && feet > 0) {
          const ppf = px / feet; // pixels (page coords) per foot
          setCalibration(pageIndex, ppf, 'ft');
        }
        page.__calibPts = [];
      }
    }
    updateLiveLabel(info, pageIndex);
  }

  function onStageMouseMove(info: PageRenderInfo, pageIndex: number) {
    if (tool === 'freeform' && freeformActive.current) {
      const stage = stageRefs.current[pageIndex];
      const posStage = stage.getPointerPosition()!;
      const posPage = toPage(info, posStage);
      drawingRef.current.pts.push(posPage);
    }
    updateLiveLabel(info, pageIndex);
  }

  function onStageMouseUp(info: PageRenderInfo, pageIndex: number) {
    const stage = stageRefs.current[pageIndex];
    const posStage = stage.getPointerPosition();
    if (!posStage) return;
    if (!drawingRef.current.type) return;

    if (drawingRef.current.type === 'segment') {
      const endPage = toPage(info, posStage);
      const pts = [...drawingRef.current.pts, endPage];
      drawingRef.current = { type: null, pts: [] };
      commitObject(pageIndex, 'segment', pts);
    } else if (drawingRef.current.type === 'polyline') {
      // commit on dblclick
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

  // key shortcuts
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
      {pdf && bitmaps.map((info) => {
        const { pageIndex } = info;
        const pState = pages.find(p => p.pageIndex === pageIndex);
        const w = info.width, h = info.height;
        const s = pageScale(info); // render scale
        const pageObjects = pState?.objects ?? [];

        return (
          <div
            key={pageIndex}
            className="pageBox"
            style={{ width: w, height: h }}
            onMouseEnter={() => setActivePage(pageIndex)}
          >
            <div style={{position:'absolute', inset:0}}>
              {/* bitmap */}
              <div style={{position:'absolute', inset:0}} ref={(el)=>{
                if (el && info.canvas.parentElement !== el) { el.innerHTML = ''; el.appendChild(info.canvas); }
              }}/>
              {/* calibration badge */}
              <div className="calib">
                {pState?.pixelsPerFoot ? `Calibrated: ${pState.pixelsPerFoot.toFixed(2)} px/ft` : 'Not calibrated'}
              </div>
              {/* overlay */}
              <Stage
                width={w} height={h} style={{position:'absolute', inset:0}}
                ref={(node)=>{ if (node) stageRefs.current[pageIndex] = node }}
                onMouseDown={(e)=>onStageMouseDown(info, pageIndex, e)}
                onMouseMove={()=>onStageMouseMove(info, pageIndex)}
                onMouseUp={()=>onStageMouseUp(info, pageIndex)}
                onDblClick={()=>onStageDblClick(pageIndex)}
              >
                <Layer listening>
                  {/* existing objects */}
                  {pageObjects.map(obj =>
                    renderObject(obj, selectedIds.includes(obj.id), s, pageIndex, patchObject)
                  )}

                  {/* live preview + tooltip */}
                  {renderLive(drawingRef.current, info, s)}
                  {liveLabelRef.current && (
                    <KText x={liveLabelRef.current.x} y={liveLabelRef.current.y} text={liveLabelRef.current.text} fontSize={12} fill="#000" />
                  )}
                  <Transformer ref={trRef} rotateEnabled={true} resizeEnabled={false} />
                </Layer>
              </Stage>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** RENDER HELPERS (apply page->stage scaling; update page coords on drag end) */

function renderObject(
  obj: AnyTakeoffObject,
  selected: boolean,
  s: number,
  pageIndex: number,
  patchObject: (pageIndex:number, id:string, patch: Partial<AnyTakeoffObject>) => void
) {
  if (obj.type === 'count') {
    const sx = obj.x * s, sy = obj.y * s;
    return (
      <Group
        key={obj.id}
        x={sx} y={sy}
        name={`obj-${obj.id}`}
        draggable
        onDragEnd={(e) => {
          // convert drag end STAGE position back to PAGE coords
          const nx = e.target.x() / s;
          const ny = e.target.y() / s;
          patchObject(pageIndex, obj.id, { x: nx, y: ny } as any);
          // snap visual back to 0 (state will re-render with scaled coords)
          e.target.position({ x: nx*s, y: ny*s });
        }}
      >
        <Circle radius={9} fill={selected ? '#0d6efd' : '#222'} />
        <KText text={(obj as any).code} fontSize={12} fill="#fff" offsetX={6} offsetY={6}/>
      </Group>
    );
  }

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[1].x} y={verts[1].y} radius={4} fill="red"/>
        <Line points={verts.flatMap(v=>[v.x,v.y])} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }

  if (obj.type === 'polyline') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    const pts = verts.flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill="red"/>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }

  if (obj.type === 'freeform') {
    const pts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s })).flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`}>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }
  return null;
}

function renderLive(
  dr: {type:'segment'|'polyline'|'freeform'|null; pts:{x:number;y:number}[]},
  info: PageRenderInfo,
  s: number
) {
  if (!dr.type) return null;
  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s })); // page -> stage for preview

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
