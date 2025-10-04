// src/App.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDoc } from '@/lib/pdf';
import { loadPdfFromBytes } from '@/lib/pdf';
import PDFViewport from '@/components/PDFViewport';
import TagManager from '@/components/TagManager';
import { AssemblyPanel } from '@/components/AssemblyPanel';
import { PricingPanel } from '@/components/PricingPanel';
import { UserGuide } from '@/components/UserGuide';
import { AIAnalysisPanel } from '@/components/AIAnalysisPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { analyzeDrawingsWithImages, getOpenAIApiKey, setOpenAIApiKey, type ProjectAnalysis } from '@/utils/openaiAnalysis';
import { useStore } from '@/state/store';
import type { AnyTakeoffObject, ProjectSave, Tag } from '@/types';
import { pathLength } from '@/utils/geometry';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useTagAutoSave } from '@/hooks/useTagAutoSave';
import { useInitialize } from '@/hooks/useInitialize';

/* NEW: raceway BOM helpers */
import {
  buildBOMRows,
  toCSVItemizedWithRaceway,
  toCSVSummarizedWithRaceway,
} from '@/utils/bom';

/* Tag shape used by the DB + project bar */
type TagLite = { id: string; code: string; name: string; color: string; category?: string };

/** Bundle stored in .skdproj (PDF is embedded) */
type SKDBundle = {
  kind: 'skdproj';
  version: 1;
  core: ProjectSave;
  projectTags: TagLite[];
  pdf?: { name: string; bytesBase64: string };
};

/* =========================================================================================
   helpers for base64 <-> ArrayBuffer
   ========================================================================================= */
