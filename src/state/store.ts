import { create } from 'zustand';
import type { Tool, ProjectSave, PageState, AnyTakeoffObject, Tag } from '@/types';

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

type HistoryStacks = { undo: HistoryEntry[]; redo: HistoryEntry[] };

/** -------- Helpers (safe coercions) -------- */
function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function safeObjects(objs: unknown): AnyTakeoffObject[] {
  const arr = asArray<AnyTakeoffObject>(objs);
  return arr.map(o => ({ ...o }));
}
function normalizePage(p: any, fallbackIndex = 0): PageState {
  const pageIndex =
    typeof p?.pageIndex === 'number'
      ? p.pageIndex
      : typeof p?.index === 'number'
        ? p.index
        : fallbackIndex;

  const pixelsPerFoot =
    typeof p?.pixelsPerFoot === 'number'
      ? p.pixelsPerFoot
      : (p?.pixelsPerFoot == null ? undefined : Number(p.pixelsPerFoot) || undefined);

  const unit: 'ft' | 'm' =
    p?.unit === 'm' ? 'm' : 'ft';

  return {
    pageIndex,
    canvasWidth: typeof p?.canvasWidth === 'number' ? p.canvasWidth : p?.canvasWidth ? Number(p.canvasWidth) : undefined,
    canvasHeight: typeof p?.canvasHeight === 'number' ? p.canvasHeight : p?.canvasHeight ? Number(p.canvasHeight) : undefined,
    pixelsPerFoot,
    unit,
    calibrated: !!p?.calibrated,
    objects: safeObjects(p?.objects),
  } as PageState;
}
function baseNameNoExt(path: string) {
  const just = (path || '').split('/').pop() || path || '';
  const dot = just.lastIndexOf('.');
  return dot > 0 ? just.slice(0, dot) : just || 'Untitled';
}

/** -------- Store -------- */
type State = {
  // project / pages
  fileName: string;           // e.g., source PDF/file displayed in UI
  projectName: string;        // user-visible project name (for header)
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
  /** selected tags for THIS project (by tag id) */
  projectTagIds: string[];

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

  pushHistory: (pageIndex:number) => void;
  undo: (pageIndex:number) => void;
  redo: (pageIndex:number) => void;

  // tag DB ops
  addTag: (t: Omit<Tag,'id'>) => void;
  updateTag: (id: string, patch: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  importTags: (list: Tag[]) => void;
  exportTags: () => Tag[];
  colorForCode: (code: string) => string;
  tagByCode: (code: string) => Tag | undefined;

  // project tag ops (used by the "+" button)
  addProjectTag: (tag: Tag) => void;
  addProjectTagById: (id: string) => void;
  addTagToProject: (tag: Tag) => void;           // alias
  removeProjectTag: (id: string) => void;
  hasProjectTag: (id: string) => boolean;
  getProjectTags: () => Tag[];

  // derived getters
  getProjectName: () => string;

  // project (serialize/deserialize)
  toProject: () => ProjectSave;
  fromProject: (data: ProjectSave | any) => void; // allow legacy shapes
};

export const useStore = create<State>((set, get) => ({
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
      const copy = s.pages.slice(); copy[idx] = page; return { pages: copy };
    }
    return { pages: [...s.pages, page].sort((a,b)=>a.pageIndex-b.pageIndex) };
  }),

  addObject: (pageIndex, obj) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) =>
        p.pageIndex === pageIndex ? ({ ...p, objects: [...asArray(p.objects), obj] }) : p
      );
      return { pages };
    });
  },

  replaceObjects: (pageIndex, objs) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) =>
        p.pageIndex === pageIndex ? ({ ...p, objects: safeObjects(objs) }) : p
      );
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
    const pages = s.pages.map((p) => (p.pageIndex === pageIndex ? ({ ...p, pixelsPerFoot: ppf, unit }) : p));
    return { pages };
  }),

  selectOnly: (id) => set({ selectedIds: [id] }),
  clearSelection: () => set({ selectedIds: [] }),

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

  // tag DB ops
  addTag: (t) => set(s => ({ tags: [...s.tags, { ...t, id: crypto.randomUUID() }] })),
  updateTag: (id, patch) => set(s => ({ tags: s.tags.map(t => t.id === id ? ({ ...t, ...patch }) : t) })),
  deleteTag: (id) => set(s => ({
    tags: s.tags.filter(t => t.id !== id),
    projectTagIds: s.projectTagIds.filter(pid => pid !== id) // also remove from project selection
  })),
  importTags: (list) => set(s => ({
    tags: asArray<Tag>(list),
    // keep only selections that still exist after import
    projectTagIds: s.projectTagIds.filter(id => asArray<Tag>(list).some(t => t.id === id))
  })),
  exportTags: () => get().tags,
  colorForCode: (code) => {
    const tag = get().tags.find(t => t.code.toUpperCase() === code.toUpperCase());
    if (!tag) return '#222';
    // Business rule: anything in Lights category is orange
    if ((tag.category || '').toLowerCase().includes('light')) return '#FFA500';
    return tag.color || '#222';
  },
  tagByCode: (code) => get().tags.find(t => t.code.toUpperCase() === code.toUpperCase()),

  // project tag ops (used by "+" in TagManager)
  addProjectTag: (tag) => set(s => {
    const exists = s.projectTagIds.includes(tag.id);
    return exists ? {} : { projectTagIds: [...s.projectTagIds, tag.id] };
  }),
  addProjectTagById: (id) => set(s => {
    const exists = s.projectTagIds.includes(id);
    return exists ? {} : { projectTagIds: [...s.projectTagIds, id] };
  }),
  addTagToProject: (tag) => set(s => {
    const exists = s.projectTagIds.includes(tag.id);
    return exists ? {} : { projectTagIds: [...s.projectTagIds, tag.id] };
  }),
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

  toProject: () => {
    const { fileName, pages, tags, projectName } = get();
    // Keep your original shape but include name if your ProjectSave supports it
    const payload: any = { fileName, pages, tags };
    if (projectName) payload.name = projectName;
    return payload as ProjectSave;
  },

  fromProject: (data) => {
    // Accept both your current ProjectSave and legacy shapes
    const d: any = data || {};
    const tags = asArray<Tag>(d.tags).length ? asArray<Tag>(d.tags) : DEFAULT_TAGS;
    const rawPages = asArray<any>(d.pages);
    const pages: PageState[] = rawPages.map((p, idx) => normalizePage(p, idx)).sort((a,b)=>a.pageIndex-b.pageIndex);

    set({
      fileName: typeof d.fileName === 'string' ? d.fileName : (typeof d.source === 'string' ? d.source : 'untitled.pdf'),
      projectName: typeof d.name === 'string' ? d.name : (typeof d.projectName === 'string' ? d.projectName : baseNameNoExt(d.fileName || 'Untitled')),
      pages,
      tags,
      selectedIds: [],
      history: {},
      projectTagIds: [] // start empty when loading a project
    });
  }
}));
