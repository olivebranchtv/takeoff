import type { Tag, ManualItem, Assembly } from '@/types';
export type BOMRow = {
  id?: string; code: string; description: string; quantity: number; unit: string;
  category?: string; itemCode?: string; laborHours?: number; materialCost?: number;
  notes?: string; tagCode?: string; tagName?: string; shape?: string; qty?: number;
  lengthFt?: number; racewayLf?: number; conductorLfTotal?: number; boxes?: number;
  points?: number; pageIndex?: number; index?: number; conductors?: any[];
  emtSize?: string; assemblyCode?: string; assemblyName?: string;
};
export function buildBOMRows(pages: any[], tags: Tag[], assemblies: Assembly[], manualItems: ManualItem[]): BOMRow[] {
  return [];
}
export function toCSVItemizedWithRaceway(pages: any[], tags: Tag[]): string { return ''; }
export function toCSVSummarizedWithRaceway(pages: any[], tags: Tag[]): string { return ''; }
