import { create } from 'zustand';
import type { Tool, ProjectSave, PageState, AnyTakeoffObject } from '@/types';

type HistoryEntry = { pageIndex: number; objects: AnyTakeoffObject[] };

type State = {
  fileName: string;
  pages: PageState[];
  tool: Tool;
  zoom: number;
  currentTag: string;

  // Page navigation
  activePage: number;
  pageCount: number;
  pageLabels: string[];

  selectedIds: string[];
  history: Record<number, { undo: HistoryEntry[]; redo: HistoryEntry[] }>;

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
  deleteSelected: (pageIndex:number) => void;

  setCalibration: (pageIndex:number, pixelsPerFoot:number, unit:'ft'|'m') => void;

  selectOnly: (id: string) => void;
  clearSelection: () => void;

  pushHistory: (pageIndex:number) => void;
  undo: (pageIndex:number) => void;
  redo: (pageIndex:number) => void;

  toProject: () => ProjectSave;
  fromProject: (data: ProjectSave) => void;
};

export const useStore = create<State>((set, get) => ({
  fileName: 'untitled.pdf',
  pages: [],
  tool: 'hand',
  zoom: 1,
  currentTag: 'A1',

  activePage: 0,
  pageCount: 0,
  pageLabels: [],

  selectedIds: [],
  history: {},

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

  toProject: () => {
    const { fileName, pages } = get();
    return { fileName, pages };
  },

  fromProject: (data) => set({
    fileName: data.fileName,
    pages: data.pages,
    selectedIds: [],
    history: {}
  })
}));
