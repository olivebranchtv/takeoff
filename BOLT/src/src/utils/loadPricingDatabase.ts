/**
 * Load pricing data from SKD Estimating Database Excel file
 */

import type { MaterialPrice } from './pricing';

export interface SKDPricingRow {
  category?: string;
  description?: string;
  unit?: string;
  cost?: number;
  laborHours?: number;
  vendor?: string;
  partNumber?: string;
}

/**
 * Parse SKD Estimating Database from Excel
 */
export async function loadSKDPricingDatabase(filePath: string): Promise<MaterialPrice[]> {
  try {
    const XLSX = await import('xlsx');
    const workbook = XLSX.readFile(filePath);

    const materialPrices: MaterialPrice[] = [];

    // Try to find pricing sheet (common names)
    const sheetNames = ['Material Pricing', 'Pricing', 'Materials', 'Costs', workbook.SheetNames[0]];
    let sheet = null;

    for (const name of sheetNames) {
      if (workbook.Sheets[name]) {
        sheet = workbook.Sheets[name];
        break;
      }
    }

    if (!sheet) {
      throw new Error('Could not find pricing sheet in Excel file');
    }

    // Convert sheet to JSON
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    // Parse each row
    for (const row of rows) {
      // SKD Database uses: name, category, unit_cost, labor_unit_s..., supplier, description
      const name = row['name'] || row['Name'] || '';
      const category =
        row['category'] || row['Category'] || row['Division'] ||
        row['Type'] || row['GROUP'] || '';

      const description =
        row['description'] || row['Description'] || row['name'] || row['Name'] ||
        row['Item'] || row['Material'] || row['DESCRIPTION'] || '';

      const unit =
        row['unit'] || row['Unit'] || row['UOM'] || row['U/M'] || 'EA';

      // SKD uses 'unit_cost' column
      const cost =
        parseFloat(row['unit_cost'] || row['unit cost'] || row['Unit Cost'] ||
        row['Cost'] || row['cost'] || row['Price'] ||
        row['COST'] || row['Material Cost'] || row['$'] || '0');

      // SKD uses 'labor_unit_s...' column (might be truncated)
      const laborHours =
        parseFloat(row['labor_unit_s'] || row['labor_unit_supply'] || row['labor_unit_supplier'] ||
        row['Labor Hours'] || row['Labor Hrs'] || row['Hours'] ||
        row['Install Hours'] || row['Installation Time'] || row['Hrs'] || '0');

      const vendor =
        row['supplier'] || row['Supplier'] || row['Vendor'] || row['vendor'] || '';

      const partNumber =
        row['Part Number'] || row['Part #'] || row['SKU'] || row['Item #'] || '';

      // Skip header rows and empty rows
      if (!description || description.toLowerCase().includes('description') ||
          description.toLowerCase().includes('item') ||
          description.toLowerCase().includes('name')) {
        continue;
      }

      if (cost > 0 || laborHours > 0) {
        materialPrices.push({
          category: String(category),
          description: String(description),
          unit: String(unit),
          materialCost: cost,
          laborHours: laborHours > 0 ? laborHours : undefined,
          vendor: vendor ? String(vendor) : undefined,
          vendorPartNumber: partNumber ? String(partNumber) : undefined
        });
      }
    }

    return materialPrices;
  } catch (error) {
    console.error('Error loading SKD database:', error);
    throw error;
  }
}

/**
 * Load from in-memory workbook (for uploaded files)
 */
export function parseSKDWorkbook(workbook: any): MaterialPrice[] {
  const materialPrices: MaterialPrice[] = [];

  // Try to find pricing sheet
  const sheetNames = ['Material Pricing', 'Pricing', 'Materials', 'Costs', workbook.SheetNames[0]];
  let sheet = null;

  for (const name of sheetNames) {
    if (workbook.Sheets[name]) {
      sheet = workbook.Sheets[name];
      break;
    }
  }

  if (!sheet) {
    console.warn('Could not find pricing sheet, using first sheet');
    sheet = workbook.Sheets[workbook.SheetNames[0]];
  }

  // Load XLSX utils
  const XLSX = (window as any).XLSX;
  if (!XLSX) {
    throw new Error('XLSX library not loaded');
  }

  // Convert sheet to JSON
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  // Parse each row
  for (const row of rows) {
    // SKD Database uses: name, category, unit_cost, labor_unit_s..., supplier, description
    const name = row['name'] || row['Name'] || '';
    const category =
      row['category'] || row['Category'] || row['Division'] ||
      row['Type'] || row['GROUP'] || '';

    const description =
      row['description'] || row['Description'] || row['name'] || row['Name'] ||
      row['Item'] || row['Material'] || row['DESCRIPTION'] || '';

    const unit =
      row['unit'] || row['Unit'] || row['UOM'] || row['U/M'] || 'EA';

    // SKD uses 'unit_cost' column
    const cost =
      parseFloat(row['unit_cost'] || row['unit cost'] || row['Unit Cost'] ||
      row['Cost'] || row['cost'] || row['Price'] ||
      row['COST'] || row['Material Cost'] || row['$'] || '0');

    // SKD uses 'labor_unit_s...' column (might be truncated like labor_unit_s...)
    const laborHours =
      parseFloat(row['labor_unit_s'] || row['labor_unit_supply'] || row['labor_unit_supplier'] ||
      row['Labor Hours'] || row['Labor Hrs'] || row['Hours'] ||
      row['Install Hours'] || row['Installation Time'] || row['Hrs'] || '0');

    const vendor =
      row['supplier'] || row['Supplier'] || row['Vendor'] || row['vendor'] || '';

    const partNumber =
      row['Part Number'] || row['Part #'] || row['SKU'] || row['Item #'] || '';

    // Skip header rows and empty rows
    if (!description || description.toLowerCase().includes('description') ||
        description.toLowerCase().includes('item') ||
        description.toLowerCase().includes('name')) {
      continue;
    }

    if (cost > 0 || laborHours > 0) {
      materialPrices.push({
        category: String(category),
        description: String(description),
        unit: String(unit),
        materialCost: cost,
        laborHours: laborHours > 0 ? laborHours : undefined,
        vendor: vendor ? String(vendor) : undefined,
        vendorPartNumber: partNumber ? String(partNumber) : undefined
      });
    }
  }

  return materialPrices;
}