function normalizeBase64(input: string): string {
  let src = (input || '').trim();
  const comma = src.indexOf(',');
  if (src.startsWith('data:') && comma !== -1) src = src.slice(comma + 1);
  src = src.replace(/\s+/g, '');
  src = src.replace(/-/g, '+').replace(/_/g, '/');
  const mod = src.length % 4;
  if (mod === 2) src += '==';
  else if (mod === 3) src += '=';
  return src;
}
function b64ToAb(b64: string): ArrayBuffer {
  const src = normalizeBase64(b64);
  const bin = atob(src);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
/** quick sanity check that bytes look like a PDF ("%PDF") near the start */
function looksLikePdf(bytes: Uint8Array): boolean {
  const searchLen = Math.min(bytes.length, 64);
  for (let i = 0; i <= searchLen - 5; i++) {
    if (bytes[i]===0x25 && bytes[i+1]===0x50 && bytes[i+2]===0x44 && bytes[i+3]===0x46 && bytes[i+4]===0x2d) return true;
  }
  return false;
}
async function resolvePageLabels(doc: any): Promise<string[]> {
  const count = (doc?.numPages ?? 0) | 0;
  return Array.from({ length: count }, (_, i) => `Page ${i + 1}`);
}

export default function App() {
  /* ---------- refs ---------- */
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const addSheetRef = useRef<HTMLInputElement>(null);
  const projFileRef = useRef<HTMLInputElement>(null);

  /* ---------- viewer/pdf ---------- */
  const [pdf, setPdf] = useState<PDFDoc | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [pdfBytesBase64, setPdfBytesBase64] = useState<string | null>(null);

  // Wrapper functions to update both local state and Zustand store
  const updatePdfBytesBase64 = (bytes: string | null) => {
    setPdfBytesBase64(bytes);
    useStore.getState().setPdfBytesBase64(bytes);
  };

  const updatePdfName = (name: string) => {
    setPdfName(name);
    useStore.getState().setPdfName(name);
  };

  /* ---------- Tag Manager modal ---------- */
  const [tagsOpen, setTagsOpen] = useState(false);

  /* ---------- Assembly Panel modal ---------- */
  const [assemblyPanelOpen, setAssemblyPanelOpen] = useState(false);
  const [pricingPanelOpen, setPricingPanelOpen] = useState(false);
  const [aiAnalysisOpen, setAiAnalysisOpen] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Get AI analysis result from store (persisted)
  const aiAnalysisResult = useStore(s => s.aiAnalysisResult);
  const setAiAnalysisResult = useStore(s => s.setAiAnalysisResult);
  const [settingsOpen, setSettingsOpen] = useState(false);

  /* ---------- File menu ---------- */
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const [lastSaveBase, setLastSaveBase] = useState<string | null>(null);
  const [userGuideOpen, setUserGuideOpen] = useState(false);
  const [timeSinceLastSave, setTimeSinceLastSave] = useState<string>('');

  /* ---------- per-project "Project Tags" ---------- */
  const [projectTags, setProjectTags] = useState<TagLite[]>([]);
  const [projectTagsCollapsed, setProjectTagsCollapsed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSel, setPickerSel] = useState<string>('');
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);
  const [dragOverTagIndex, setDragOverTagIndex] = useState<number | null>(null);

  /* ---------- sidebar collapse ---------- */
  const [leftOpen, setLeftOpen] = useState<boolean>(true);

  /* ---------- Focus Mode for maximum blueprint visibility ---------- */
  const [focusMode, setFocusMode] = useState(false);

  /* ---------- Initialize: Load tags from Supabase ---------- */
  useInitialize();

  /* ---------- Auto-save TAGS ONLY to Supabase (Projects are saved manually) ---------- */
  useTagAutoSave();

  /* ---------- Warn before closing if project not saved ---------- */
  useAutoSave();

  // Prevent accidental browser close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Chrome requires returnValue to be set
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /* ---------- store ---------- */
  const {
    tool, setTool,
    zoom, setZoom,
    fileName, setFileName,
    pages, setPages,
    pageCount, setPageCount,
    pageLabels, setPageLabels,
    activePage, setActivePage,
    tags,
    currentTag, setCurrentTag,
    setSelectedIds,
    setProjectName,
    reorderProjectTags,
    lastSaveTime,
  } = useStore();

  /* ---------- scroll container + content ---------- */
  const viewerScrollRef = useRef<HTMLDivElement>(null);

  /* ---------- Project Tag Drag and Drop Handlers ---------- */
  const handleTagDragStart = (index: number) => {
    setDraggedTagIndex(index);
  };

  const handleTagDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverTagIndex(index);
  };

  const handleTagDragEnd = () => {
    if (draggedTagIndex !== null && dragOverTagIndex !== null && draggedTagIndex !== dragOverTagIndex) {
      const reordered = [...projectTags];
      const [movedTag] = reordered.splice(draggedTagIndex, 1);
      reordered.splice(dragOverTagIndex, 0, movedTag);
      setProjectTags(reordered);

      // Sync with store's tag order
      reorderProjectTags(reordered.map(t => t.id));
    }
    setDraggedTagIndex(null);
    setDragOverTagIndex(null);
  };

  /* ---------- Hand panning ---------- */
  const panStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startLeft: number;
    startTop: number;
    byMouseButton: 0 | 1 | 2;
  }>({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, byMouseButton: 0 });

  /* =========================================================================================
     FILE MENU  — New / Open / Save / Save As / Print / Close
     ========================================================================================= */
  const makeBundle = useCallback<() => SKDBundle>(() => {
    const state = useStore.getState();
    const core: ProjectSave = {
      fileName: state.fileName,
      pages: state.pages.map(page => ({
        pageIndex: page.pageIndex,
        pixelsPerFoot: page.pixelsPerFoot,
        unit: page.unit || 'ft',
        objects: page.objects || []
      })),
      tags: state.tags
    };
    const bundle: SKDBundle = {
      kind: 'skdproj',
      version: 1,
      projectTags,
      core,
      pdf: pdfBytesBase64 ? { name: pdfName || fileName || 'document.pdf', bytesBase64: pdfBytesBase64 } : undefined
    };
    return bundle;
  }, [projectTags, pdfBytesBase64, pdfName, fileName]);

  const downloadBundle = useCallback((basename?: string) => {
    const base = (basename || lastSaveBase || 'project').replace(/\.(skdproj|json)$/i, '');
    const filename = `${base}.skdproj`;
    const blob = new Blob([JSON.stringify(makeBundle(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    setLastSaveBase(base);
  }, [makeBundle, lastSaveBase]);

  // Sync projectTags from store whenever projectTagIds changes
  useEffect(() => {
    let previousProjectTagIds: string[] = [];

    const unsubscribe = useStore.subscribe((state) => {
      const currentProjectTagIds = state.projectTagIds;

      // Check if projectTagIds actually changed
      if (JSON.stringify(currentProjectTagIds) !== JSON.stringify(previousProjectTagIds)) {
        previousProjectTagIds = currentProjectTagIds;
        const projectTagsFromStore = state.getProjectTags();
        setProjectTags(projectTagsFromStore);
        console.log('[App] projectTagIds changed, synced project tags:', projectTagsFromStore.length);
      }
    });

    return unsubscribe;
  }, []);

  // Update time since last save display
  useEffect(() => {
    const updateTimeSince = () => {
      if (!lastSaveTime) {
        setTimeSinceLastSave('Not saved');
        return;
      }
      const saveDate = lastSaveTime instanceof Date ? lastSaveTime : new Date(lastSaveTime);
      const seconds = Math.floor((Date.now() - saveDate.getTime()) / 1000);
      if (seconds < 10) setTimeSinceLastSave('Just now');
      else if (seconds < 60) setTimeSinceLastSave(`${seconds}s ago`);
      else if (seconds < 3600) setTimeSinceLastSave(`${Math.floor(seconds / 60)}m ago`);
      else setTimeSinceLastSave(`${Math.floor(seconds / 3600)}h ago`);
    };

    updateTimeSince();
    const interval = setInterval(updateTimeSince, 5000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

  function doNewProject() {
    if (!confirm('Start a new project? Unsaved changes will be lost.')) return;
    setPdf(null);
    updatePdfName('');
    updatePdfBytesBase64(null);
    setFileName('');
    setPages([]);
    setPageCount(0);
    setPageLabels([]);
    setActivePage(0);
    useStore.getState().setSelectedIds([]);
    setCurrentTag('');
    setProjectTags([]);
    setProjectName('Untitled Project');
    setLastSaveBase(null);
  }

  /** open .skdproj and auto-restore embedded PDF */
  async function doOpenProject(file: File) {
    let text = '';
    try {
      text = await file.text();
      const parsed = JSON.parse(text);
      const bundle: SKDBundle =
        parsed && parsed.kind === 'skdproj'
          ? parsed
          : { kind: 'skdproj', version: 1, core: parsed as ProjectSave, projectTags: [], pdf: undefined };

      try {
        const state = useStore.getState();

        if (bundle.core.pages && Array.isArray(bundle.core.pages)) {
          state.setPages(bundle.core.pages.map(page => ({
            pageIndex: page.pageIndex,
            pixelsPerFoot: page.pixelsPerFoot,
            unit: page.unit || 'ft',
            calibrated: !!page.pixelsPerFoot,
            objects: page.objects || []
          })));
        }

        if (bundle.core.tags && Array.isArray(bundle.core.tags)) {
          state.importTags(bundle.core.tags);
        }

        if (bundle.core.fileName) {
          state.setFileName(bundle.core.fileName);
        }
      } catch (err: any) {
        console.warn('[Open Project] fromProject warning:', err?.message || err);
      }

      const coreAny: any = bundle.core ?? {};
      const baseFromPdf = (bundle.pdf?.name || '').replace(/\.pdf$/i, '');
      const baseFromFile = file.name.replace(/\.(skdproj|json)$/i, '');
      const openedName =
        (typeof coreAny.name === 'string' && coreAny.name.trim()) ||
        (typeof coreAny.projectName === 'string' && coreAny.projectName.trim()) ||
        (baseFromPdf && baseFromPdf.trim()) ||
        baseFromFile;

      setProjectName(openedName);
      setProjectTags(Array.isArray(bundle.projectTags) ? bundle.projectTags : []);

      if (bundle.pdf && typeof bundle.pdf.bytesBase64 === 'string' && bundle.pdf.bytesBase64.length > 0) {
        try {
          const ab = b64ToAb(bundle.pdf.bytesBase64);
          const u8 = new Uint8Array(ab);
          if (!looksLikePdf(u8)) throw new Error('Embedded bytes are not a PDF (missing %PDF- header)');

          const doc = await loadPdfFromBytes(u8);

          setPdf(doc);
          updatePdfName(bundle.pdf.name || 'document.pdf');
          setFileName(bundle.pdf.name || 'document.pdf');
          updatePdfBytesBase64(bundle.pdf.bytesBase64);

          setPageCount(doc.numPages);
          setPageLabels(await resolvePageLabels(doc));
          setActivePage(0);
          useStore.getState().setSelectedIds([]);
        } catch (err: any) {
          console.error('[Open Project] Could not load embedded PDF:', err?.message || err);
          setPdf(null);
          setFileName('');
        }
      } else {
        setPdf(null);
        setFileName('');
      }

      setLastSaveBase(baseFromFile);
    } catch (e: any) {
      console.error('[Open Project] Invalid .skdproj:', e?.message || e, { filePreview: text.slice(0, 200) });
      alert(`Failed to open project: ${e?.message || 'Invalid file format'}`);
    }
  }

  function doSave() { downloadBundle(); }
  function doSaveAs() {
    const suggested = lastSaveBase ?? useStore.getState().getProjectName() ?? 'project';
    const name = prompt('Save As (.skdproj basename):', suggested);
    if (!name) return;
    const base = name.replace(/\.(skdproj|json)$/i, '');
    downloadBundle(base);
    setProjectName(base);
  }
  function doPrint() { window.print(); }
  function doCloseProject() { doNewProject(); }

  async function doSaveToDatabase() {
    const { saveProjectToSupabase } = await import('@/utils/supabasePricing');
    const state = useStore.getState();
    const projectData = {
      fileName: fileName || 'Untitled',
      projectName: state.projectName || 'Untitled Project',
      name: state.projectName || 'Untitled Project',
      pages: state.pages,
      tags: state.tags,
      pdf: pdfBytesBase64 ? { name: pdfName || fileName || 'document.pdf', bytesBase64: pdfBytesBase64 } : undefined
    };
    const success = await saveProjectToSupabase(projectData);
    if (success) {
      state.setLastSaveTime(new Date());
      alert('✅ Project saved to database successfully!');
    } else {
      alert('❌ Failed to save project to database');
    }
  }

  async function doOpenFromDatabase() {
    const { loadAllProjectsFromSupabase, loadProjectByIdFromSupabase } = await import('@/utils/supabasePricing');
    const projects = await loadAllProjectsFromSupabase();

    if (projects.length === 0) {
      alert('No saved projects found in database');
      return;
    }

    const projectList = projects
      .map((p, i) => `${i + 1}. ${p.project_name} (${new Date(p.updated_at).toLocaleDateString()})`)
      .join('\n');

    const selection = prompt(`Select a project to open:\n\n${projectList}\n\nEnter number (1-${projects.length}):`);
    if (!selection) return;

    const index = parseInt(selection, 10) - 1;
    if (index < 0 || index >= projects.length) {
      alert('Invalid selection');
      return;
    }

    const projectData = await loadProjectByIdFromSupabase(projects[index].id);
    if (projectData) {
      // Load project into store
      useStore.getState().fromProject(projectData);

      // Sync local state with store
      const storeState = useStore.getState();
      setPages(storeState.pages);
      setPageCount(storeState.pages.length);
      setPageLabels(storeState.pages.map((p: any) => p.pageLabel || `Page ${p.pageIndex + 1}`));
      setActivePage(0);
      setFileName(storeState.fileName);
      setProjectName(storeState.projectName);

      // Sync project tags from store
      const projectTagsFromStore = storeState.getProjectTags();
      setProjectTags(projectTagsFromStore);
      console.log('[Database Load] Synced project tags:', projectTagsFromStore.length);

      // Restore PDF if it was saved
      if (projectData.pdf?.bytesBase64) {
        try {
          console.log('[Database Load] PDF data found, length:', projectData.pdf.bytesBase64.length);
          const bytes = Uint8Array.from(atob(projectData.pdf.bytesBase64), c => c.charCodeAt(0));
          console.log('[Database Load] Decoded bytes, length:', bytes.length);
          const pdfDoc = await loadPdfFromBytes(bytes);
          console.log('[Database Load] PDF loaded, pages:', pdfDoc.numPages);
          setPdf(pdfDoc);
          updatePdfBytesBase64(projectData.pdf.bytesBase64);
          updatePdfName(projectData.pdf.name || storeState.fileName);
          setFileName(projectData.pdf.name || storeState.fileName);

          // Update page count and labels for PDF viewport
          setPageCount(pdfDoc.numPages);
          setPageLabels(await resolvePageLabels(pdfDoc));
          setActivePage(0);
          useStore.getState().setSelectedIds([]);
          console.log('[Database Load] ✅ PDF viewport state updated');
        } catch (error) {
          console.error('[Database Load] ❌ Error loading PDF:', error);
          setPdf(null);
          updatePdfBytesBase64(null);
          updatePdfName('');
        }
      } else {
        console.log('[Database Load] ⚠️ No PDF data in project');
        // No PDF data saved (old project format)
        setPdf(null);
        updatePdfBytesBase64(null);
        updatePdfName('');

        // Prompt user to load PDF
        alert(`✅ Loaded: ${storeState.projectName || storeState.fileName}\n\n⚠️ This project has no PDF attached.\n\nClick "Open PDF" to attach the PDF file.`);
        return;
      }

      // Show simple success message
      alert(`✅ Loaded: ${storeState.projectName || storeState.fileName}`);
    } else {
      alert('❌ Failed to load project from database');
    }
  }

  /* =========================================================================================
     OPEN PDF (embed bytes into project state)
     ========================================================================================= */
  const openPdf = useCallback(async (file: File) => {
    // Check if there's existing project data
    const existingPages = useStore.getState().pages;
    const hasExistingData = existingPages.length > 0;

    if (hasExistingData) {
      // Ask user what they want to do
      const choice = confirm(
        '⚠️ You have an existing project loaded.\n\n' +
        'Click OK to ATTACH this PDF (keep all tags/measurements)\n' +
        'Click CANCEL to start a NEW project (lose all data)'
      );

      if (!choice) {
        // User wants to start fresh - clear everything
        if (!confirm('⚠️ Are you sure? This will delete all your tags and measurements!')) {
          return; // User canceled
        }
        // Clear all project data
        setPages([]);
        useStore.getState().importTags([]);
      }
      // If choice === true, we keep existing data and just attach the PDF
    }

    const buf = await file.arrayBuffer();

    // Store as base64 in the project bundle
    let b64 = '';
    {
      const v = new Uint8Array(buf);
      let s = '';
      for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
      b64 = btoa(s);
    }

    updatePdfBytesBase64(b64);
    updatePdfName(file.name);

    // Always feed pdf.js a Uint8Array
    const doc = await loadPdfFromBytes(new Uint8Array(buf));
    setPdf(doc);
    setFileName(file.name);

    // Only clear pages if we don't have existing data OR user chose to start fresh
    if (!hasExistingData) {
      setPages([]);
      setPageCount(doc.numPages);
      setPageLabels(await resolvePageLabels(doc));
      setActivePage(0);
      useStore.getState().setSelectedIds([]);

      // Prompt for project name when loading PDF
      const suggestedName = file.name.replace(/\.pdf$/i, '').trim();
      const projectName = prompt('Enter project name:', suggestedName);
      if (projectName && projectName.trim()) {
        setProjectName(projectName.trim());
      } else {
        setProjectName('Untitled Project');
      }
    } else {
      // Just update the page count and labels for the new PDF
      setPageCount(doc.numPages);
      setPageLabels(await resolvePageLabels(doc));
      setActivePage(0);
      useStore.getState().setSelectedIds([]);
      alert('✅ PDF attached to existing project!');
    }
  }, [setFileName, setPages, setPageCount, setPageLabels, setActivePage, setProjectName]);

  /* Add individual PDF sheet to current project */
  const addSheet = useCallback(async (file: File) => {
    if (!pdf || !pdfBytesBase64) {
      alert('Please open a project first before adding sheets');
      return;
    }

    try {
      // Import pdf-lib for merging
      const { PDFDocument } = await import('pdf-lib');

      // Load current PDF from base64
      const currentPdfBytes = b64ToAb(pdfBytesBase64);
      const currentPdfDoc = await PDFDocument.load(currentPdfBytes);

      // Load new sheet
      const newSheetBytes = await file.arrayBuffer();
      const newSheetDoc = await PDFDocument.load(newSheetBytes);

      // Copy all pages from new sheet to current PDF
      const newPageCount = newSheetDoc.getPageCount();
      const copiedPages = await currentPdfDoc.copyPages(newSheetDoc, Array.from({ length: newPageCount }, (_, i) => i));
      copiedPages.forEach(page => currentPdfDoc.addPage(page));

      // Save merged PDF
      const mergedPdfBytes = await currentPdfDoc.save();

      // Convert to base64
      let b64 = '';
      {
        const v = new Uint8Array(mergedPdfBytes);
        let s = '';
        for (let i = 0; i < v.length; i++) s += String.fromCharCode(v[i]);
        b64 = btoa(s);
      }

      // Reload the merged PDF
      const doc = await loadPdfFromBytes(new Uint8Array(mergedPdfBytes));
      setPdf(doc);
      updatePdfBytesBase64(b64);

      // Create custom page labels for the new sheet
      const sheetName = file.name.replace(/\.pdf$/i, '').trim();
      const newLabels = Array.from({ length: newPageCount }, (_, i) =>
        `${sheetName} - Page ${i + 1}`
      );

      // Append new page labels to existing ones
      setPageLabels([...pageLabels, ...newLabels]);
      setPageCount(pageCount + newPageCount);

      // Navigate to first page of the new sheet
      setActivePage(pageCount);

      alert(`Added ${newPageCount} page(s) from "${sheetName}"`);
    } catch (err: any) {
      console.error('Error adding sheet:', err);
      alert(`Failed to add sheet: ${err?.message || 'Unknown error'}`);
    }
  }, [pdf, pdfBytesBase64, pageLabels, pageCount, setPageLabels, setPageCount, setActivePage]);

  /* =========================================================================================
     AI DOCUMENT ANALYSIS
     ========================================================================================= */
  const runAIAnalysis = useCallback(async () => {
    if (!pdf) {
      alert('Please load a PDF first');
      return;
    }

    let apiKey = getOpenAIApiKey();
    if (!apiKey) {
      apiKey = prompt('Enter your OpenAI API key:\n\n(Your key will be saved locally and never sent to our servers. It will only be used to call OpenAI directly from your browser.)');
      if (!apiKey || !apiKey.trim()) {
        return;
      }
      setOpenAIApiKey(apiKey);
    }

    setAiAnalyzing(true);

    try {
      const imageDataUrls: string[] = [];

      for (let i = 0; i < Math.min(pdf.numPages, 10); i++) {
        try {
          const page = await pdf.getPage(i + 1);
          const viewport = page.getViewport({ scale: 2.0 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          imageDataUrls.push(dataUrl);
        } catch (pageError) {
          console.error(`Error rendering page ${i + 1}:`, pageError);
        }
      }

      if (imageDataUrls.length === 0) {
        throw new Error('Could not render any pages from PDF');
      }

      const analysis = await analyzeDrawingsWithImages(imageDataUrls, apiKey);
      setAiAnalysisResult(analysis);
      setAiAnalysisOpen(true);
    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      alert(`Failed to analyze drawings: ${error.message || 'Unknown error'}\n\nPlease check your API key and try again.`);
    } finally {
      setAiAnalyzing(false);
    }
  }, [pdf]);

  const exportAIAnalysis = useCallback(async () => {
    if (!aiAnalysisResult) return;

    try {
      const XLSX = await import('xlsx');

      const data: any[] = [];

      data.push(['AI DOCUMENT ANALYSIS REPORT']);
      data.push(['Project:', fileName || 'Untitled']);
      data.push(['Date:', new Date().toLocaleDateString()]);
      data.push([]);

      // Export all assumption categories
      const hasAnyAssumptions =
        (aiAnalysisResult.assumptions.fixtureSupply && aiAnalysisResult.assumptions.fixtureSupply.length > 0) ||
        (aiAnalysisResult.assumptions.electricalScope && aiAnalysisResult.assumptions.electricalScope.length > 0) ||
        (aiAnalysisResult.assumptions.lightingScheduleNotes && aiAnalysisResult.assumptions.lightingScheduleNotes.length > 0) ||
        (aiAnalysisResult.assumptions.fixturesList && aiAnalysisResult.assumptions.fixturesList.length > 0) ||
        (aiAnalysisResult.assumptions.otherPages && aiAnalysisResult.assumptions.otherPages.length > 0) ||
        (aiAnalysisResult.assumptions.lightingControls && aiAnalysisResult.assumptions.lightingControls.length > 0) ||
        (aiAnalysisResult.assumptions.fixtureCountsBasis && aiAnalysisResult.assumptions.fixtureCountsBasis.length > 0) ||
        (aiAnalysisResult.assumptions.wasteFactors && aiAnalysisResult.assumptions.wasteFactors.length > 0) ||
        (aiAnalysisResult.assumptions.laborRates && aiAnalysisResult.assumptions.laborRates.length > 0) ||
        (aiAnalysisResult.assumptions.qaNotes && aiAnalysisResult.assumptions.qaNotes.length > 0) ||
        (aiAnalysisResult.assumptions.other && aiAnalysisResult.assumptions.other.length > 0);

      if (hasAnyAssumptions) {
        data.push(['PROJECT ASSUMPTIONS & CLARIFICATIONS']);
        data.push([]);

        if (aiAnalysisResult.assumptions.fixtureSupply && aiAnalysisResult.assumptions.fixtureSupply.length > 0) {
          data.push(['Fixture Supply & Responsibility']);
          aiAnalysisResult.assumptions.fixtureSupply.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.electricalScope && aiAnalysisResult.assumptions.electricalScope.length > 0) {
          data.push(['Electrical Contractor Scope']);
          aiAnalysisResult.assumptions.electricalScope.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.lightingScheduleNotes && aiAnalysisResult.assumptions.lightingScheduleNotes.length > 0) {
          data.push(['Lighting Fixture Schedule']);
          aiAnalysisResult.assumptions.lightingScheduleNotes.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.fixturesList && aiAnalysisResult.assumptions.fixturesList.length > 0) {
          data.push(['Fixtures Listed']);
          aiAnalysisResult.assumptions.fixturesList.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.otherPages && aiAnalysisResult.assumptions.otherPages.length > 0) {
          data.push(['Other Pages']);
          aiAnalysisResult.assumptions.otherPages.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.lightingControls && aiAnalysisResult.assumptions.lightingControls.length > 0) {
          data.push(['Lighting Controls (Devices)']);
          aiAnalysisResult.assumptions.lightingControls.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.fixtureCountsBasis && aiAnalysisResult.assumptions.fixtureCountsBasis.length > 0) {
          data.push(['Fixture Counts Basis']);
          aiAnalysisResult.assumptions.fixtureCountsBasis.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.wasteFactors && aiAnalysisResult.assumptions.wasteFactors.length > 0) {
          data.push(['Waste Factors / Labor Basis']);
          aiAnalysisResult.assumptions.wasteFactors.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.laborRates && aiAnalysisResult.assumptions.laborRates.length > 0) {
          data.push(['Labor Rate & Unit References']);
          aiAnalysisResult.assumptions.laborRates.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.qaNotes && aiAnalysisResult.assumptions.qaNotes.length > 0) {
          data.push(['QA Notes']);
          aiAnalysisResult.assumptions.qaNotes.forEach(a => data.push(['', a]));
          data.push([]);
        }

        if (aiAnalysisResult.assumptions.other && aiAnalysisResult.assumptions.other.length > 0) {
          data.push(['Other Assumptions']);
          aiAnalysisResult.assumptions.other.forEach(a => data.push(['', a]));
          data.push([]);
        }
      }

      data.push(['FIXTURE RESPONSIBILITY']);
      data.push(['Owner Provided:']);
      aiAnalysisResult.fixtureResponsibility.ownerProvided.forEach(item => data.push(['', item]));
      data.push(['Contractor Provided:']);
      aiAnalysisResult.fixtureResponsibility.contractorProvided.forEach(item => data.push(['', item]));
      if (aiAnalysisResult.fixtureResponsibility.notes) {
        data.push(['Notes:', aiAnalysisResult.fixtureResponsibility.notes]);
      }
      data.push([]);

      if (aiAnalysisResult.lightingSchedule.length > 0) {
        data.push(['LIGHTING SCHEDULE']);
        data.push(['Type', 'Description', 'Manufacturer', 'Model', 'Qty', 'Wattage', 'Voltage', 'Mounting', 'Notes']);
        aiAnalysisResult.lightingSchedule.forEach(f => {
          data.push([
            f.type, f.description, f.manufacturer || '', f.model || '',
            f.quantity || '', f.wattage || '', f.voltage || '',
            f.mounting || '', f.notes || ''
          ]);
        });
        data.push([]);
      }

      if (aiAnalysisResult.panelSchedule.length > 0) {
        data.push(['PANEL SCHEDULE']);
        data.push(['Panel ID', 'Location', 'Voltage', 'Phases', 'Main', 'Circuits', 'Fed From', 'Notes']);
        aiAnalysisResult.panelSchedule.forEach(p => {
          data.push([
            p.panelId, p.location || '', p.voltage || '', p.phases || '',
            p.main || '', p.circuits || '', p.feedFrom || '', p.notes || ''
          ]);
        });
        data.push([]);
      }

      if (aiAnalysisResult.keyNotes.length > 0) {
        data.push(['KEY NOTES']);
        aiAnalysisResult.keyNotes.forEach(n => data.push(['', n]));
        data.push([]);
      }

      data.push(['SCOPE OF WORK']);
      data.push(['Included Work:']);
      aiAnalysisResult.scope.includedWork.forEach(item => data.push(['', item]));
      data.push(['Excluded Work:']);
      aiAnalysisResult.scope.excludedWork.forEach(item => data.push(['', item]));

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws['!cols'] = [{ wch: 20 }, { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'AI Analysis');

      const filename = `${fileName || 'Project'} - AI Analysis.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export analysis');
    }
  }, [aiAnalysisResult, fileName]);

  /* =========================================================================================
     SIMPLE SUMMARY (BOM)
     ========================================================================================= */
  const bom = useMemo(() => {
    let totalTags = 0;
    let segLF = 0, plLF = 0, ffLF = 0;
    const byCode = new Map<string, { tags: number; meas: number; lf: number }>();

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot || 0;
      for (const obj of (pg.objects ?? [])) {
        if (obj.type === 'count') {
          totalTags++;
          const code = (obj as any).code || '';
          const box = byCode.get(code) ?? { tags: 0, meas: 0, lf: 0 };
          box.tags += 1;
          byCode.set(code, box);
          continue;
        }
        const verts = obj.vertices ?? [];
        const lenPx = pathLength(verts);
        const lf = ppf > 0 ? lenPx / ppf : 0;

        if (obj.type === 'segment') segLF += lf;
        else if (obj.type === 'polyline') plLF += lf;
        else if (obj.type === 'freeform') ffLF += lf;

        const code = (obj as any).code || '';
        if (code) {
          const box = byCode.get(code) ?? { tags: 0, meas: 0, lf: 0 };
          box.meas += 1;
          box.lf += lf;
          byCode.set(code, box);
        }
      }
    }

    const rows = Array.from(byCode.entries())
      .map(([code, v]) => ({ code, tags: v.tags, meas: v.meas, lf: v.lf }))
      .sort((a, b) => a.code.localeCompare(b.code));

    return {
      totalTags, segLF, plLF, ffLF, totalLF: segLF + plLF + ffLF,
      rows,
      calibratedCount: pages.filter(p => (p.pixelsPerFoot || 0) > 0).length,
      totalPages: pages.length,
    };
  }, [pages]);

  /* =========================================================================================
     ADD-FROM-DB PICKER (grouped by category, Lights/Receptacles first)
     ========================================================================================= */
  const PICKER_TOP_CATS = ['Lights', 'Receptacles'] as const;

  const pickerGroups = useMemo(() => {
    const remaining = (tags as Tag[])
      .filter(t => !projectTags.some(p => p.id === t.id));

    const byCat = new Map<string, Tag[]>();
    for (const t of remaining) {
      const cat = t.category || 'Uncategorized';
      const arr = byCat.get(cat) ?? [];
      arr.push(t);
      byCat.set(cat, arr);
    }
    for (const arr of byCat.values()) {
      arr.sort((a, b) => (a.code || '').localeCompare(b.code || ''));
    }
    const cats = Array.from(byCat.keys());
    const ordered = [
      ...PICKER_TOP_CATS.filter(c => byCat.has(c as unknown as string)) as unknown as string[],
      ...cats.filter(c => !PICKER_TOP_CATS.includes(c as any)).sort((a, b) => a.localeCompare(b)),
    ];
    return ordered.map(cat => ({ category: cat, items: byCat.get(cat)! }));
  }, [tags, projectTags]);

  const flatPickerList = useMemo(
    () => pickerGroups.flatMap(g => g.items.map(t => ({
      id: t.id, code: t.code, name: t.name, color: t.color, category: t.category, assemblyId: t.assemblyId
    }))),
    [pickerGroups]
  );

  // Header label always prefers store's project name
  const headerProjectLabel = useStore(s => s.getProjectName());

  /* =========================================================================================
     HAND TOOL: drag to pan (left), middle/right pan always
     ========================================================================================= */
  const beginPan = (e: React.MouseEvent) => {
    const container = viewerScrollRef.current;
    if (!container) return;
    const button = e.button as 0 | 1 | 2;
    const allow = (button === 0 && tool === 'hand') || button === 1 || button === 2;
    if (!allow) return;
    e.preventDefault();
    const { clientX, clientY } = e;
    panStateRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      startLeft: container.scrollLeft,
      startTop: container.scrollTop,
      byMouseButton: button,
    };
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };
  const movePan = (e: React.MouseEvent) => {
    const st = panStateRef.current;
    const container = viewerScrollRef.current;
    if (!st.active || !container) return;
    e.preventDefault();
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    container.scrollLeft = st.startLeft - dx;
    container.scrollTop  = st.startTop  - dy;
  };
  const endPan = () => {
    if (!panStateRef.current.active) return;
    panStateRef.current.active = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  /* =========================================================================================
     EXPORTS (Full Excel + Fixtures Only + NEW Raceway CSV/Excel)
     ========================================================================================= */

  // category helpers (for your existing Excel exports)
  function tagByCode(code: string) {
    const up = (code || '').toUpperCase();
    return (tags as Tag[]).find(t => (t.code || '').toUpperCase() === up);
  }
  function nameForCode(code: string): string {
    return tagByCode(code)?.name || '';
  }
  function catOf(code: string): string {
    const t = tagByCode(code);
    const cat = (t?.category || '').toLowerCase();

    // Heuristics by code prefix if category missing
    const up = (code || '').toUpperCase();
    if (cat) return cat;
    if (/^L/.test(up)) return 'lights';
    if (/^REC|^GFI|^GFCI|^OUT|^R-?/.test(up)) return 'receptacles';
    if (/^EM|^MLO|^PANEL|^SWBD|^XFMR/.test(up)) return 'power';
    if (/^FA|^SM|^PULL|^HORN|^STROBE/.test(up)) return 'fire alarm';
    if (/^DATA|^TEL|^CAT|^WAP|^AP|^COM|^LV/.test(up)) return 'data/comm';
    if (/^CTRL|^OC|^DIM|^SW/.test(up)) return 'lighting controls';
    return 'special systems';
  }
  function isLighting(code: string) {
    const c = catOf(code);
    return c.includes('light') && !c.includes('control');
  }

  // aggregated project data (for your existing Excel exports)
  function aggregate() {
    const countByCode = new Map<string, number>();
    const measByCode = new Map<string, { meas: number; lf: number }>();

    for (const pg of pages) {
      const ppf = pg.pixelsPerFoot || 0;
      for (const obj of (pg.objects ?? [])) {
        const code = (obj as any).code || '';
        if (!code) continue;

        if (obj.type === 'count') {
          countByCode.set(code, (countByCode.get(code) || 0) + 1);
        } else {
          const verts = obj.vertices ?? [];
          const lenPx = pathLength(verts);
          const lf = ppf > 0 ? lenPx / ppf : 0;
          const box = measByCode.get(code) ?? { meas: 0, lf: 0 };
          box.meas += 1;
          box.lf += lf;
          measByCode.set(code, box);
        }
      }
    }
    return { countByCode, measByCode };
  }

  async function ensureXLSX() {
    try {
      const x = (await import('xlsx')) as any;
      return x.default || x;
    } catch {
      alert('Missing dependency "xlsx". Install with:  npm i xlsx');
      throw new Error('xlsx missing');
    }
  }

  /* Full BOM Excel - Professional Industry-Standard Format */
  const exportExcelFull = async () => {
    try {
      const { exportProfessionalBOM } = await import('@/utils/excelBOM');
      const { tags, assemblies } = useStore.getState();

      const baseName =
        useStore.getState().getProjectName()?.trim() ||
        (pdfName || fileName || 'Electrical-BOM').replace(/\.[^.]+$/, '');

      await exportProfessionalBOM(
        pages,
        tags,
        assemblies,
        baseName,
        pdfName || fileName || 'Drawing Set'
      );
    } catch (error) {
      console.error('BOM export error:', error);
      alert('Failed to export BOM. Check console for details.');
    }
  };

  /* Existing fixtures-only Excel (kept) */
  const exportFixturesOnly = async () => {
    const XLSX = await ensureXLSX();
    const { countByCode } = aggregate();

    const projectName = useStore.getState().getProjectName()?.trim() || 'Project Name';

    // Tab 1: Fixture Counts
    const lightingRows = Array.from(countByCode.entries())
      .filter(([code]) => isLighting(code))
      .map(([code, count]) => ({
        Code: code,
        Name: nameForCode(code),
        Count: count
      }))
      .sort((a, b) => a.Code.localeCompare(b.Code));

    const totalCount = lightingRows.reduce((sum, row) => sum + row.Count, 0);

    const countsData: any[][] = [
      [`Project:  ${projectName}`, '', ''],
      [],
      ['Code', 'Name', 'Count'],
      ...lightingRows.map(row => [row.Code, row.Name, row.Count]),
      ['Total', '', totalCount]
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(countsData);
    ws1['!cols'] = [
      { wch: 10 },
      { wch: 30 },
      { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Lighting Fixtures');

    // Tab 2: Measurements (Linear Runs)
    const measurements: any[] = [];
    pages.forEach((page, pageIdx) => {
      page.objects.forEach(obj => {
        if (obj.type !== 'count' && obj.code) {
          const lengthFt = obj.lengthFt ?? obj.result?.baseLengthFt ?? 0;
          const emtSize = obj.result?.raceway?.emtSize || obj.measure?.emtSize || '';
          const racewayLf = obj.result?.raceway?.lengthFt || 0;

          measurements.push({
            Code: obj.code,
            Name: nameForCode(obj.code),
            Type: obj.type === 'segment' ? 'Segment' : obj.type === 'polyline' ? 'Polyline' : 'Freeform',
            'Length (LF)': lengthFt,
            'EMT Size': emtSize,
            'Raceway LF': racewayLf,
            Page: pageIdx + 1,
            Note: obj.note || ''
          });
        }
      });
    });

    measurements.sort((a, b) => a.Code.localeCompare(b.Code) || a.Page - b.Page);

    const totalLength = measurements.reduce((sum, m) => sum + (m['Length (LF)'] || 0), 0);
    const totalRaceway = measurements.reduce((sum, m) => sum + (m['Raceway LF'] || 0), 0);

    const measurementsData: any[][] = [
      [`Project:  ${projectName}`, '', '', '', '', '', '', ''],
      [],
      ['Code', 'Name', 'Type', 'Length (LF)', 'EMT Size', 'Raceway LF', 'Page', 'Note'],
      ...measurements.map(m => [
        m.Code,
        m.Name,
        m.Type,
        typeof m['Length (LF)'] === 'number' ? +m['Length (LF)'].toFixed(2) : '',
        m['EMT Size'],
        typeof m['Raceway LF'] === 'number' ? +m['Raceway LF'].toFixed(2) : '',
        m.Page,
        m.Note
      ]),
      ['Total', '', '', totalLength.toFixed(2), '', totalRaceway.toFixed(2), '', '']
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(measurementsData);
    ws2['!cols'] = [
      { wch: 10 },  // Code
      { wch: 30 },  // Name
      { wch: 12 },  // Type
      { wch: 12 },  // Length
      { wch: 10 },  // EMT Size
      { wch: 12 },  // Raceway LF
      { wch: 8 },   // Page
      { wch: 30 }   // Note
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Measurements');

    const baseName = projectName + ' - Fixtures';
    XLSX.writeFile(wb, `${baseName}.xlsx`);
  };

  /* NEW: small CSV downloader */
  function downloadCSV(filename: string, csv: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  /* NEW: CSV – Itemized with raceway/conductors/boxes */
  const exportCSVItemizedRaceway = () => {
    const rows = buildBOMRows(pages, 'itemized');
    const csv = toCSVItemizedWithRaceway(rows);
    const baseName = (useStore.getState().getProjectName()?.trim() || 'BOM') + ' - Itemized (Raceway).csv';
    downloadCSV(baseName, csv);
  };

  /* NEW: CSV – Summarized with raceway totals */
  const exportCSVSummarizedRaceway = () => {
    const rows = buildBOMRows(pages, 'summarized');
    const csv = toCSVSummarizedWithRaceway(rows);
    const baseName = (useStore.getState().getProjectName()?.trim() || 'BOM') + ' - Summarized (Raceway).csv';
    downloadCSV(baseName, csv);
  };

  /* NEW: Excel – Detailed measurements (itemized + summarized with raceway) */
  const exportExcelDetailedMeasurements = async () => {
    const XLSX = await ensureXLSX();
    const { calculateAssemblyMaterials } = await import('@/utils/assemblies');
    const { tags, assemblies } = useStore.getState();

    const itemRows = buildBOMRows(pages, 'itemized');
    const sumRows  = buildBOMRows(pages, 'summarized');

    // Build objects so numbers stay numeric in Excel
    const itemObjs = itemRows.map(r => {
      const c = r.conductors ?? [];
      const c1 = c[0] ?? { count: 0, size: '' };
      const c2 = c[1] ?? { count: 0, size: '' };
      const c3 = c[2] ?? { count: 0, size: '' };
      return {
        Tag: r.tagCode,
        Index: r.index ?? null,
        Shape: r.shape,
        Qty: r.qty,
        GeomLF: typeof r.lengthFt === 'number' ? +r.lengthFt.toFixed(2) : null,
        RacewayLF: typeof r.racewayLf === 'number' ? +r.racewayLf.toFixed(2) : null,
        ConductorLF: typeof r.conductorLfTotal === 'number' ? +r.conductorLfTotal.toFixed(2) : null,
        Boxes: typeof r.boxes === 'number' ? r.boxes : null,
        Points: typeof r.points === 'number' ? r.points : null,
        Cond1Count: c1.count || null,
        Cond1Size: c1.size || '',
        Cond2Count: c2.count || null,
        Cond2Size: c2.size || '',
        Cond3Count: c3.count || null,
        Cond3Size: c3.size || '',
        Page: r.pageIndex,
        Name: r.tagName || '',
        Category: r.category || '',
        Note: (r.note ?? '').toString().replace(/\n/g, ' ').trim(),
      };
    });

    const sumObjs = sumRows.map(r => ({
      Tag: r.tagCode,
      Shape: r.shape,
      Qty: r.qty,
      GeomLF: typeof r.lengthFt === 'number' ? +r.lengthFt.toFixed(2) : null,
      RacewayLF: typeof r.racewayLf === 'number' ? +r.racewayLf.toFixed(2) : null,
      ConductorLF: typeof r.conductorLfTotal === 'number' ? +r.conductorLfTotal.toFixed(2) : null,
      Boxes: typeof r.boxes === 'number' ? r.boxes : null,
      Name: r.tagName || '',
      Category: r.category || '',
    }));

    // Calculate assembly materials
    const assemblyMaterials = calculateAssemblyMaterials(pages, tags, assemblies);
    const assemblyObjs = assemblyMaterials.map(mat => ({
      Description: mat.description,
      Quantity: +mat.quantity.toFixed(2),
      Unit: mat.unit,
      Category: mat.category,
      Assembly: mat.assemblyCode + ' - ' + mat.assemblyName,
      Notes: mat.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemObjs), 'Measurements (Itemized)');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sumObjs),  'Measurements (Summarized)');

    // Add assembly materials sheet if there are any
    if (assemblyObjs.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assemblyObjs), 'Assembly Materials');
    }

    const base = useStore.getState().getProjectName()?.trim() || 'Measurements';
    XLSX.writeFile(wb, `${base} - Detailed Measurements.xlsx`);
  };

  /* =========================================================================================
     RENDER
     ========================================================================================= */
  return (
    <div className="app_root" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {/* FILE MENU BAR */}
      {!focusMode && <div style={{display:'flex', alignItems:'center', gap:12, padding:'8px 12px', background:'#0d3b66', color:'#fff', position:'sticky', top:0, zIndex:50}}>
        <div style={{position:'relative'}}>
          <button className="btn" style={{color:'#fff', borderColor:'#2d5c8f', background:'#124a85'}} onClick={()=>setFileMenuOpen(v=>!v)}>File ▾</button>
          {fileMenuOpen && (
            <div
              style={{
                position:'fixed',
                top:56, left:12, background:'#fff', color:'#111',
                border:'1px solid #ddd', borderRadius:6, boxShadow:'0 8px 28px rgba(0,0,0,.18)',
                width:240, zIndex:1000
              }}
              onMouseLeave={()=>setFileMenuOpen(false)}
            >
              <MenuItem label="New" onClick={()=>{setFileMenuOpen(false); doNewProject();}} />
              <MenuItem label="Open…" onClick={()=>{ setFileMenuOpen(false); projFileRef.current?.click(); }} />
              <MenuItem label="🗄️ Open from Database" onClick={async ()=>{ setFileMenuOpen(false); await doOpenFromDatabase(); }} />
              <MenuItem label="Add Sheet…" onClick={()=>{ setFileMenuOpen(false); addSheetRef.current?.click(); }} />
              <div style={{borderTop:'1px solid #eee'}} />
              <MenuItem label="Save" onClick={()=>{setFileMenuOpen(false); doSave();}} />
              <MenuItem label="💾 Save to Database" onClick={async ()=>{ setFileMenuOpen(false); await doSaveToDatabase(); }} />
              <MenuItem label="Save As…" onClick={()=>{setFileMenuOpen(false); doSaveAs();}} />
              <MenuItem label="Print" onClick={()=>{setFileMenuOpen(false); doPrint();}} />
              <div style={{borderTop:'1px solid #eee'}} />
              <MenuItem label="Close Project" onClick={()=>{setFileMenuOpen(false); doCloseProject();}} />
              <div style={{borderTop:'1px solid #eee'}} />
              <MenuItem label="📘 User Guide" onClick={()=>{setFileMenuOpen(false); setUserGuideOpen(true);}} />
            </div>
          )}
        </div>

        {/* Company + Project Name (click to rename) */}
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <div style={{fontSize:18, fontWeight:700}}>SKD Services</div>
          <div style={{opacity:.7, fontSize:18}}>·</div>
          <button
            title="Click to rename project"
            onClick={()=>{ const next = prompt('Project name:', headerProjectLabel); if (next != null) setProjectName(next.trim() || 'Untitled Project'); }}
            className="btn"
            style={{
              background:'transparent',
              border:'1px dashed rgba(255,255,255,.35)',
              color:'#fff',
              padding:'6px 12px',
              borderRadius:6,
              cursor:'pointer',
              fontWeight:600,
              fontSize:16,
              maxWidth:340,
              whiteSpace:'nowrap',
              overflow:'hidden',
              textOverflow:'ellipsis'
            }}
          >
            {headerProjectLabel}
          </button>
        </div>

        {/* hidden project file input (.skdproj) */}
        <input
          ref={projFileRef}
          type="file"
          accept=".skdproj,application/json"
          style={{display:'none'}}
          onChange={async (e)=>{ const input=e.currentTarget; const f=input.files?.[0]; input.value=''; if (f) await doOpenProject(f); }}
        />

        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap: 20}}>
          <span style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#fff',
            opacity: 0.9,
            textShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* quick open PDF right from the menu bar */}
        <input
          ref={pdfFileRef}
          type="file"
          accept="application/pdf"
          style={{display:'none'}}
          onChange={async (e)=>{ const input=e.currentTarget; const f=input.files?.[0]; input.value=''; if (f) await openPdf(f); }}
        />
        <input
          ref={addSheetRef}
          type="file"
          accept="application/pdf"
          style={{display:'none'}}
          onChange={async (e)=>{ const input=e.currentTarget; const f=input.files?.[0]; input.value=''; if (f) await addSheet(f); }}
        />
        <button className="btn" onClick={()=>pdfFileRef.current?.click()}>Open PDF</button>
        <span style={{marginLeft:8, maxWidth:320, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={pdfName || fileName}>
          {pdfName || fileName}
        </span>
        {/* Autosave Status Indicator */}
        {(pageCount > 0 || pages.length > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: lastSaveTime ? '#f0fdf4' : '#fef2f2',
              border: `2px solid ${lastSaveTime ? '#86efac' : '#fecaca'}`,
              borderRadius: 8,
              fontSize: '14px',
              fontWeight: 600,
              color: lastSaveTime ? '#15803d' : '#dc2626',
              marginLeft: 12,
              whiteSpace: 'nowrap'
            }}
            title={lastSaveTime ? `Last saved: ${(lastSaveTime instanceof Date ? lastSaveTime : new Date(lastSaveTime)).toLocaleString()}` : 'Not saved to database yet'}
          >
            <span style={{fontSize: '16px'}}>{lastSaveTime ? '☁️' : '⚠️'}</span>
            <span>{timeSinceLastSave || 'Not saved'}</span>
          </div>
        )}
        <button className="btn" onClick={()=>setSettingsOpen(true)} style={{marginLeft:'auto'}}>⚙️ Settings</button>
      </div>}

      {/* TOOLBAR (tools + zoom) */}
      <div className="toolbar" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderBottom:'1px solid #e6e6e6', position:'sticky', top: focusMode ? 0 : 48, background:'#fff', zIndex:40, flexWrap:'wrap'}}>
        {pageCount > 0 && (
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <button className="btn" onClick={()=>setActivePage(Math.max(0, activePage-1))} disabled={activePage<=0}>◀</button>
            <select className="btn" value={activePage} onChange={(e)=>setActivePage(parseInt(e.target.value,10))}>
              {Array.from({length: pageCount}, (_, i) => (
                <option key={i} value={i}>{i+1} — {pageLabels[i] || `Page ${i+1}`}</option>
              ))}
            </select>
            <button className="btn" onClick={()=>setActivePage(Math.min(pageCount-1, activePage+1))} disabled={activePage>=pageCount-1}>▶</button>
          </div>
        )}

        <div style={{flex:1}} />

        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <button className={`btn ${tool==='hand'?'active':''}`} onClick={()=>setTool('hand')}>Hand</button>
          <button className={`btn ${tool==='count'?'active':''}`} onClick={()=>setTool('count')}>Count</button>
          <button className={`btn ${tool==='segment'?'active':''}`} onClick={()=>setTool('segment')}>Measure</button>
          <button className={`btn ${tool==='polyline'?'active':''}`} onClick={()=>setTool('polyline')}>Polyline</button>
          <button className={`btn ${tool==='freeform'?'active':''}`} onClick={()=>setTool('freeform')}>Freeform</button>
          <button className={`btn ${tool==='calibrate'?'active':''}`} onClick={()=>setTool('calibrate')}>Calibrate</button>

          <span className="badge">Tag:</span>
          <input value={currentTag} onChange={(e)=>setCurrentTag(e.target.value.toUpperCase())} style={{width:60, padding:'.25rem .4rem'}} />

          <button className="btn" onClick={()=>setZoom(zoom*0.9)}>-</button>
          <span className="badge">{Math.round(zoom*100)}%</span>
          <button className="btn" onClick={()=>setZoom(zoom*1.1)}>+</button>

          {/* Focus Mode Toggle */}
          <button
            className="btn"
            onClick={() => setFocusMode(!focusMode)}
            style={{
              background: focusMode ? '#2563eb' : '#64748b',
              color: '#fff',
              fontWeight: 'bold',
              padding: '6px 12px',
              marginLeft: '8px'
            }}
            title={focusMode ? "Exit Focus Mode (show all toolbars)" : "Enter Focus Mode (maximize blueprint visibility)"}
          >
            {focusMode ? '🔍 Exit' : '🎯 Focus'}
          </button>
        </div>

        <div style={{flex:1}} />

        {!focusMode && <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
          <button className="btn" onClick={()=>setTagsOpen(true)}>Tags</button>
          <button className="btn" onClick={()=>setAssemblyPanelOpen(true)}>Assemblies</button>
          <button
            className="btn"
            onClick={runAIAnalysis}
            disabled={!pdf || aiAnalyzing}
            style={{background: aiAnalyzing ? '#9e9e9e' : '#667eea', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap'}}
          >
            {aiAnalyzing ? '⏳ Analyzing...' : '🤖 AI Scan Documents'}
          </button>
          {aiAnalysisResult && (
            <button
              className="btn"
              onClick={() => setAiAnalysisOpen(true)}
              style={{background:'#8b5cf6', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap'}}
              title="View previous AI scan results"
            >
              📊 View AI Results
            </button>
          )}
          <button className="btn" onClick={()=>setPricingPanelOpen(true)} style={{background:'#2e7d32', color:'#fff', fontWeight:'bold', whiteSpace:'nowrap'}}>💰 Pricing & Bidding</button>
          <button className="btn" onClick={exportExcelFull} style={{whiteSpace:'nowrap'}}>Export Excel (Full BOM)</button>
          <button className="btn" onClick={exportFixturesOnly} style={{whiteSpace:'nowrap'}}>Export Lighting Fixtures</button>
        </div>}
      </div>

      {/* PROJECT TAGS BAR */}
      <div className="quickbar" style={{display:'flex', alignItems:'center', gap:10, padding:'4px 12px', borderBottom:'1px solid #eee', position:'sticky', top: focusMode ? 48 : 96, background:'#fff', zIndex:30, overflow:'visible'}}>
        <button
          className="btn"
          onClick={() => setProjectTagsCollapsed(!projectTagsCollapsed)}
          title={projectTagsCollapsed ? "Expand project tags" : "Collapse project tags"}
          style={{padding: '4px 8px', minWidth: 'auto', fontSize: '12px'}}
        >
          {projectTagsCollapsed ? '▶' : '▼'}
        </button>
        <div className="label" style={{minWidth:90, fontWeight:700, fontSize: '13px'}}>Project Tags {projectTags.length > 0 && `(${projectTags.length})`}</div>

        {!projectTagsCollapsed && <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', flex:1}}>
          {projectTags.length === 0 && <span style={{color:'#777', fontSize: '12px'}}>None — add from Tag DB ▼</span>}
          {projectTags.map((t, index) => {
            const active = (t.code || '').toUpperCase() === (currentTag || '').toUpperCase();
            const isDragging = draggedTagIndex === index;
            const isDragOver = dragOverTagIndex === index;
            return (
              <button
                key={t.id}
                draggable
                onDragStart={() => handleTagDragStart(index)}
                onDragOver={(e) => handleTagDragOver(e, index)}
                onDragEnd={handleTagDragEnd}
                className={`btn ${active ? 'active' : ''}`}
                onClick={()=>{ setTool('count'); setCurrentTag(t.code); }}
                title={`${t.code} — ${t.name} (drag to reorder)`}
                style={{
                  display:'flex',
                  alignItems:'center',
                  gap:4,
                  position:'relative',
                  opacity: isDragging ? 0.5 : 1,
                  cursor: 'move',
                  outline: isDragOver ? '2px dashed #0066FF' : 'none',
                  outlineOffset: isDragOver ? '2px' : '0',
                  transition: 'opacity 0.2s, outline 0.2s',
                  padding: '4px 8px',
                  fontSize: '12px'
                }}
              >
                <span style={{width:16, height:16, borderRadius:3, border:'1px solid #444', background: (t.category || '').toLowerCase().includes('light') ? '#FFA500' : t.color}} />
                <span style={{minWidth:24, textAlign:'center', fontWeight: active ? 700 : 600}}>{t.code}</span>
                <span
                  onClick={(e)=>{ e.stopPropagation(); setProjectTags(list => list.filter(x => x.id !== t.id)); if (currentTag === t.code) setCurrentTag(''); }}
                  title="Remove from Project Tags"
                  style={{position:'absolute', top:-4, right:-4, width:16, height:16, lineHeight:'14px', textAlign:'center',
                          border:'1px solid #bbb', borderRadius:'50%', background:'#fff', cursor:'pointer', fontSize:10}}
                >×</span>
              </button>
            );
          })}
        </div>}

        {!projectTagsCollapsed && (
          <>
            <button className="btn" onClick={()=>setPickerOpen(v=>!v)} style={{padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap'}}>Add from DB</button>
            {projectTags.length > 0 && (
              <>
                <button
                  className="btn"
                  onClick={() => {
                    const categories = Array.from(new Set(projectTags.map(t => t.category).filter(Boolean))) as string[];
                    if (categories.length === 0) {
                      alert('No categories found in project tags.');
                      return;
                    }
                    const category = prompt(`Clear all tags from category:\n\nAvailable categories:\n${categories.join(', ')}\n\nEnter category name:`);
                    if (!category) return;
                    const normalizedInput = category.trim().toLowerCase();
                    const matchingCategory = categories.find(c => c.toLowerCase() === normalizedInput);
                    if (!matchingCategory) {
                      alert(`Category "${category}" not found in project tags.`);
                      return;
                    }
                    const countToRemove = projectTags.filter(t => t.category?.toLowerCase() === normalizedInput).length;
                    if (confirm(`Remove all ${countToRemove} tags from category "${matchingCategory}"?`)) {
                      setProjectTags(list => list.filter(t => t.category?.toLowerCase() !== normalizedInput));
                      if (projectTags.some(t => t.code === currentTag && t.category?.toLowerCase() === normalizedInput)) {
                        setCurrentTag('');
                      }
                    }
                  }}
                  title="Clear all tags from a specific category"
                  style={{padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap', background: '#f59e0b', color: '#fff'}}
                >
                  Clear by Category
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    if (confirm(`Remove all ${projectTags.length} tags from project?`)) {
                      setProjectTags([]);
                      setCurrentTag('');
                    }
                  }}
                  title="Clear all project tags"
                  style={{padding: '4px 10px', fontSize: '12px', whiteSpace: 'nowrap', background: '#dc2626', color: '#fff'}}
                >
                  Clear All
                </button>
              </>
            )}
          </>
        )}

        {pickerOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={()=>setPickerOpen(false)}
              style={{
                position:'fixed',
                top:0,
                left:0,
                right:0,
                bottom:0,
                background:'rgba(0,0,0,0.3)',
                zIndex:998
              }}
            />
            {/* Centered Modal */}
            <div
              style={{
                position:'fixed',
                top:'50%',
                left:'50%',
                transform:'translate(-50%, -50%)',
                background:'#fff',
                border:'1px solid #ddd',
                borderRadius:8,
                padding:20,
                width:'min(500px, calc(100vw - 40px))',
                zIndex:999,
                boxShadow:'0 8px 32px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{marginBottom:12, fontSize:16, fontWeight:700, color:'#0d3b66'}}>Add Tag from Database</div>
              {pickerGroups.length === 0 ? (
                <div style={{padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, marginBottom: 12}}>
                  <div style={{fontSize: 14, color: '#0369a1', marginBottom: 8}}>
                    ℹ️ All tags from your database are already in this project.
                  </div>
                  <div style={{fontSize: 13, color: '#075985'}}>
                    Open <strong>Tag Database</strong> (wrench icon) to create new tags or manage existing ones.
                  </div>
                </div>
              ) : null}
              <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                <select
                  className="btn"
                  value={pickerSel}
                  onChange={(e)=>setPickerSel(e.target.value)}
                  style={{flex:'1 1 200px', minWidth:200}}
                  disabled={pickerGroups.length === 0}
                >
                  <option value="">— Select tag —</option>
                  {pickerGroups.map(g => (
                    <optgroup key={g.category} label={g.category}>
                      {g.items.map(t => (
                        <option key={t.id} value={t.id}>{t.code} — {t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button
                  className="btn"
                  onClick={()=>{
                    const pick = flatPickerList.find(t => t.id === pickerSel);
                    if (!pick) return;
                    setProjectTags(list => (list.some(x => x.id === pick.id) ? list : [...list, pick]));
                    setCurrentTag(pick.code);
                    setTool('count');
                    setPickerSel('');
                    setPickerOpen(false);
                  }}
                  style={{background:'#0d6efd', color:'#fff', fontWeight:600}}
                  disabled={!pickerSel || pickerGroups.length === 0}
                >
                  Add
                </button>
                <button className="btn" title="Close" onClick={()=>setPickerOpen(false)}>Cancel</button>
              </div>
              <div style={{marginTop:12, fontSize:12, color:'#666', padding:8, background:'#f8f9fa', borderRadius:4}}>
                💡 Tip: Open "Tags" button to load the master database first.
              </div>
            </div>
          </>
        )}
      </div>

      {/* MAIN AREA: Sidebar (BOM) + Viewer */}
      <div className="viewer" style={{
        display:'grid',
        gridTemplateColumns: leftOpen ? 'min(320px, 30vw) 1fr' : '0 1fr',
        transition:'grid-template-columns .18s ease',
        minHeight:0, flex:1, position:'relative', overflow:'hidden'
      }}>
        {!leftOpen && (
          <button className="btn" onClick={()=>setLeftOpen(true)} style={{position:'absolute', top:8, left:8, zIndex:5}} title="Show sidebar">☰ BOM</button>
        )}

        <aside className="sidebar" style={{ borderRight:'1px solid #eee', overflow:'auto', opacity: leftOpen ? 1 : 0, pointerEvents: leftOpen ? 'auto' : 'none' }}>
          <SidebarBOM bom={bom} onToggle={()=>setLeftOpen(false)} />
        </aside>

        <div
          ref={viewerScrollRef}
          style={{
            position:'relative',
            overflow:'auto',
            whiteSpace:'nowrap',  // allow horizontal overflow for left/right panning
            cursor: panStateRef.current.active ? 'grabbing' : (tool === 'hand' ? 'grab' : 'default')
          }}
          onMouseDown={beginPan}
          onMouseMove={movePan}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onContextMenu={(e)=>{ if (tool === 'hand' || panStateRef.current.active) e.preventDefault(); }}
        >
          {!pdf && (
            <div style={{padding:'2rem'}}>
              <div className="drop" style={{border:'2px dashed #bbb', borderRadius:8, padding:'2rem', color:'#666', textAlign:'center'}}>
                Drop a PDF to begin or use the file picker.
              </div>
            </div>
          )}
          {pdf && (
            <div style={{ display: 'inline-block', width: 'max-content' }}>
              <PDFViewport pdf={pdf} />
            </div>
          )}
        </div>
      </div>

      <TagManager
        open={tagsOpen}
        onClose={()=>setTagsOpen(false)}
        onAddToProject={(t: Tag) => {
          setProjectTags(list => (list.some(x => x.id === t.id) ? list
            : [...list, { id: t.id, code: t.code, name: t.name, color: t.color, category: t.category }]));
          setCurrentTag(t.code);
          setTool('count');
          setTagsOpen(false);
        }}
      />

      {assemblyPanelOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setAssemblyPanelOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '8px',
              width: '95%',
              maxWidth: '1400px',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid #ddd',
                background: '#f8f9fa'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                Assembly Manager
              </h2>
              <button
                className="btn"
                onClick={() => setAssemblyPanelOpen(false)}
                style={{ padding: '4px 12px' }}
              >
                ✕ Close
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <AssemblyPanel />
            </div>
          </div>
        </div>
      )}

      {pricingPanelOpen && (
        <PricingPanel pages={pages} onClose={() => setPricingPanelOpen(false)} />
      )}

      {userGuideOpen && (
        <UserGuide onClose={() => setUserGuideOpen(false)} />
      )}

      {aiAnalysisOpen && aiAnalysisResult && (
        <AIAnalysisPanel
          analysis={aiAnalysisResult}
          onClose={() => setAiAnalysisOpen(false)}
          onExport={exportAIAnalysis}
        />
      )}

      {settingsOpen && (
        <SettingsPanel onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

function SidebarBOM({ bom, onToggle }:{
  bom: {
    totalTags: number; segLF: number; plLF: number; ffLF: number; totalLF: number;
    rows: { code:string; tags:number; meas:number; lf:number }[];
    calibratedCount: number; totalPages: number;
  };
  onToggle: () => void;
}) {
  const { pages, tags: storeTags, manualItems, addManualItem, deleteManualItem, assemblies } = useStore();
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set(['Lights', 'Receptacles', 'Switches', 'Panels']));
  const [showManualEntry, setShowManualEntry] = React.useState(false);
  const [newItem, setNewItem] = React.useState({
    description: '',
    quantity: 0,
    unit: 'EA',
    category: '',
    itemCode: '',
    notes: ''
  });

  // Predefined manual items (common items not typically on drawings)
  const manualItemTemplates = [
    { code: 'TRENCH-6X36', name: 'Trenching 6x36 per LF', unit: 'LF', category: 'Site Work' },
    { code: 'BACKHOE-HR', name: 'Backhoe Work per Hour', unit: 'HR', category: 'Site Work' },
    { code: 'XFMR-30KVA', name: '30 kVA Transformer', unit: 'EA', category: 'Transformers' },
    { code: 'XFMR-75KVA', name: '75 kVA Transformer', unit: 'EA', category: 'Transformers' },
    { code: 'XFMR-150KVA', name: '150 kVA Transformer', unit: 'EA', category: 'Transformers' },
    { code: 'XFMR-225KVA', name: '225 kVA Transformer', unit: 'EA', category: 'Transformers' },
    { code: 'XFMR-500KVA', name: '500 kVA Transformer', unit: 'EA', category: 'Transformers' },
    { code: 'DISC-200A', name: '200A Disconnect', unit: 'EA', category: 'Disconnects' },
    { code: 'DISC-400A', name: '400A Disconnect', unit: 'EA', category: 'Disconnects' },
    { code: 'EV-SINGLE', name: 'Single Unit EV Charger', unit: 'EA', category: 'EV & Generators' },
    { code: 'EV-DUAL', name: 'Dual Unit EV Charger', unit: 'EA', category: 'EV & Generators' },
    { code: 'GEN-INSTALL', name: 'Generator Installation', unit: 'EA', category: 'EV & Generators' },
    { code: 'POLE-LIGHT', name: 'Pole Light Complete', unit: 'EA', category: 'Site Lighting' },
    { code: 'PWR-POLE', name: 'Power Pole Installation', unit: 'EA', category: 'Site Lighting' },
    { code: 'STUDY-COORD', name: 'Coordination Study', unit: 'EA', category: 'Engineering' },
  ];

  const groupedTemplates = React.useMemo(() => {
    const groups: Record<string, typeof manualItemTemplates> = {};
    manualItemTemplates.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, []);

  const itemized = React.useMemo(() => {
    const allRows = buildBOMRows(pages, 'itemized');
    return allRows.filter(r => r.shape !== 'count');
  }, [pages]);

  // Group tags by category
  const categorizedTags = React.useMemo(() => {
    const groups = new Map<string, { code: string; tags: number; meas: number; lf: number; name: string }[]>();

    bom.rows.forEach(row => {
      const tag = storeTags.find(t => t.code === row.code);
      const category = tag?.category || 'Other';

      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push({
        code: row.code,
        tags: row.tags,
        meas: row.meas,
        lf: row.lf,
        name: tag?.name || row.code
      });
    });

    // Sort categories and items within each category
    const sortedCategories = Array.from(groups.entries()).sort((a, b) => {
      const order = ['Lights', 'Receptacles', 'Switches', 'Panels', 'Data/Comm', 'Fire Alarm', 'Equipment', 'Other'];
      const aIndex = order.indexOf(a[0]);
      const bIndex = order.indexOf(b[0]);
      if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0]);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return sortedCategories;
  }, [bom.rows, storeTags]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Lights': '💡',
      'Receptacles': '🔌',
      'Switches': '🔘',
      'Panels': '⚡',
      'Data/Comm': '📡',
      'Fire Alarm': '🔥',
      'Equipment': '⚙️',
      'Other': '📦'
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Lights': '#F97316',
      'Receptacles': '#3B82F6',
      'Switches': '#60A5FA',
      'Panels': '#2563EB',
      'Data/Comm': '#8B5CF6',
      'Fire Alarm': '#EF4444',
      'Equipment': '#10B981',
      'Other': '#6B7280'
    };
    return colors[category] || '#6B7280';
  };

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'10px 12px', position:'sticky', top:0, background:'#0d3b66', zIndex:2, borderBottom:'2px solid #124a85', color:'#fff'}}>
        <div style={{fontWeight:700, fontSize:16}}>📋 Live BOM Summary</div>
        <button className="btn" onClick={onToggle} style={{fontSize:14, padding:'4px 10px', color:'#fff', borderColor:'#2d5c8f', background:'#124a85'}} title="Hide sidebar">‹ Hide</button>
      </div>

      <div style={{padding:'12px'}}>
        {/* Calibration Status */}
        <div style={{padding:'10px 12px', marginBottom:12, background: bom.calibratedCount === bom.totalPages ? '#d4edda' : '#fff3cd', border:'1px solid ' + (bom.calibratedCount === bom.totalPages ? '#c3e6cb' : '#ffc107'), borderRadius:6, fontSize:14}}>
          <strong>Calibration:</strong> {bom.calibratedCount}/{bom.totalPages} pages
          {bom.calibratedCount < bom.totalPages && <span style={{color:'#856404'}}> ⚠️ Calibrate remaining pages</span>}
          {bom.calibratedCount === bom.totalPages && <span style={{color:'#155724'}}> ✓ All calibrated!</span>}
        </div>

        {/* Quick Totals Card */}
        <div style={{padding:'12px', marginBottom:16, background:'#f8f9fa', border:'1px solid #dee2e6', borderRadius:8}}>
          <div style={{marginBottom:8, fontWeight:700, fontSize:15, color:'#495057'}}>Project Totals</div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:6, fontSize:14}}>
            <div style={{color:'#6c757d'}}>Total Devices:</div><div style={{fontWeight:600}}>{bom.totalTags}</div>
            <div style={{color:'#6c757d'}}>Total Conduit:</div><div style={{fontWeight:600}}>{bom.totalLF.toFixed(0)} LF</div>
          </div>
        </div>

        {/* Categorized Tags */}
        <div style={{marginBottom:16}}>
          <div style={{marginBottom:10, fontWeight:700, fontSize:15, color:'#212529'}}>Devices by Category</div>

          {categorizedTags.length === 0 && (
            <div style={{padding:'20px', textAlign:'center', color:'#6c757d', fontSize:14, background:'#f8f9fa', borderRadius:6}}>
              No devices tagged yet. Start tagging to see your progress here!
            </div>
          )}

          {categorizedTags.map(([category, items]) => {
            const isExpanded = expandedCategories.has(category);
            const categoryTotal = items.reduce((sum, item) => sum + item.tags, 0);
            const color = getCategoryColor(category);

            return (
              <div key={category} style={{marginBottom:8, border:'1px solid #dee2e6', borderRadius:6, overflow:'hidden'}}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  style={{
                    width:'100%',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'space-between',
                    padding:'8px 10px',
                    background: isExpanded ? color : '#f8f9fa',
                    color: isExpanded ? '#fff' : '#212529',
                    border:'none',
                    cursor:'pointer',
                    fontSize:13,
                    fontWeight:600,
                    transition:'background 0.2s'
                  }}
                >
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span>{isExpanded ? '▾' : '▸'}</span>
                    <span>{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                  </div>
                  <div style={{
                    padding:'2px 8px',
                    background: isExpanded ? 'rgba(255,255,255,0.2)' : '#e9ecef',
                    color: isExpanded ? '#fff' : '#495057',
                    borderRadius:12,
                    fontSize:12,
                    fontWeight:700
                  }}>
                    {categoryTotal}
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div style={{background:'#fff'}}>
                    {items.map(item => (
                      <div
                        key={item.code}
                        style={{
                          display:'grid',
                          gridTemplateColumns:'80px 1fr 50px',
                          gap:8,
                          padding:'6px 10px',
                          borderTop:'1px solid #f1f3f5',
                          fontSize:12,
                          alignItems:'center'
                        }}
                      >
                        <div style={{fontWeight:700, color}}>{item.code}</div>
                        <div style={{color:'#6c757d', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={item.name}>
                          {item.name}
                        </div>
                        <div style={{textAlign:'right', fontWeight:600, color:'#212529'}}>{item.tags}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Manual Items (not on drawing) */}
        <div style={{marginBottom:16, padding:'12px', background:'#f8f9fa', border:'1px solid #dee2e6', borderRadius:8}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontWeight:700, fontSize:15, color:'#495057'}}>Manual Items</div>
            <button
              className="btn"
              onClick={() => {
                setShowManualEntry(!showManualEntry);
                if (!showManualEntry) {
                  setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                }
              }}
              style={{fontSize:12, padding:'4px 8px', background:'#10b981', color:'white', border:'none', borderRadius:4}}
            >
              + Add
            </button>
          </div>

          {showManualEntry && (
            <div style={{padding:10, background:'#fff', border:'1px solid #dee2e6', borderRadius:6, marginBottom:10}}>
              <div style={{marginBottom:8}}>
                <label style={{display:'block', fontSize:11, fontWeight:600, color:'#495057', marginBottom:4}}>
                  Select Item (with pricing)
                </label>
                <select
                  value={newItem.itemCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    if (code) {
                      const template = manualItemTemplates.find(t => t.code === code);
                      if (template) {
                        setNewItem({
                          ...newItem,
                          itemCode: code,
                          description: template.name,
                          unit: template.unit,
                          category: template.category
                        });
                      }
                    } else {
                      setNewItem({...newItem, itemCode: '', description: '', unit: 'EA'});
                    }
                  }}
                  style={{width:'100%', padding:'6px 8px', border:'1px solid #ced4da', borderRadius:4, fontSize:13, marginBottom:8}}
                >
                  <option value="">-- Select Common Item --</option>
                  {Object.entries(groupedTemplates).map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map(item => (
                        <option key={item.code} value={item.code}>{item.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div style={{marginBottom:8}}>
                <label style={{display:'block', fontSize:11, fontWeight:600, color:'#495057', marginBottom:4}}>
                  Description (or customize)
                </label>
                <input
                  type="text"
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                  style={{width:'100%', padding:'6px 8px', border:'1px solid #ced4da', borderRadius:4, fontSize:13}}
                />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8}}>
                <div>
                  <label style={{display:'block', fontSize:11, fontWeight:600, color:'#495057', marginBottom:4}}>
                    Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({...newItem, quantity: parseFloat(e.target.value) || 0})}
                    style={{width:'100%', padding:'6px 8px', border:'1px solid #ced4da', borderRadius:4, fontSize:13}}
                  />
                </div>
                <div>
                  <label style={{display:'block', fontSize:11, fontWeight:600, color:'#495057', marginBottom:4}}>
                    Unit
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    style={{width:'100%', padding:'6px 8px', border:'1px solid #ced4da', borderRadius:4, fontSize:13}}
                  >
                    <option value="EA">EA</option>
                    <option value="LF">LF</option>
                    <option value="HR">HR</option>
                    <option value="LS">LS</option>
                    <option value="SF">SF</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex', gap:6}}>
                <button
                  className="btn"
                  onClick={() => {
                    if (newItem.description && newItem.quantity > 0) {
                      addManualItem(newItem);
                      setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                      setShowManualEntry(false);
                    } else {
                      alert('Please enter description and quantity');
                    }
                  }}
                  style={{flex:1, padding:'6px', fontSize:12, background:'#10b981', color:'white', border:'none', borderRadius:4}}
                >
                  Save
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setShowManualEntry(false);
                    setNewItem({description:'',quantity:0,unit:'EA',category:'',itemCode:'',notes:''});
                  }}
                  style={{flex:1, padding:'6px', fontSize:12, background:'#6c757d', color:'white', border:'none', borderRadius:4}}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {manualItems.length > 0 ? (
            <div style={{marginTop:10}}>
              {manualItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display:'flex',
                    justifyContent:'space-between',
                    alignItems:'center',
                    padding:'8px',
                    marginBottom:6,
                    background:'#fff',
                    border:'1px solid #dee2e6',
                    borderRadius:4,
                    fontSize:13
                  }}
                >
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600, marginBottom:2}}>
                      {item.description}
                      {item.itemCode && <span style={{marginLeft:6, fontSize:11, color:'#10b981', fontWeight:500}}>({item.itemCode})</span>}
                    </div>
                    <div style={{fontSize:12, color:'#6c757d'}}>{item.quantity} {item.unit}</div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => deleteManualItem(item.id)}
                    style={{padding:'4px 8px', fontSize:11, background:'#dc3545', color:'white', border:'none', borderRadius:4}}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{fontSize:12, color:'#6c757d', textAlign:'center', padding:'10px'}}>
              No manual items. Select from dropdown for items with pricing (trenching, transformers, etc.)
            </div>
          )}
        </div>

        {/* NEW: Itemized Measurements */}
        <div style={{padding:'0 0 20px 0'}}>
          <div style={{marginBottom:8, fontWeight:600}}>Itemized Measurements</div>
          <div style={{fontSize:12, overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
              <thead>
                <tr style={{borderBottom:'1px solid #eee', background:'#f8f8f8'}}>
                  <th style={{textAlign:'left', padding:'4px 2px', minWidth:50}}>Run</th>
                  <th style={{textAlign:'left', padding:'4px 2px', minWidth:45}}>EMT</th>
                  <th style={{textAlign:'left', padding:'4px 2px', minWidth:100}}>Wire</th>
                  <th style={{textAlign:'right', padding:'4px 2px', minWidth:40}}>LF</th>
                  <th style={{textAlign:'right', padding:'4px 2px', minWidth:35}}>Pg</th>
                </tr>
              </thead>
              <tbody>
                {itemized.map(r => {
                  const c = r.conductors ?? [];
                  const wireSpec = c.filter(w => w.count > 0).map(w =>
                    `${w.count} ${w.size}`.trim()
                  ).join(', ');

                  return (
                    <tr key={r.id} style={{borderBottom:'1px solid #f3f3f3'}}>
                      <td style={{padding:'4px 2px', fontWeight:600}}>{r.tagCode}-{r.index}</td>
                      <td style={{padding:'4px 2px', fontSize:11}}>{r.emtSize || '—'}</td>
                      <td style={{padding:'4px 2px', fontSize:11}}>{wireSpec || '—'}</td>
                      <td style={{padding:'4px 2px', textAlign:'right'}}>{typeof r.racewayLf === 'number' ? r.racewayLf.toFixed(1) : '0'}</td>
                      <td style={{padding:'4px 2px', textAlign:'right'}}>{r.pageIndex + 1}</td>
                    </tr>
                  );
                })}
                {itemized.length === 0 && (
                  <tr><td colSpan={5} style={{padding:'10px', color:'#666'}}>No measurements yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuItem({label, onClick}:{label:string; onClick:()=>void}) {
  return (
    <div onClick={onClick} style={{padding:'10px 14px', cursor:'pointer'}} onKeyDown={(e)=>{ if (e.key==='Enter') onClick(); }} tabIndex={0}>
      {label}
    </div>
  );
}