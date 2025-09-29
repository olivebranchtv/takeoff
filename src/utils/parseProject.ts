// src/utils/parseProject.ts
// Safe parser + migrator for .skdproj files (legacy + current)

export type ProjectPage = {
  pageIndex: number;
  scale?: number | null;
  calibrated?: boolean;
};

export type ProjectSave = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
  pages: ProjectPage[];
  tags: any[];          // keep wide to avoid import coupling
  objects: any[];
  measurements: any[];
};

type AnyJson = Record<string, any>;

function coerceArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function coercePage(p: any, idx: number): ProjectPage {
  const pageIndex =
    typeof p?.pageIndex === 'number'
      ? p.pageIndex
      : typeof p?.index === 'number'
        ? p.index
        : Number(idx) || 0;

  const scale =
    typeof p?.scale === 'number'
      ? p.scale
      : p?.scale == null
        ? null
        : Number(p.scale) || null;

  const calibrated =
    typeof p?.calibrated === 'boolean'
      ? p.calibrated
      : !!p?.isCalibrated;

  return { pageIndex, scale, calibrated };
}

export async function parseSkdProject(fileOrJson: File | string): Promise<ProjectSave> {
  let text: string;

  if (typeof fileOrJson === 'string') {
    text = fileOrJson;
  } else {
    text = await fileOrJson.text();
  }

  let raw: AnyJson;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid .skdproj: not JSON");
  }

  // Legacy → modern keys
  const name =
    typeof raw.name === 'string'
      ? raw.name
      : typeof raw.projectName === 'string'
        ? raw.projectName
        : 'Untitled Project';

  const id =
    typeof raw.id === 'string'
      ? raw.id
      : (crypto?.randomUUID?.() ?? String(Date.now()));

  const pagesSrc = raw.pages ?? raw.sheets ?? [];
  const tagsSrc = raw.tags ?? raw.tagList ?? [];
  const objectsSrc = raw.objects ?? raw.items ?? [];
  const measSrc = raw.measurements ?? raw.meas ?? [];

  const pages = coerceArray(pagesSrc).map(coercePage);
  const tags = coerceArray(tagsSrc);
  const objects = coerceArray(objectsSrc);
  const measurements = coerceArray(measSrc);

  return {
    id,
    name,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    version: typeof raw.version === 'string' ? raw.version : undefined,
    pages,
    tags,
    objects,
    measurements,
  };
}
