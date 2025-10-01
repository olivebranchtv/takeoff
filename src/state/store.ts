// src/state/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Tool,
  ProjectSave,
  PageState,
  AnyTakeoffObject,
  Tag,
  MeasureOptions,
  Assembly,
} from '@/types';
import { STANDARD_ASSEMBLIES } from '@/constants/assemblies';
import { autoAssignAssembly } from '@/utils/tagAssemblyMapping';
import { saveTagsToSupabase } from '@/utils/supabasePricing';
import type { ProjectAnalysis } from '@/utils/openaiAnalysis';
import { loadAssembliesFromSupabase, saveAssemblyToSupabase } from '@/utils/supabaseAssemblies';

type HistoryEntry = { pageIndex: number; objects: AnyTakeoffObject[] };

/** ====== Raceway/Conductor Measure Options defaults (persisted) ======
 *
 * INDUSTRY-STANDARD WASTE FACTORS (Electrical Estimating):
 *
 * • Conduit (EMT, RGS, PVC, MC cable) → 5% (1.05)
 *   Accounts for cuts, bends, stubs, overlaps, and scraps
 *
 * • Wire (THHN, feeders, branch circuits) → 10% (1.10)
 *   Covers pulling slack, cutting, stripping, termination length, and scrap
 *
 * • Devices (receptacles, switches, plates) → 2% (1.02)
 *   For damaged/misplaced devices or extras during install
 *
 * • Fixtures (lighting, emergency, exit signs) → 2-3% (1.02-1.03)
 *   Allows for shipping damage or small field changes
 *
 * • Gear (panels, switchboards, transformers) → 0% (1.00)
 *   Ordered exact — no waste built-in
 *
 * • Special Systems (fire alarm, data, security) → 5-10% (1.05-1.10)
 *   Extra cabling to reach devices, loop into ceiling, and terminations
 *
 * ===================================================================== */

const DEFAULT_CONDUCTOR = {
  count: 0,
  size: '' as MeasureOptions['conductors'][number]['size'], // '' allowed
  insulation: 'THHN' as MeasureOptions['conductors'][number]['insulation'],
  material: 'Copper' as MeasureOptions['conductors'][number]['material'],
  construction: 'Str' as MeasureOptions['conductors'][number]['construction'],
};

const DEFAULT_MEASURE_OPTIONS: MeasureOptions = {
  // CONDUIT: 5% waste standard (cuts, bends, stubs, overlaps, scraps)
  emtSize: '3/4"',               // Most common residential/light commercial size
  extraRacewayPerPoint: 1.5,     // Extra feet per bend/coupling point (industry standard)

  // WIRE: 10% waste standard (pulling slack, cuts, stripping, termination, scrap)
  conductors: [
    { count: 3, size: '#12', insulation: 'THHN', material: 'Copper', construction: 'Str' },  // Common 3-wire circuit
    { ...DEFAULT_CONDUCTOR },
    { ...DEFAULT_CONDUCTOR }
  ],

  // Per-point extras for pulling slack and junction boxes
  extraConductorPerPoint: 2,     // Extra feet per point for pulling slack, termination (industry standard)
  boxesPerPoint: 0.5,            // Average 1 box per 2 points (typical for long runs)
  wasteFactor: 1.10,             // 10% waste for WIRE (industry standard)

  // Display options
  lineColor: '#000000',
  pointColor: '#000000',
  lineWeight: 1,
  opaquePoints: false,
};
/** ================================================================ */

