import type { Assembly, AssemblyItem, Tag, PageState, CountObject } from '@/types';

export type AssemblyMaterialLine = {
  description: string;
  unit: string;
  quantity: number;
  category: string;
  assemblyCode: string;
  assemblyName: string;
  notes?: string;
};

export function calculateAssemblyMaterials(
  pages: PageState[],
  tags: Tag[],
  assemblies: Assembly[]
): AssemblyMaterialLine[] {
  const materials: AssemblyMaterialLine[] = [];
  const assemblyMap = new Map(assemblies.map(a => [a.id, a]));
  const tagMap = new Map(tags.map(t => [t.code, t]));

  pages.forEach(page => {
    page.objects.forEach(obj => {
      if (obj.type === 'count') {
        const countObj = obj as CountObject;
        const tag = tagMap.get(countObj.code);

        if (tag?.assemblyId) {
          const assembly = assemblyMap.get(tag.assemblyId);

          if (assembly && assembly.isActive) {
            assembly.items.forEach(item => {
              const adjustedQty = item.quantityPer * item.wasteFactor;

              materials.push({
                description: item.description,
                unit: item.unit,
                quantity: adjustedQty,
                category: item.category,
                assemblyCode: assembly.code,
                assemblyName: assembly.name,
                notes: item.notes
              });
            });
          }
        }
      }
    });
  });

  return aggregateMaterials(materials);
}

function aggregateMaterials(materials: AssemblyMaterialLine[]): AssemblyMaterialLine[] {
  const aggregated = new Map<string, AssemblyMaterialLine>();

  materials.forEach(mat => {
    const key = `${mat.description}|${mat.unit}|${mat.category}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.quantity += mat.quantity;
    } else {
      aggregated.set(key, { ...mat });
    }
  });

  return Array.from(aggregated.values()).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.description.localeCompare(b.description);
  });
}

export function getAssemblyForTag(tag: Tag, assemblies: Assembly[]): Assembly | undefined {
  if (!tag.assemblyId) return undefined;
  return assemblies.find(a => a.id === tag.assemblyId && a.isActive);
}

export function getTotalAssemblyCount(pages: PageState[], assemblyId: string): number {
  let count = 0;

  pages.forEach(page => {
    page.objects.forEach(obj => {
      if (obj.type === 'count') {
        const countObj = obj as CountObject;
        count++;
      }
    });
  });

  return count;
}
