import { create } from 'zustand';
import type { PageState, Tag, ProjectSave, ManualItem, Assembly, AnyTakeoffObject } from '@/types';

type ProjectAnalysis = any;

interface StoreState {
  pages: PageState[];
  tags: Tag[];
  currentTag: string | null;
  selectedIds: Set<string>;
  pageCount: number;
  pageLabels: string[];
  activePage: number;
  projectName: string;
  pdfName: string;
  pdfBytesBase64: string | null;
  lastSaveTime: number | null;
  manualItems: ManualItem[];
  assemblies: Assembly[];
  aiAnalysisResult: ProjectAnalysis | null;

  setPages: (pages: PageState[]) => void;
  addPage: (page: PageState) => void;
  updatePage: (pageIndex: number, updates: Partial<PageState>) => void;
  setTags: (tags: Tag[]) => void;
  importTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;
  reorderProjectTags: (newOrder: Tag[]) => void;
  setCurrentTag: (code: string | null) => void;
  setSelectedIds: (ids: string[]) => void;
  addSelectedId: (id: string) => void;
  removeSelectedId: (id: string) => void;
  setPageCount: (count: number) => void;
  setPageLabels: (labels: string[]) => void;
  setActivePage: (page: number) => void;
  setProjectName: (name: string) => void;
  getProjectName: () => string;
  setPdfName: (name: string) => void;
  setPdfBytesBase64: (bytes: string | null) => void;
  setLastSaveTime: (time: number | null) => void;
  addManualItem: (item: ManualItem) => void;
  deleteManualItem: (id: string) => void;
  updateManualItem: (id: string, updates: Partial<ManualItem>) => void;
  setAssemblies: (assemblies: Assembly[]) => void;
  addAssembly: (assembly: Assembly) => void;
  updateAssembly: (id: string, updates: Partial<Assembly>) => void;
  deleteAssembly: (id: string) => void;
  setAiAnalysisResult: (result: ProjectAnalysis | null) => void;
  fromProject: (project: ProjectSave) => void;
  toProject: () => ProjectSave;
  reset: () => void;
}

const initialState = {
  pages: [],
  tags: [],
  currentTag: null,
  selectedIds: new Set<string>(),
  pageCount: 0,
  pageLabels: [],
  activePage: 0,
  projectName: '',
  pdfName: '',
  pdfBytesBase64: null,
  lastSaveTime: null,
  manualItems: [],
  assemblies: [],
  aiAnalysisResult: null,
};

export const useStore = create<StoreState>((set, get) => ({
  ...initialState,

  setPages: (pages) => set({ pages }),

  addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),

  updatePage: (pageIndex, updates) => set((state) => ({
    pages: state.pages.map((p) =>
      p.pageIndex === pageIndex ? { ...p, ...updates } : p
    ),
  })),

  setTags: (tags) => set({ tags }),

  importTags: (tags) => set({ tags }),

  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),

  updateTag: (id, updates) => set((state) => ({
    tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
  })),

  deleteTag: (id) => set((state) => ({
    tags: state.tags.filter((t) => t.id !== id),
  })),

  reorderProjectTags: (newOrder) => set({ tags: newOrder }),

  setCurrentTag: (code) => set({ currentTag: code }),

  setSelectedIds: (ids) => set({ selectedIds: new Set(ids) }),

  addSelectedId: (id) => set((state) => {
    const newSet = new Set(state.selectedIds);
    newSet.add(id);
    return { selectedIds: newSet };
  }),

  removeSelectedId: (id) => set((state) => {
    const newSet = new Set(state.selectedIds);
    newSet.delete(id);
    return { selectedIds: newSet };
  }),

  setPageCount: (count) => set({ pageCount: count }),

  setPageLabels: (labels) => set({ pageLabels: labels }),

  setActivePage: (page) => set({ activePage: page }),

  setProjectName: (name) => set({ projectName: name }),

  getProjectName: () => get().projectName,

  setPdfName: (name) => set({ pdfName: name }),

  setPdfBytesBase64: (bytes) => set({ pdfBytesBase64: bytes }),

  setLastSaveTime: (time) => set({ lastSaveTime: time }),

  addManualItem: (item) => set((state) => ({
    manualItems: [...state.manualItems, item],
  })),

  deleteManualItem: (id) => set((state) => ({
    manualItems: state.manualItems.filter((item) => item.id !== id),
  })),

  updateManualItem: (id, updates) => set((state) => ({
    manualItems: state.manualItems.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  setAssemblies: (assemblies) => set({ assemblies }),

  addAssembly: (assembly) => set((state) => ({
    assemblies: [...state.assemblies, assembly],
  })),

  updateAssembly: (id, updates) => set((state) => ({
    assemblies: state.assemblies.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),

  deleteAssembly: (id) => set((state) => ({
    assemblies: state.assemblies.filter((a) => a.id !== id),
  })),

  setAiAnalysisResult: (result) => set({ aiAnalysisResult: result }),

  fromProject: (project) => {
    const pages: PageState[] = project.pages.map((p) => ({
      pageIndex: p.pageIndex,
      canvasWidth: undefined,
      canvasHeight: undefined,
      pixelsPerFoot: p.pixelsPerFoot,
      unit: p.unit || 'ft',
      calibrated: !!p.pixelsPerFoot,
      objects: p.objects,
    }));

    set({
      pages,
      tags: project.tags || [],
      projectName: project.name || project.projectName || '',
      selectedIds: new Set(),
    });
  },

  toProject: () => {
    const state = get();
    return {
      name: state.projectName,
      pages: state.pages.map((p) => ({
        pageIndex: p.pageIndex,
        pixelsPerFoot: p.pixelsPerFoot,
        unit: p.unit,
        objects: p.objects,
      })),
      tags: state.tags,
    };
  },

  reset: () => set(initialState),
}));
