import type { Tag, AnyTakeoffObject, Assembly, ManualItem } from '@/types';

export type BOMRow = {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
  itemCode?: string;
  laborHours?: number;
  materialCost?: number;
  notes?: string;
};

export function buildBOMRows(
  objects: AnyTakeoffObject[],
  tags: Tag[],
  assemblies: Assembly[],
  manualItems: ManualItem[]
): BOMRow[] {
  const rows: BOMRow[] = [];

  for (const obj of objects) {
    if (obj.type === 'count' && obj.code) {
      const tag = tags.find((t) => t.code === obj.code);
      if (tag) {
        const existing = rows.find((r) => r.code === tag.code);
        if (existing) {
          existing.quantity += 1;
        } else {
          rows.push({
            code: tag.code,
            description: tag.name,
            quantity: 1,
            unit: 'EA',
            category: tag.category,
          });
        }
      }
    }
  }

  for (const item of manualItems) {
    rows.push({
      code: item.id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      itemCode: item.itemCode,
      notes: item.notes,
    });
  }

  return rows;
}

export function toCSVItemizedWithRaceway(rows: BOMRow[]): string {
  const header = 'Code,Description,Quantity,Unit,Category\n';
  const lines = rows.map(
    (r) =>
      `${r.code},${r.description},${r.quantity},${r.unit},${r.category || ''}`
  );
  return header + lines.join('\n');
}

export function toCSVSummarizedWithRaceway(rows: BOMRow[]): string {
  const summarized = new Map<string, BOMRow>();

  for (const row of rows) {
    const key = row.code;
    const existing = summarized.get(key);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      summarized.set(key, { ...row });
    }
  }

  const header = 'Code,Description,Quantity,Unit,Category\n';
  const lines = Array.from(summarized.values()).map(
    (r) =>
      `${r.code},${r.description},${r.quantity},${r.unit},${r.category || ''}`
  );
  return header + lines.join('\n');
}
