import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tool, ProjectSave, PageState, AnyTakeoffObject, Tag, MeasureOptions } from '@/types';

type HistoryEntry = { pageIndex: number; objects: AnyTakeoffObject[] };

const DEFAULT_TAGS: Tag[] = [
  { id: crypto.randomUUID(), code: 'A',   name: 'Fixture A',      category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'A1',  name: 'Fixture A1',     category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'EM',  name: 'Emergency',      category: 'Emergency',   color: '#CC0000' },
  { id: crypto.randomUUID(), code: 'SP',  name: 'Switch',         category: 'Switches',    color: '#0066FF' },
  { id: crypto.randomUUID(), code: 'GFCI',name: 'GFCI Recept.',   category: 'Receptacles', color: '#2E8B57' },
  { id: crypto.randomUUID(), code: 'HW',  name: 'Hard Wire',      category: 'Wiring',      color: '#8B00FF' },
];

const PALETTE = [
  '#000000','#666666','#999999','#CCCCCC','#FFFFFF',
  '#FF0000','#FF7F00','#FFA500','#FFD700','#FFFF00',
  '#00FF00','#2E8B57','#008080','#00CED1','#00BFFF',
  '#0000FF','#4169E1','#4B0082','#8B00FF','#FF00FF',
  '#C71585','#FF1493','#8B4513','#D2691E','#A0522D',
];

const DEFAULT_MEASURE_OPTIONS: MeasureOptions = {
  extraFootagePerPoint: 0,
  conductor1Count: 0,
  conductor1Size: '½″',
  conductor2Count: 0,
  conductor2Size: '½″',
  conductor3Count: 0,
  conductor3Size: '½″',
  extraConductorFootagePerPoint: 0,
  boxesPerPoint: 0,
  lineColor: '#0000FF',
  pointColor: '#FF0000',
  lineWeight: 1,
  opaquePoints: false,
};

type HistoryStacks = { undo: HistoryEntry[]; redo: HistoryEntry[] };

function asArray<T>(v: unknown): T[] { return Array.isArray(v) ? (v as T[]) : []; }
function safeObjects(objs: unknown): AnyTakeoffObject[] { return asArray<AnyTakeoffObject>(objs).map(o => ({ ...o })); }
function normalizePage(p: any, fallbackIndex = 0): PageState {
  const pageIndex = typeof p?.pageIndex === 'number' ? p.pageIndex : (typeof p?.index === 'number' ? p.index : fallbackIndex);
  const pixelsPerFoot = typeof p?.pixelsPerFoot === 'number' ? p.pixelsPerFoot : (p?.pixelsPerFoot == null ? undefined : Number(p.pixelsPerFoot) || undefined);
  const unit: 'ft'|'m' = p?.unit === 'm' ? 'm' : 'ft';
  return {
    pageIndex,
    canvasWidth: typeof p?.canvasWidth === 'number' ? p.canvasWidth : (p?.canvasWidth ? Number(p.canvasWidth) : undefined),
    canvasHeight: typeof p?.canvasHeight === 'number' ? p.canvasHeight : (p?.canvasHeight ? Number(p.canvasHeight) : undefined),
    pixelsPerFoot,
    unit,
    calibrated: !!p?.calibrated,
    objects: safeObjects(p?.objects),
  } as PageState;
}
function baseNameNoExt(path: string) {
  const just = (path || '').split('/').pop() || path || '';
  const dot = just.lastIndexOf('.'); return dot > 0 ? just.slice(0, dot) : just || 'Untitled';
}

const ORANGE = '#FFA500';
const norm = (s: string) => (s || '').trim().toUpperCase();
const isLights = (cat?: string) => (cat || '').toLowerCase().includes('light');
const nextId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).slice(2);

