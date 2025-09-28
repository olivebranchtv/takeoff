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

type State = {
  // project / pages
  fileName: string;
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

  // TAG DATABASE
  tags: Tag[];
  palette: string[];

  // setters & actions
  setFileName: (n: string) => void;
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

  // tags
  addTag: (t: Omit<Tag,'id'>) => void;
  updateTag: (id: string, patch: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  importTags: (list: Tag[]) => void;
  exportTags: () => Tag[];
  colorForCode: (code: string) => string;
  tagByCode: (code: string) => Tag | undefined;

  toProject: () => ProjectSave;
  fromProject: (data: ProjectSave) => void;
};

export const useStore = create<State>((set, get) => ({
  fileName: 'untitled.pdf',
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

  setFileName: (n) => set({ fileName: n }),
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
        p.pageIndex === pageIndex ? ({ ...p, objects: [...p.objects, obj] }) : p
      );
      return { pages };
    });
  },

  replaceObjects: (pageIndex, objs) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) =>
        p.pageIndex === pageIndex ? ({ ...p, objects: objs }) : p
      );
      return { pages };
    });
  },

  patchObject: (pageIndex, id, patch) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) => {
        if (p.pageIndex !== pageIndex) return p;
        return { ...p, objects: p.objects.map((o) => (o.id === id ? ({ ...o, ...patch }) : o)) };
      });
      return { pages };
    });
  },

  removeObject: (pageIndex, id) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) => {
        if (p.pageIndex !== pageIndex) return p;
        return { ...p, objects: p.objects.filter(o => o.id !== id) };
      });
      return { pages, selectedIds: s.selectedIds.filter(sid => sid !== id) };
    });
  },

  deleteSelected: (pageIndex) => {
    const { pushHistory } = get(); pushHistory(pageIndex);
    set((s) => {
      const pages = s.pages.map((p) =>
        p.pageIndex !== pageIndex ? p : ({ ...p, objects: p.objects.filter((o) => !s.selectedIds.includes(o.id)) })
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
    const entry: HistoryEntry = { pageIndex, objects: JSON.parse(JSON.stringify(page.objects)) };
    const stack = s.history[pageIndex] || { undo: [], redo: [] };
    return { history: { ...s.history, [pageIndex]: { undo: [...stack.undo, entry], redo: [] } } };
  }),

  undo: (pageIndex) => set((s) => {
    const stack = s.history[pageIndex]; if (!stack || stack.undo.length === 0) return {};
    const entry = stack.undo.at(-1)!; const newUndo = stack.undo.slice(0, -1);
    const page = s.pages.find((p) => p.pageIndex === pageIndex); if (!page) return {};
    const current: HistoryEntry = { pageIndex, objects: page.objects };
    const pages = s.pages.map((p) => (p.pageIndex === pageIndex ? ({ ...p, objects: entry.objects }) : p));
    return { pages, history: { ...s.history, [pageIndex]: { undo: newUndo, redo: [...stack.redo, current] } } };
  }),

  redo: (pageIndex) => set((s) => {
    const stack = s.history[pageIndex]; if (!stack || stack.redo.length === 0) return {};
    const entry = stack.redo.at(-1)!; const newRedo = stack.redo.slice(0, -1);
    const page = s.pages.find((p) => p.pageIndex === pageIndex); if (!page) return {};
    const current: HistoryEntry = { pageIndex, objects: page.objects };
    const pages = s.pages.map((p) => (p.pageIndex === pageIndex ? ({ ...p, objects: entry.objects }) : p));
    return { pages, history: { ...s.history, [pageIndex]: { undo: [...stack.undo, current], redo: newRedo } } };
  }),

  // tag DB ops
  addTag: (t) => set(s => ({ tags: [...s.tags, { ...t, id: crypto.randomUUID() }] })),
  updateTag: (id, patch) => set(s => ({ tags: s.tags.map(t => t.id === id ? ({ ...t, ...patch }) : t) })),
  deleteTag: (id) => set(s => ({ tags: s.tags.filter(t => t.id !== id) })),
  importTags: (list) => set({ tags: list }),
  exportTags: () => get().tags,
  colorForCode: (code) => {
    const tag = get().tags.find(t => t.code.toUpperCase() === code.toUpperCase());
    if (!tag) return '#222';
    // Business rule: anything in Lights category is orange
    if (tag.category.toLowerCase().includes('light')) return '#FFA500';
    return tag.color || '#222';
  },
  tagByCode: (code) => get().tags.find(t => t.code.toUpperCase() === code.toUpperCase()),

  toProject: () => {
    const { fileName, pages, tags } = get();
    return { fileName, pages, tags };
  },

  fromProject: (data) => set({
    fileName: data.fileName,
    pages: data.pages,
    tags: data.tags && data.tags.length ? data.tags : DEFAULT_TAGS,
    selectedIds: [],
    history: {}
  })
}));
