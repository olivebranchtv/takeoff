import * as XLSX from 'xlsx';
import type { Tag, Assembly } from '@/types';

export async function exportToExcelWithPricing(
  tags: Tag[],
  assemblies: Assembly[],
  projectName: string
): Promise<void> {
  const wb = XLSX.utils.book_new();

  const wsData = [
    ['Project Name:', projectName],
    [],
    ['Code', 'Description', 'Quantity', 'Unit', 'Material Cost', 'Labor Hours'],
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'BOM');

  XLSX.writeFile(wb, `${projectName} - BOM.xlsx`);
}
