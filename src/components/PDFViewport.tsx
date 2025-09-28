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

  // force repaint ticks (for freeform live preview)
  const [, setPaintTick] = useState(0);

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

  // commit helper attaches the active code to measurements
  function commitObject(type:'segment'|'polyline'|'freeform', vertsPage:{x:number;y:number}[]) {
    addObject(activePage, {
      id: crypto.randomUUID(),
      type,
      pageIndex: activePage,
      vertices: vertsPage,
      code: currentTag || undefined,   // <-- tag measured lines to a code
    } as AnyTakeoffObject);
  }

  // mouse button helpers
  const isLeft = (e: any) => (e?.evt?.button ?? 0) === 0;
  const isRight = (e: any) => (e?.evt?.button ?? 0) === 2;

  function onMouseDown(e: any) {
    if (!info) return;

    // RIGHT-CLICK: delete clicked object and stop (no placement)
    if (isRight(e)) {
      if (e.target?.attrs?.name?.startsWith('obj-')) {
        const id = e.target.attrs.name.substring(4);
        selectOnly(id);
        deleteSelected(activePage);
      }
      return;
    }

    // LEFT-CLICK only
    if (!isLeft(e)) return;

    const stage = stageRef.current!;
    const posStage = stage.getPointerPosition()!;
    const posPage = toPage(info, posStage);

    // click an object -> select only
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
      if (!drawingRef.current.type) drawingRef.current = { type: 'polyline', pts: [posPage] };
      else drawingRef.current.pts.push(posPage);
    } else if (tool === 'freeform') {
      drawingRef.current = { type: 'freeform', pts: [posPage] };
      freeformActive.current = true;
      setPaintTick(t => t + 1);
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
  }

  function onMouseMove(e?: any) {
    if (!info) return;

    // live freeform preview
    if (tool === 'freeform' && freeformActive.current && (!e || isLeft(e))) {
      const stage = stageRef.current!;
      const posStage = stage.getPointerPosition()!;
      const posPage = toPage(info, posStage);
      drawingRef.current.pts.push(posPage);
      setPaintTick(t => t + 1); // force repaint while dragging
    }

    updateLiveLabel(info);
  }

  function onMouseUp(e?: any) {
    if (!info) return;
    if (e && !isLeft(e)) return; // finalize only on left click
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
      // commit on double click
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
    // NOTE: no onWheel here => wheel scrolls naturally (no zoom)
    <div className="content" onContextMenu={(e)=>e.preventDefault()}>
      <div className="pageBox" style={{ width: w, height: h }}>
        <div style={{position:'absolute', inset:0}}>
          {/* bitmap */}
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
            onContextMenu={(e:any)=>e.evt?.preventDefault()}
          >
            <Layer listening>
              {/* objects */}
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

              {/* live preview + tooltip */}
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
  colorForCode: (code?: string) => string,
  selectOnly: (id:string) => void,
  deleteSelected: (pageIndex:number) => void
) {
  // Common right-click deletion for all object types
  const onCtxDelete = (e: any) => {
    e.evt?.preventDefault?.();
    selectOnly(obj.id);
    deleteSelected(pageIndex);
  };

  // ---- COUNT TAG: 20x20 square with centered code ----
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

  if (obj.type === 'segment') {
    const verts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s }));
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
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
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Circle x={verts[0].x} y={verts[0].y} radius={4} fill="red"/>
        <Circle x={verts[verts.length-1].x} y={verts[verts.length-1].y} radius={4} fill="red"/>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
      </Group>
    );
  }

  if (obj.type === 'freeform') {
    const pts = obj.vertices.map(v => ({ x: v.x * s, y: v.y * s })).flatMap(v=>[v.x,v.y]);
    return (
      <Group key={obj.id} name={`obj-${obj.id}`} onContextMenu={onCtxDelete}>
        <Line points={pts} stroke="blue" strokeWidth={2}/>
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
  const verts = dr.pts.map(p => ({ x: p.x * s, y: p.y * s }));

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