const DEFAULT_TAGS: Tag[] = [
  { id: crypto.randomUUID(), code: 'A',   name: 'Fixture A',      category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'B',   name: 'Fixture B',      category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'C',   name: 'Fixture C',      category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'D',   name: 'Fixture D',      category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'A1',  name: 'Fixture A1',     category: 'Lights',      color: '#FF9900' },
  { id: crypto.randomUUID(), code: 'EM',  name: 'Emergency',      category: 'Emergency',   color: '#CC0000', assemblyId: 'light-emergency-led' },
  { id: crypto.randomUUID(), code: 'SP',  name: 'Switch',         category: 'Switches',    color: '#0066FF', assemblyId: 'switch-sp-20a' },
  { id: crypto.randomUUID(), code: 'GFCI',name: 'GFCI Recept.',   category: 'Receptacles', color: '#2E8B57', assemblyId: 'recep-gfci-20a' },
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

  /** Last-used measure dialog options (persisted) */
  lastMeasureOptions: MeasureOptions;

  // ASSEMBLY DATABASE (standard material kits)
  assemblies: Assembly[];
  addAssembly: (assembly: Assembly) => void;
  updateAssembly: (id: string, assembly: Assembly) => void;
  deleteAssembly: (id: string) => void;
  setAssemblies: (assemblies: Assembly[]) => void;
  saveAssemblyToDatabase: (assembly: Assembly) => Promise<boolean>;

  // AI ANALYSIS RESULTS (persisted)
  aiAnalysisResult: ProjectAnalysis | null;

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

  // explicit override controls
  setTagColorOverride: (code: string, color: string) => void;
  clearTagColorOverride: (code: string) => void;

  // project tag ops
  addProjectTag: (tag: Tag) => void;
  addProjectTagById: (id: string) => void;
  addTagToProject: (tag: Tag) => void;
  removeProjectTag: (id: string) => void;
  hasProjectTag: (id: string) => boolean;
  getProjectTags: () => Tag[];
  reorderProjectTags: (tagIds: string[]) => void;

  getProjectName: () => string;

  toProject: () => ProjectSave;
  fromProject: (data: ProjectSave | any) => void;

  // measure options helpers
  setLastMeasureOptions: (opts: Partial<MeasureOptions>) => void;
  resetLastMeasureOptions: () => void;
  getLastMeasureOptions: () => MeasureOptions;

  // AI analysis helpers
  setAiAnalysisResult: (result: ProjectAnalysis | null) => void;
  getAiAnalysisResult: () => ProjectAnalysis | null;
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

      // initialize last used measure options
      lastMeasureOptions: DEFAULT_MEASURE_OPTIONS,

      // initialize assemblies with standard kits
      assemblies: STANDARD_ASSEMBLIES,

      // initialize AI analysis result as null
      aiAnalysisResult: null,

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
        if (idx >= 0) { const copy = s.pages.slice(); copy[idx] = page; return { pages: copy }; }
        return { pages: [...s.pages, page].sort((a,b)=>a.pageIndex-b.pageIndex) };
      }),

      addObject: (pageIndex, obj) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => p.pageIndex === pageIndex ? ({ ...p, objects: [...asArray<AnyTakeoffObject>(p.objects), obj] }) : p );
          return { pages };
        });
      },

      replaceObjects: (pageIndex, objs) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => p.pageIndex === pageIndex ? ({ ...p, objects: safeObjects(objs) as AnyTakeoffObject[] }) : p );
          return { pages };
        });
      },

      patchObject: (pageIndex, id, patch) => {
        const { pushHistory } = get(); pushHistory(pageIndex);
        set((s) => {
          const pages = s.pages.map((p) => {
            if (p.pageIndex !== pageIndex) return p;
            const objects = asArray<AnyTakeoffObject>(p.objects).map((o) => (o.id === id ? ({ ...o, ...patch } as AnyTakeoffObject) : o));
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

        // Preserve incoming assemblyId, or auto-assign for non-light categories
        const isLightCategory = incomingCat?.toLowerCase().includes('light');
        let finalAssemblyId = t.assemblyId;

        if (!isLightCategory && !t.assemblyId) {
          // Only auto-assign for non-light categories that don't already have an assembly
          const result = autoAssignAssembly({
            code: codeKey,
            category: incomingCat,
            assemblyId: t.assemblyId
          });
          finalAssemblyId = result.assemblyId;
        }
        // Keep t.assemblyId as-is for lights (preserve user assignments)

        const tags = [...s.tags];
        if (idx >= 0) {
          // Update existing tag - only include assemblyId if defined
          const updatedTag: Tag = {
            ...tags[idx],
            code: codeKey,
            name: t.name || '',
            category: incomingCat,
            color: incomingColor,
          };
          if (finalAssemblyId !== undefined) {
            updatedTag.assemblyId = finalAssemblyId;
          }
          tags[idx] = updatedTag;
        } else {
          // Add new tag - only include assemblyId if defined
          const newTag: Tag = {
            id: nextId(),
            code: codeKey,
            name: t.name || '',
            category: incomingCat,
            color: incomingColor,
          };
          if (finalAssemblyId !== undefined) {
            newTag.assemblyId = finalAssemblyId;
          }
          tags.push(newTag);
        }

        const overrides = { ...s.colorOverrides };
        if (isLights(incomingCat)) {
          if (incomingColor && incomingColor.toUpperCase() !== ORANGE.toUpperCase()) overrides[codeKey] = incomingColor;
          else delete overrides[codeKey];
        }

        // Save to Supabase asynchronously
        saveTagsToSupabase(tags, overrides).catch(err => console.error('Failed to save tags to Supabase:', err));

        return { tags, colorOverrides: overrides };
      }),

      updateTag: (id, patch) => set((s) => {
        if (!patch) return {};
        const tags = [...s.tags];
        const currentIdx = tags.findIndex(t => t.id === id);
        if (currentIdx < 0) return {};

        console.log('[Store] updateTag - patch:', patch);
        console.log('[Store] updateTag - has assemblyId property:', 'assemblyId' in patch);
        console.log('[Store] updateTag - current tag:', tags[currentIdx]);

        const nextCode = patch.code ? norm(patch.code) : norm(tags[currentIdx].code);
        const nextCat  = (patch.category ?? (tags[currentIdx].category || '')).trim();
        const nextName = patch.name ?? tags[currentIdx].name;
        const nextColor= patch.color ?? tags[currentIdx].color;
        // CRITICAL: Check if assemblyId property EXISTS in patch, not just if it's undefined
        let nextAssemblyId = 'assemblyId' in patch ? patch.assemblyId : tags[currentIdx].assemblyId;

        console.log('[Store] updateTag - nextAssemblyId:', nextAssemblyId);

        // Merge into canonical if code collides with another
        const canonicalIdx = tags.findIndex(t => norm(t.code) === nextCode);
        if (canonicalIdx >= 0 && canonicalIdx !== currentIdx) {
          // Create new tag object - only include assemblyId if it's defined
          const updatedTag: Tag = {
            id: tags[canonicalIdx].id,
            code: nextCode,
            name: nextName,
            category: nextCat,
            color: nextColor,
          };
          if (nextAssemblyId !== undefined) {
            updatedTag.assemblyId = nextAssemblyId;
          }
          console.log('[Store] updateTag - final updatedTag (canonical):', updatedTag);
          tags[canonicalIdx] = updatedTag;
          tags.splice(currentIdx, 1);
        } else {
          // Create new tag object - only include assemblyId if it's defined
          const updatedTag: Tag = {
            id: tags[currentIdx].id,
            code: nextCode,
            name: nextName,
            category: nextCat,
            color: nextColor,
          };
          if (nextAssemblyId !== undefined) {
            updatedTag.assemblyId = nextAssemblyId;
          }
          console.log('[Store] updateTag - final updatedTag:', updatedTag);
          tags[currentIdx] = updatedTag;
        }

        const overrides = { ...s.colorOverrides };
        if (isLights(nextCat)) {
          if (nextColor && nextColor.toUpperCase() !== ORANGE.toUpperCase()) overrides[nextCode] = nextColor;
          else delete overrides[nextCode];
        } else {
          // non-lights: remove any leftover override
          delete overrides[nextCode];
        }

        // Save to Supabase asynchronously
        saveTagsToSupabase(tags, overrides).catch(err => console.error('Failed to save tags to Supabase:', err));

        return { tags, colorOverrides: overrides, projectTagIds: s.projectTagIds.filter(pid => pid !== id) };
      }),

      deleteTag: (id) => set(s => {
        const tag = s.tags.find(t => t.id === id);
        const tags = s.tags.filter(t => t.id !== id);
        const overrides = { ...s.colorOverrides };
        if (tag) delete overrides[norm(tag.code)];

        // Save to Supabase asynchronously
        saveTagsToSupabase(tags, overrides).catch(err => console.error('Failed to save tags to Supabase:', err));

        return { tags, projectTagIds: s.projectTagIds.filter(pid => pid !== id), colorOverrides: overrides };
      }),

      importTags: (list) => set((s) => {
        const incoming = asArray<Tag | Omit<Tag,'id'>>(list);
        const merged = [...s.tags];
        const overrides = { ...s.colorOverrides };

        for (const raw of incoming) {
          // Preserve incoming assemblyId, or auto-assign for non-light categories
          const incomingCat = (raw as any).category || '';
          const isLightCategory = incomingCat?.toLowerCase().includes('light');

          // Auto-assign assembly if not already set (but skip auto-assign for Lights)
          let finalAssemblyId = (raw as any).assemblyId;

          if (!isLightCategory && !finalAssemblyId) {
            const tagWithAssembly = autoAssignAssembly({
              code: (raw as any).code,
              category: incomingCat,
              assemblyId: (raw as any).assemblyId
            });
            finalAssemblyId = tagWithAssembly.assemblyId;
          }
          // Keep raw.assemblyId as-is for lights (preserve user assignments)

          // Create tag object - only include assemblyId if defined
          const t: Tag = {
            id: (raw as Tag).id || nextId(),
            code: (raw as any).code,
            name: (raw as any).name || '',
            category: incomingCat,
            color: (raw as any).color || ORANGE,
          };
          if (finalAssemblyId !== undefined) {
            t.assemblyId = finalAssemblyId;
          }

          const key = norm(t.code);
          const idx = merged.findIndex(x => norm(x.code) === key);
          if (idx >= 0) {
            const updatedTag: Tag = { ...merged[idx], ...t, code: key };
            // Remove assemblyId if it was set to undefined
            if (finalAssemblyId === undefined && merged[idx].assemblyId !== undefined) {
              delete (updatedTag as any).assemblyId;
            }
            merged[idx] = updatedTag;
          } else {
            merged.push({ ...t, code: key });
          }

          if (isLights(t.category)) {
            if (t.color && t.color.toUpperCase() !== ORANGE.toUpperCase()) overrides[key] = t.color;
            else delete overrides[key];
          } else {
            delete overrides[key];
          }
        }
        const keep = s.projectTagIds.filter(id => merged.some(t => t.id === id));

        // Save to Supabase asynchronously
        saveTagsToSupabase(merged, overrides).catch(err => console.error('Failed to save tags to Supabase:', err));

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
        const projectTags = tags.filter(t => projectTagIds.includes(t.id));
        // Sort by order field, then by code
        return projectTags.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.code.localeCompare(b.code);
        });
      },
      reorderProjectTags: (tagIds: string[]) => {
        set(s => {
          // Update order for all tags based on their position in the array
          const updatedTags = s.tags.map(tag => {
            const index = tagIds.indexOf(tag.id);
            if (index !== -1) {
              return { ...tag, order: index };
            }
            return tag;
          });
          return { tags: updatedTags };
        });
      },

      getProjectName: () => {
        const { projectName, fileName } = get();
        return projectName?.trim() ? projectName : baseNameNoExt(fileName);
      },

      toProject: () => {
        const { fileName, pages, tags, projectName } = get();
        const payload: any = { fileName, pages, tags };
        if (projectName) payload.name = projectName;
        return payload as ProjectSave;
      },

      fromProject: (data) => {
        const d: any = data || {};
        const rawTags = asArray<Tag>(d.tags).length ? asArray<Tag>(d.tags) : get().tags;

        // Auto-assign assemblies to all tags when loading project
        const tags = rawTags.map(tag => {
          const tagWithAssembly = autoAssignAssembly({
            code: tag.code,
            category: tag.category,
            assemblyId: tag.assemblyId
          });
          return { ...tag, assemblyId: tagWithAssembly.assemblyId };
        });

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
      },

      /** ===== Measure options helpers ===== */
      setLastMeasureOptions: (opts) => set((s) => ({
        lastMeasureOptions: {
          ...s.lastMeasureOptions,
          ...opts,
          // keep exactly 3 conductor groups to simplify UI logic
          conductors: (opts.conductors
            ? [
                opts.conductors[0] ?? s.lastMeasureOptions.conductors[0],
                opts.conductors[1] ?? s.lastMeasureOptions.conductors[1],
                opts.conductors[2] ?? s.lastMeasureOptions.conductors[2],
              ]
            : s.lastMeasureOptions.conductors
          ) as MeasureOptions['conductors'],
        }
      })),
      resetLastMeasureOptions: () => set({ lastMeasureOptions: DEFAULT_MEASURE_OPTIONS }),
      getLastMeasureOptions: () => get().lastMeasureOptions,

      /** ===== AI Analysis helpers ===== */
      setAiAnalysisResult: (result) => set({ aiAnalysisResult: result }),
      getAiAnalysisResult: () => get().aiAnalysisResult,

      /** ===== Assembly management ===== */
      addAssembly: (assembly) => set((s) => ({
        assemblies: [...s.assemblies, assembly]
      })),
      updateAssembly: (id, assembly) => set((s) => ({
        assemblies: s.assemblies.map(a => a.id === id ? assembly : a)
      })),
      deleteAssembly: (id) => set((s) => {
        // Remove assembly and clear it from any tags using it
        const tags = s.tags.map(tag =>
          tag.assemblyId === id ? { ...tag, assemblyId: undefined } : tag
        );
        return {
          assemblies: s.assemblies.filter(a => a.id !== id),
          tags
        };
      }),

      /** Set assemblies (replaces all assemblies in the store) */
      setAssemblies: (assemblies: Assembly[]) => {
        set({ assemblies });
      },

      /** Save an assembly to Supabase */
      saveAssemblyToDatabase: async (assembly: Assembly) => {
        try {
          const success = await saveAssemblyToSupabase(assembly);
          if (success) {
            // Update local state
            const { assemblies } = get();
            const exists = assemblies.find(a => a.id === assembly.id);

            if (exists) {
              set({ assemblies: assemblies.map(a => a.id === assembly.id ? assembly : a) });
            } else {
              set({ assemblies: [...assemblies, assembly] });
            }
          }
          return success;
        } catch (err) {
          console.error('Failed to save assembly to database:', err);
          return false;
        }
      },
    }),
    {
      name: 'skd.mastertags.v1',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // persist master DB, palette, overrides, lastMeasureOptions, aiAnalysisResult (NOT assemblies - they come from Supabase)
      partialize: (s) => ({
        tags: s.tags,
        palette: s.palette,
        colorOverrides: s.colorOverrides,
        lastMeasureOptions: s.lastMeasureOptions,
        aiAnalysisResult: s.aiAnalysisResult,
      }),
      migrate: (persistedState: any, version: number) => {
        // Migration from version 1 to 2: Add itemCode to assembly items
        if (version === 1) {
          if (persistedState.assemblies && Array.isArray(persistedState.assemblies)) {
            persistedState.assemblies = persistedState.assemblies.map((assembly: any) => {
              if (assembly.items && Array.isArray(assembly.items)) {
                assembly.items = assembly.items.map((item: any) => {
                  // If item doesn't have itemCode, generate it from id
                  if (!item.itemCode && item.id) {
                    return { ...item, itemCode: item.id.toUpperCase() };
                  }
                  return item;
                });
              }
              return assembly;
            });
          }
        }
        // Migration from version 2 to 3: Remove assemblies from localStorage (now in Supabase)
        if (version === 2 && persistedState.assemblies) {
          delete persistedState.assemblies;
        }
        return persistedState;
      },
    }
  )
);