type State = {
  // project / pages
  fileName: string;
  projectName: string;
  pages: PageState[];
  tool: Tool;
  zoom: number;
  currentTag: string;

  // page navigation
  activePage: number;
  pageCount: number;
  pageLabels: string[];

  // objects selection + history
  selectedIds: string[];
  history: Record<number, HistoryStacks>;

  // TAG DATABASE (master / project)
  tags: Tag[];
  palette: string[];
  projectTagIds: string[];

  /** Manual color overrides by tag CODE (case-insensitive). */
  colorOverrides: Record<string, string>;

  // Measure options for raceway calculations
  measureOptions: MeasureOptions;

  // setters & actions
  setFileName: (n: string) => void;
  setProjectName: (n: string) => void;
  setPages: (p: PageState[]) => void;
  setTool: (t: Tool) => void;
  setZoom: (z: number) => void;
  setCurrentTag: (c: string) => void;

  setActivePage: (i: number) => void;
  setPageCount: (n: number) => void;
  setPageLabels: (labels: string[]) => void;

  upsertPage: (page: PageState) => void;
  addObject: (pageIndex: number, obj: AnyTakeoffObject) => void;
  replaceObjects: (pageIndex: number, objs: AnyTakeoffObject[]) => void;
  patchObject: (pageIndex:number, id:string, patch: Partial<AnyTakeoffObject>) => void;
  removeObject: (pageIndex:number, id:string) => void;
  deleteSelected: (pageIndex:number) => void;

  setCalibration: (pageIndex:number, pixelsPerFoot:number, unit:'ft'|'m') => void;

  selectOnly: (id: string) => void;
  clearSelection: () => void;
  setSelectedIds: (ids: string[]) => void;

  pushHistory: (pageIndex:number) => void;
  undo: (pageIndex:number) => void;
  redo: (pageIndex:number) => void;

  // tag DB ops (persisted, upsert-by-code)
  addTag: (t: Omit<Tag,'id'>) => void;
  updateTag: (id: string, patch: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  importTags: (list: Tag[] | Omit<Tag,'id'>[]) => void;
  exportTags: () => Tag[];
  colorForCode: (code: string) => string;
  tagByCode: (code: string) => Tag | undefined;

  // explicit override controls (optional external use)
  setTagColorOverride: (code: string, color: string) => void;
  clearTagColorOverride: (code: string) => void;

  // project tag ops
  addProjectTag: (tag: Tag) => void;
  addProjectTagById: (id: string) => void;
  addTagToProject: (tag: Tag) => void;
  removeProjectTag: (id: string) => void;
  hasProjectTag: (id: string) => boolean;
  getProjectTags: () => Tag[];

  getProjectName: () => string;
  
  // measure options
  setMeasureOptions: (options: MeasureOptions) => void;
  getMeasureOptions: () => MeasureOptions;

  toProject: () => ProjectSave;
  fromProject: (data: ProjectSave | any) => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      fileName: 'untitled.pdf',
      projectName: 'Untitled Project',
      pages: [],
      tool: 'hand',
      zoom: 1,
      currentTag: 'A',

      activePage: 0,
      pageCount: 0,
      pageLabels: [],

      selectedIds: [],
      history: {},

      tags: DEFAULT_TAGS,
      palette: PALETTE,
      projectTagIds: [],

      // key: overrides persist manual color choices for any code
      colorOverrides: {},
      
      measureOptions: DEFAULT_MEASURE_OPTIONS,

      setFileName: (n) => set({ fileName: n, projectName: get().projectName || baseNameNoExt(n) }),
      setProjectName: (n) => set({ projectName: n || 'Untitled Project' }),
      setPages: (p) => set({ pages: p, selectedIds: [], history: {} }),
      setTool: (t) => set({ tool: t }),
      setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(6, z)) }),
      setCurrentTag: (c) => set({ currentTag: c }),

      setActivePage: (i) => {
        const { pageCount } = get();
        const clamped = Math.max(0, Math.min((pageCount || 1) - 1, i));
        set({ activePage: clamped, selectedIds: [] });
      },
      setPageCount: (n) => set({ pageCount: Math.max(0, n) }),
      setPageLabels: (labels) => set({ pageLabels: labels || [] }),

      upsertPage: (page) => set((s) => {
        const idx = s.pages.findIndex((p) => p.pageIndex === page.pageIndex);
        if (idx >= 0) { 
          const copy = s.pages.slice(); 
          copy[idx] = { ...page, objects: safeObjects(page.objects) }; 
          return { pages: copy }; 
        }
        return { pages: [...s.pages, page].sort((a,b)=>a.pageIndex-b.pageIndex) };
      }),

      addObject: (pageIndex, obj) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => 
            p.pageIndex === pageIndex 
              ? ({ ...p, objects: [...safeObjects(p.objects), obj as AnyTakeoffObject] }) 
              : p 
          );
          return { pages };
        });
      },

      replaceObjects: (pageIndex, objs) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => p.pageIndex === pageIndex ? ({ ...p, objects: safeObjects(objs) }) : p );
          return { pages };
        });
      },

      patchObject: (pageIndex, id, patch) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => {
            if (p.pageIndex !== pageIndex) return p;
            const objects = asArray<AnyTakeoffObject>(p.objects).map((o) => (o.id === id ? ({ ...o, ...patch }) : o));
            return { ...p, objects };
          });
          return { pages };
        });
      },

      removeObject: (pageIndex, id) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => {
            if (p.pageIndex !== pageIndex) return p;
            const objects = asArray<AnyTakeoffObject>(p.objects).filter(o => o.id !== id);
            return { ...p, objects };
          });
          return { pages, selectedIds: s.selectedIds.filter(sid => sid !== id) };
        });
      },

      deleteSelected: (pageIndex) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) =>
            p.pageIndex !== pageIndex ? p : ({ ...p, objects: asArray<AnyTakeoffObject>(p.objects).filter((o) => !s.selectedIds.includes(o.id)) })
          );
          return { pages, selectedIds: [] };
        });
      },

      setCalibration: (pageIndex, ppf, unit) => set((s) => {
        const pages = s.pages.map((p) => 
          p.pageIndex === pageIndex 
            ? ({ ...p, pixelsPerFoot: ppf, unit, calibrated: true }) 
            : p
        );
        return { pages };
      }),

      selectOnly: (id) => set({ selectedIds: [id] }),
      clearSelection: () => set({ selectedIds: [] }),
      setSelectedIds: (ids) => set({ selectedIds: ids }),

      pushHistory: (pageIndex) => set((s) => {
        const page = s.pages.find((p) => p.pageIndex === pageIndex);
        if (!page) return {};
        const entry: HistoryEntry = { pageIndex, objects: JSON.parse(JSON.stringify(asArray(page.objects))) };
        const stack = s.history[pageIndex] || { undo: [], redo: [] };
        return { history: { ...s.history, [pageIndex]: { undo: [...stack.undo, entry], redo: [] } } };
      }),

      undo: (pageIndex) => set((s) => {
        const stack = s.history[pageIndex]; if (!stack || stack.undo.length === 0) return {};
        const entry = stack.undo.at(-1)!; const newUndo = stack.undo.slice(0, -1);
        const page = s.pages.find((p) => p.pageIndex === pageIndex); if (!page) return {};
        const current: HistoryEntry = { pageIndex, objects: asArray(page.objects) };
        const pages = s.pages.map((p) => (p.pageIndex === pageIndex ? ({ ...p, objects: entry.objects }) : p));
        return { pages, history: { ...s.history, [pageIndex]: { undo: newUndo, redo: [...stack.redo, current] } } };
      }),

      redo: (pageIndex) => set((s) => {
        const stack = s.history[pageIndex]; if (!stack || stack.redo.length === 0) return {};
        const entry = stack.redo.at(-1)!; const newRedo = stack.redo.slice(0, -1);
        const page = s.pages.find((p) => p.pageIndex === pageIndex); if (!page) return {};
        const current: HistoryEntry = { pageIndex, objects: asArray(page.objects) };
        const pages = s.pages.map((p) => (p.pageIndex === pageIndex ? ({ ...p, objects: entry.objects }) : p));
        return { pages, history: { ...s.history, [pageIndex]: { undo: [...stack.undo, current], redo: newRedo } } };
      }),

      // ===== TAG DB (persist + upsert-by-code) =====
      addTag: (t) => set((s) => {
        const codeKey = norm(t.code);
        const idx = s.tags.findIndex(x => norm(x.code) === codeKey);
        const incomingColor = t.color || ORANGE;
        const incomingCat = (t.category || '').trim();

        const tags = [...s.tags];
        if (idx >= 0) {
          tags[idx] = { ...tags[idx], code: codeKey, name: t.name || '', category: incomingCat, color: incomingColor };
        } else {
          tags.push({ id: nextId(), code: codeKey, name: t.name || '', category: incomingCat, color: incomingColor });
        }

        const overrides = { ...s.colorOverrides };
        if (isLights(incomingCat)) {
          if (incomingColor && incomingColor.toUpperCase() !== ORANGE.toUpperCase()) overrides[codeKey] = incomingColor;
          else delete overrides[codeKey];
        }
        return { tags, colorOverrides: overrides };
      }),

      updateTag: (id, patch) => set((s) => {
        if (!patch) return {};
        const tags = [...s.tags];
        const currentIdx = tags.findIndex(t => t.id === id);
        if (currentIdx < 0) return {};

        const nextCode = patch.code ? norm(patch.code) : norm(tags[currentIdx].code);
        const nextCat  = (patch.category ?? (tags[currentIdx].category || '')).trim();
        const nextName = patch.name ?? tags[currentIdx].name;
        const nextColor= patch.color ?? tags[currentIdx].color;

        // Merge into canonical if code collides with another
        const canonicalIdx = tags.findIndex(t => norm(t.code) === nextCode);
        if (canonicalIdx >= 0 && canonicalIdx !== currentIdx) {
          tags[canonicalIdx] = { ...tags[canonicalIdx], code: nextCode, name: nextName, category: nextCat, color: nextColor };
          tags.splice(currentIdx, 1);
        } else {
          tags[currentIdx] = { ...tags[currentIdx], code: nextCode, name: nextName, category: nextCat, color: nextColor };
        }

        const overrides = { ...s.colorOverrides };
        if (isLights(nextCat)) {
          if (nextColor && nextColor.toUpperCase() !== ORANGE.toUpperCase()) overrides[nextCode] = nextColor;
          else delete overrides[nextCode];
        } else {
          // non-lights: remove any leftover override
          delete overrides[nextCode];
        }
        return { tags, colorOverrides: overrides, projectTagIds: s.projectTagIds.filter(pid => pid !== id) };
      }),

      deleteTag: (id) => set(s => {
        const tag = s.tags.find(t => t.id === id);
        const tags = s.tags.filter(t => t.id !== id);
        const overrides = { ...s.colorOverrides };
        if (tag) delete overrides[norm(tag.code)];
        return { tags, projectTagIds: s.projectTagIds.filter(pid => pid !== id), colorOverrides: overrides };
      }),

      importTags: (list) => set((s) => {
        const incoming = asArray<Tag | Omit<Tag,'id'>>(list);
        const merged = [...s.tags];
        const overrides = { ...s.colorOverrides };

        for (const raw of incoming) {
          const t = {
            id: (raw as Tag).id || nextId(),
            code: (raw as any).code,
            name: (raw as any).name || '',
            category: (raw as any).category || '',
            color: (raw as any).color || ORANGE,
          } as Tag;

          const key = norm(t.code);
          const idx = merged.findIndex(x => norm(x.code) === key);
          if (idx >= 0) merged[idx] = { ...merged[idx], ...t, code: key };
          else merged.push({ ...t, code: key });

          if (isLights(t.category)) {
            if (t.color && t.color.toUpperCase() !== ORANGE.toUpperCase()) overrides[key] = t.color;
            else delete overrides[key];
          } else {
            delete overrides[key];
          }
        }
        const keep = s.projectTagIds.filter(id => merged.some(t => t.id === id));
        return { tags: merged, projectTagIds: keep, colorOverrides: overrides };
      }),

      exportTags: () => get().tags,

      /** Default: Lights → orange, unless a manual override exists for that CODE. */
      colorForCode: (code) => {
        const key = norm(code);
        const override = get().colorOverrides[key];
        if (override) return override;
        const tag = get().tags.find(t => norm(t.code) === key);
        if (tag && isLights(tag.category)) return ORANGE;
        return tag?.color || '#222';
      },

      tagByCode: (code) => get().tags.find(t => norm(t.code) === norm(code)),

      // explicit override controls (optional)
      setTagColorOverride: (code, color) => set((s) => {
        const key = norm(code);
        const tag = s.tags.find(t => norm(t.code) === key);
        const overrides = { ...s.colorOverrides };
        if (color && isLights(tag?.category)) overrides[key] = color;
        else delete overrides[key];
        return { colorOverrides: overrides };
      }),
      clearTagColorOverride: (code) => set((s) => {
        const key = norm(code);
        const overrides = { ...s.colorOverrides };
        delete overrides[key];
        return { colorOverrides: overrides };
      }),

      // project tag ops
      addProjectTag: (tag) => set(s => (s.projectTagIds.includes(tag.id) ? {} : { projectTagIds: [...s.projectTagIds, tag.id] })),
      addProjectTagById: (id) => set(s => (s.projectTagIds.includes(id) ? {} : { projectTagIds: [...s.projectTagIds, id] })),
      addTagToProject: (tag) => set(s => (s.projectTagIds.includes(tag.id) ? {} : { projectTagIds: [...s.projectTagIds, tag.id] })),
      removeProjectTag: (id) => set(s => ({ projectTagIds: s.projectTagIds.filter(pid => pid !== id) })),
      hasProjectTag: (id) => get().projectTagIds.includes(id),
      getProjectTags: () => {
        const { tags, projectTagIds } = get();
        return tags.filter(t => projectTagIds.includes(t.id));
      },

      getProjectName: () => {
        const { projectName, fileName } = get();
        return projectName?.trim() ? projectName : baseNameNoExt(fileName);
      },
      
      setMeasureOptions: (options) => set({ measureOptions: options }),
      getMeasureOptions: () => get().measureOptions,

      toProject: () => {
        const { fileName, pages, tags, projectName } = get();
        const payload: any = { fileName, pages, tags };
        if (projectName) payload.name = projectName;
        return payload as ProjectSave;
      },

      fromProject: (data) => {
        const d: any = data || {};
        const tags = asArray<Tag>(d.tags).length ? asArray<Tag>(d.tags) : get().tags;

        const rawPages = asArray<any>(d.pages);
        const pages: PageState[] = rawPages
          .map((p, idx) => {
            const normalized = normalizePage(p, idx);
            normalized.objects = asArray<AnyTakeoffObject>(p.objects);
            return normalized;
          })
          .sort((a,b)=>a.pageIndex-b.pageIndex);

        set({
          fileName: typeof d.fileName === 'string' ? d.fileName : (typeof d.source === 'string' ? d.source : 'untitled.pdf'),
          projectName: typeof d.name === 'string' ? d.name : (typeof d.projectName === 'string' ? d.projectName : baseNameNoExt(d.fileName || 'Untitled')),
          pages,
          tags,
          selectedIds: [],
          history: {},
          projectTagIds: []
        });
      }
    }),
    {
      name: 'skd.mastertags.v1',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // persist master DB, palette, and overrides
      partialize: (s) => ({ tags: s.tags, palette: s.palette, colorOverrides: s.colorOverrides }),
    }
  )
);

// Export useAppStore as an alias for useStore for compatibility
export const useAppStore = useStore;
