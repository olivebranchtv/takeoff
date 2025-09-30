/**
 * Professional Electrical BOM Excel Export
 * Industry-standard format for commercial electrical estimating
 */

import type { PageState, Tag, Assembly } from '@/types';
import { buildBOMRows, type BomRow } from './bom';
import { loadMaterialPricingFromSupabase } from './supabasePricing';

export interface MaterialLine {
  category: string;
  description: string;
  unit: string;
  quantity: number;
  wasteFactor: number;
  totalQty: number;
  assemblyCode?: string;
  assemblyName?: string;
  notes?: string;
}

export interface AssemblyUsage {
  code: string;
  name: string;
  description: string;
  count: number;
  materials: MaterialLine[];
}

/**
 * Calculate assembly materials with waste factors applied
 */
export function calculateAssemblyMaterials(
  pages: PageState[],
  tags: Tag[],
  assemblies: Assembly[]
): { materials: MaterialLine[]; assemblyUsage: AssemblyUsage[] } {
  const tagMap = new Map(tags.map(t => [t.code.toUpperCase(), t]));
  const assemblyMap = new Map(assemblies.map(a => [a.id, a]));
  const assemblyUsage: AssemblyUsage[] = [];
  const materialAcc: Map<string, MaterialLine> = new Map();

  // Build summary of tag counts
  const bomRows = buildBOMRows(pages, 'summarized').filter(r => r.shape === 'count');

  for (const row of bomRows) {
    const tag = tagMap.get(row.tagCode);
    if (!tag || !tag.assemblyId) continue;

    const assembly = assemblyMap.get(tag.assemblyId);
    if (!assembly || !assembly.isActive) continue;

    const count = row.qty;

    // Track assembly usage
    const usage: AssemblyUsage = {
      code: assembly.code,
      name: assembly.name,
      description: assembly.description,
      count,
      materials: []
    };

    // Calculate materials for this assembly instance
    for (const item of assembly.items) {
      const baseQty = item.quantityPer * count;
      const totalQty = baseQty * item.wasteFactor;

      const matKey = `${item.category}::${item.description}::${item.unit}`;
      const existing = materialAcc.get(matKey);

      if (existing) {
        existing.quantity += baseQty;
        existing.totalQty += totalQty;
      } else {
        materialAcc.set(matKey, {
          category: item.category,
          description: item.description,
          unit: item.unit,
          quantity: baseQty,
          wasteFactor: item.wasteFactor,
          totalQty,
          assemblyCode: assembly.code,
          assemblyName: assembly.name,
          notes: item.notes
        });
      }

      // Add to usage tracking
      usage.materials.push({
        category: item.category,
        description: item.description,
        unit: item.unit,
        quantity: baseQty,
        wasteFactor: item.wasteFactor,
        totalQty,
        notes: item.notes
      });
    }

    assemblyUsage.push(usage);
  }

  // ============================================================================
  // ADD RACEWAY AND WIRE MATERIALS FROM HOME RUNS
  // ============================================================================
  const racewayRows = buildBOMRows(pages, 'summarized').filter(r => r.shape !== 'count');

  for (const row of racewayRows) {
    // Add conduit/raceway if EMT size specified
    if (row.emtSize && row.racewayLf && row.racewayLf > 0) {
      // Format to match database exactly: "3/4"EMT Conduit" (no space after closing quote)
      const emtDesc = `${row.emtSize}EMT Conduit`;
      const matKey = `EMT CONDUIT::${emtDesc}::EA`;
      const existing = materialAcc.get(matKey);

      if (existing) {
        existing.quantity += row.racewayLf;
        existing.totalQty += row.racewayLf * existing.wasteFactor;
      } else {
        materialAcc.set(matKey, {
          category: 'EMT CONDUIT',
          description: emtDesc,
          unit: 'EA',
          quantity: row.racewayLf,
          wasteFactor: 1.05,
          totalQty: row.racewayLf * 1.05,
          assemblyCode: 'RACEWAY',
          assemblyName: 'Conduit Run'
        });
      }
    }

    // Add wire/conductors
    if (row.conductors && Array.isArray(row.conductors)) {
      for (const cond of row.conductors) {
        if (!cond.count || !cond.size || cond.count === 0) continue;

        // Calculate conductor length for this group
        const condLf = row.racewayLf || 0;
        const totalCondLf = cond.count * condLf;

        if (totalCondLf <= 0) continue;

        // Format wire description to match database exactly
        // Standard: #14, #12, #10 use Stranded for flexibility; #8+ always Stranded
        const wireType = 'Str'; // Use stranded by default (industry standard for branch circuits)
        const wireDesc = `${cond.size} THHN Copper Wire,${wireType}`;
        const matKey = `wire::${wireDesc}::EA`;
        const existing = materialAcc.get(matKey);

        if (existing) {
          existing.quantity += totalCondLf;
          existing.totalQty += totalCondLf * existing.wasteFactor;
        } else {
          materialAcc.set(matKey, {
            category: 'wire',
            description: wireDesc,
            unit: 'EA',
            quantity: totalCondLf,
            wasteFactor: 1.10,
            totalQty: totalCondLf * 1.10,
            assemblyCode: 'WIRE',
            assemblyName: 'Conductor Pull'
          });
        }
      }
    }
  }

  return {
    materials: Array.from(materialAcc.values()),
    assemblyUsage
  };
}

/**
 * Build professional BOM Excel workbook
 */
export async function exportProfessionalBOM(
  pages: PageState[],
  tags: Tag[],
  assemblies: Assembly[],
  projectName: string,
  fileName: string
) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  // Load pricing from Supabase
  const pricingData = await loadMaterialPricingFromSupabase();
  const priceMap = new Map<string, { cost: number; laborHours: number }>();
  const pricingArray: Array<{ category: string; description: string; cost: number; laborHours: number }> = [];

  if (pricingData && pricingData.length > 0) {
    pricingData.forEach(p => {
      const key = `${p.category}::${p.description}`;
      // Convert to number explicitly (Postgres may return as string)
      const cost = typeof p.material_cost === 'string' ? parseFloat(p.material_cost) : (p.material_cost || 0);
      const laborHours = typeof p.labor_hours === 'string' ? parseFloat(p.labor_hours) : (p.labor_hours || 0);

      const priceInfo = {
        cost: isNaN(cost) ? 0 : cost,
        laborHours: isNaN(laborHours) ? 0 : laborHours
      };
      priceMap.set(key, priceInfo);

      // Also store for fuzzy matching
      pricingArray.push({
        category: p.category,
        description: p.description,
        cost: priceInfo.cost,
        laborHours: priceInfo.laborHours
      });
    });
  }

  console.log(`Loaded ${pricingData?.length || 0} pricing records from database`);

  // Fuzzy matcher - finds closest match in database
  function findPrice(category: string, description: string): { cost: number; laborHours: number } {
    // Try exact match first
    const exactKey = `${category}::${description}`;
    const exact = priceMap.get(exactKey);
    if (exact && (exact.cost > 0 || exact.laborHours > 0)) {
      console.log(`✓ Exact match for ${category}::${description} = $${exact.cost}`);
      return exact;
    }

    // Normalize for fuzzy matching
    const normDesc = description.toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .trim();

    // Find matches in same category by checking if database description contains key terms
    const keyTerms = normDesc.split(/[,\/]/).filter(t => t.length > 2);

    const candidates = pricingArray.filter(p => {
      if (p.category !== category) return false;
      const dbDesc = p.description.toLowerCase().replace(/["']/g, '').replace(/\s+/g, '').replace(/-/g, '');
      // Check if database description contains assembly key terms
      return keyTerms.some(term => dbDesc.includes(term));
    });

    // Return first match with pricing
    const match = candidates.find(c => c.cost > 0 || c.laborHours > 0);
    if (match) {
      console.log(`✓ Fuzzy match for ${description} → ${match.description} = $${match.cost}`);
      return { cost: match.cost, laborHours: match.laborHours };
    }

    console.log(`✗ No match for ${category}::${description}`);
    return { cost: 0, laborHours: 0 };
  }

  // Get all data
  const itemizedRows = buildBOMRows(pages, 'itemized');
  const summarizedRows = buildBOMRows(pages, 'summarized');
  const { materials, assemblyUsage } = calculateAssemblyMaterials(pages, tags, assemblies);
  const tagMap = new Map(tags.map(t => [t.code.toUpperCase(), t]));

  // ============================================================================
  // SHEET 1: COVER SHEET
  // ============================================================================
  const coverData = [
    ['ELECTRICAL TAKEOFF BILL OF MATERIALS'],
    [''],
    ['Project Name:', projectName || 'Untitled Project'],
    ['Drawing Set:', fileName || 'N/A'],
    ['Date:', new Date().toLocaleDateString()],
    [''],
    ['SCOPE OF WORK'],
    ['This takeoff includes all electrical devices, fixtures, panels, and associated materials'],
    ['measured from the provided drawing set. Quantities are calculated using industry-standard'],
    ['assemblies with appropriate waste factors applied per NEC and local code requirements.'],
    [''],
    ['EXCLUSIONS'],
    ['- Engineering, design, and stamped drawings'],
    ['- Permits, fees, and inspections'],
    ['- Trenching, concrete, and structural work'],
    ['- Equipment pads and housekeeping pads'],
    ['- Final connections and commissioning'],
    ['- As-built documentation'],
    [''],
    ['NOTES'],
    ['- All quantities are based on plan takeoff only'],
    ['- Verify all dimensions and device types in field'],
    ['- Waste factors: Devices 2%, Fittings 5%, Wire 10%, Panels 0%'],
    ['- Material specifications subject to approval'],
  ];

  const coverSheet = XLSX.utils.aoa_to_sheet(coverData);
  // Set column widths
  coverSheet['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, coverSheet, 'Cover Sheet');

  // ============================================================================
  // SHEET 2: SUMMARY BY CATEGORY
  // ============================================================================
  const categorySummary: Record<string, { count: number; description: string }> = {};

  for (const row of summarizedRows.filter(r => r.shape === 'count')) {
    const tag = tagMap.get(row.tagCode);
    const category = tag?.category || 'Uncategorized';
    if (!categorySummary[category]) {
      categorySummary[category] = { count: 0, description: category };
    }
    categorySummary[category].count += row.qty;
  }

  const summaryRows = Object.entries(categorySummary)
    .map(([cat, data]) => ({
      'CSI Division': '26 0000 - Electrical',
      'Category': cat,
      'Total Devices': data.count
    }))
    .sort((a, b) => a.Category.localeCompare(b.Category));

  // Add raceway summary
  const totalRacewayLF = summarizedRows
    .filter(r => r.shape !== 'count' && typeof r.racewayLf === 'number')
    .reduce((sum, r) => sum + (r.racewayLf || 0), 0);

  const totalConductorLF = summarizedRows
    .filter(r => r.shape !== 'count' && typeof r.conductorLfTotal === 'number')
    .reduce((sum, r) => sum + (r.conductorLfTotal || 0), 0);

  summaryRows.push({
    'CSI Division': '26 0000 - Electrical',
    'Category': 'Conduit/Raceway',
    'Total Devices': +totalRacewayLF.toFixed(0) as any
  });

  summaryRows.push({
    'CSI Division': '26 0000 - Electrical',
    'Category': 'Wire & Cable',
    'Total Devices': +totalConductorLF.toFixed(0) as any
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary by Category');

  // ============================================================================
  // SHEET 3: BILL OF MATERIALS (Consolidated by material)
  // ============================================================================
  let totalMaterialCost = 0;
  let totalLaborHours = 0;

  const bomRows = materials
    .sort((a, b) => {
      // Sort by category, then description
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.description.localeCompare(b.description);
    })
    .map(mat => {
      const pricing = findPrice(mat.category, mat.description);
      const unitCost = pricing.cost;
      const laborPerUnit = pricing.laborHours;
      const extendedCost = unitCost * mat.totalQty;
      const extendedLabor = laborPerUnit * mat.totalQty;

      totalMaterialCost += extendedCost;
      totalLaborHours += extendedLabor;

      return {
        'Category': mat.category,
        'Description': mat.description,
        'Unit': mat.unit,
        'Base Qty': +mat.quantity.toFixed(2),
        'Waste Factor': mat.wasteFactor,
        'Total Qty': +mat.totalQty.toFixed(2),
        'Unit Cost': unitCost > 0 ? +unitCost.toFixed(2) : 0,
        'Extended Cost': extendedCost > 0 ? +extendedCost.toFixed(2) : 0,
        'Labor Hrs': laborPerUnit > 0 ? +laborPerUnit.toFixed(2) : 0,
        'Total Labor': extendedLabor > 0 ? +extendedLabor.toFixed(2) : 0,
        'Notes': mat.notes || ''
      };
    });

  // Add total row
  bomRows.push({
    'Category': 'TOTALS',
    'Description': '',
    'Unit': '',
    'Base Qty': '' as any,
    'Waste Factor': '' as any,
    'Total Qty': '' as any,
    'Unit Cost': '' as any,
    'Extended Cost': +totalMaterialCost.toFixed(2) as any,
    'Labor Hrs': '' as any,
    'Total Labor': +totalLaborHours.toFixed(2) as any,
    'Notes': `Material: $${totalMaterialCost.toFixed(2)} | Labor: ${totalLaborHours.toFixed(1)}hrs`
  });

  const bomSheet = XLSX.utils.json_to_sheet(bomRows);
  bomSheet['!cols'] = [
    { wch: 20 },  // Category
    { wch: 50 },  // Description
    { wch: 8 },   // Unit
    { wch: 10 },  // Base Qty
    { wch: 10 },  // Waste Factor
    { wch: 10 },  // Total Qty
    { wch: 12 },  // Unit Cost
    { wch: 14 },  // Extended Cost
    { wch: 10 },  // Labor Hrs
    { wch: 12 },  // Total Labor
    { wch: 30 }   // Notes
  ];
  XLSX.utils.book_append_sheet(wb, bomSheet, 'Bill of Materials');

  // ============================================================================
  // SHEET 4: ASSEMBLY BREAKDOWN
  // ============================================================================
  const assemblyRows: any[] = [];

  for (const usage of assemblyUsage) {
    // Assembly header row
    assemblyRows.push({
      'Assembly Code': usage.code,
      'Assembly Name': usage.name,
      'Description': usage.description,
      'Quantity Used': usage.count,
      'Category': '',
      'Material Description': '',
      'Unit': '',
      'Qty Per': '',
      'Total Qty': '',
      'Waste Factor': ''
    });

    // Material detail rows
    for (const mat of usage.materials) {
      assemblyRows.push({
        'Assembly Code': '',
        'Assembly Name': '',
        'Description': '',
        'Quantity Used': '',
        'Category': mat.category,
        'Material Description': mat.description,
        'Unit': mat.unit,
        'Qty Per': +(mat.quantity / usage.count).toFixed(3),
        'Total Qty': +mat.totalQty.toFixed(2),
        'Waste Factor': mat.wasteFactor
      });
    }

    // Blank row between assemblies
    assemblyRows.push({
      'Assembly Code': '', 'Assembly Name': '', 'Description': '',
      'Quantity Used': '', 'Category': '', 'Material Description': '',
      'Unit': '', 'Qty Per': '', 'Total Qty': '', 'Waste Factor': ''
    });
  }

  const assemblySheet = XLSX.utils.json_to_sheet(assemblyRows);
  assemblySheet['!cols'] = [
    { wch: 15 }, { wch: 35 }, { wch: 40 }, { wch: 12 },
    { wch: 20 }, { wch: 45 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, assemblySheet, 'Assembly Breakdown');

  // ============================================================================
  // SHEET 5: DEVICE COUNTS
  // ============================================================================
  const deviceRows = summarizedRows
    .filter(r => r.shape === 'count')
    .map(r => {
      const tag = tagMap.get(r.tagCode);
      return {
        'Tag Code': r.tagCode,
        'Tag Name': r.tagName || tag?.name || '',
        'Category': r.category || tag?.category || '',
        'Quantity': r.qty,
        'Assembly': tag?.assemblyId ? assemblies.find(a => a.id === tag.assemblyId)?.code || '' : ''
      };
    })
    .sort((a, b) => a['Tag Code'].localeCompare(b['Tag Code']));

  const deviceSheet = XLSX.utils.json_to_sheet(deviceRows);
  deviceSheet['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 25 }, { wch: 10 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, deviceSheet, 'Device Counts');

  // ============================================================================
  // SHEET 6: CONDUIT & WIRE SUMMARY
  // ============================================================================
  const conduitRows = summarizedRows
    .filter(r => r.shape !== 'count')
    .map(r => {
      const tag = tagMap.get(r.tagCode);
      return {
        'Homerun': r.tagCode,
        'Description': r.tagName || tag?.name || '',
        'Category': r.category || tag?.category || '',
        'EMT Size': r.emtSize || '',
        'Runs': r.qty,
        'Total Raceway LF': typeof r.racewayLf === 'number' ? +r.racewayLf.toFixed(2) : 0,
        'Total Conductor LF': typeof r.conductorLfTotal === 'number' ? +r.conductorLfTotal.toFixed(2) : 0,
        'Total Boxes': typeof r.boxes === 'number' ? r.boxes : 0
      };
    })
    .sort((a, b) => a.Homerun.localeCompare(b.Homerun));

  const conduitSheet = XLSX.utils.json_to_sheet(conduitRows);
  conduitSheet['!cols'] = [
    { wch: 12 }, { wch: 35 }, { wch: 25 }, { wch: 12 },
    { wch: 8 }, { wch: 18 }, { wch: 18 }, { wch: 12 }
  ];
  XLSX.utils.book_append_sheet(wb, conduitSheet, 'Conduit & Wire Summary');

  // ============================================================================
  // SHEET 7: TAKEOFF DETAIL (Itemized Measurements)
  // ============================================================================
  const detailRows = itemizedRows.map(r => {
    const tag = tagMap.get(r.tagCode);
    const c = r.conductors || [];
    const c1 = c[0] || { count: 0, size: '', insulation: '', material: '' };
    const c2 = c[1] || { count: 0, size: '', insulation: '', material: '' };
    const c3 = c[2] || { count: 0, size: '', insulation: '', material: '' };

    const formatWire = (cond: typeof c1) => {
      if (!cond.count || !cond.size) return '';
      return `${cond.count} ${cond.size} ${cond.insulation} ${cond.material}`.trim();
    };

    const baseRow: any = {
      'ID': `${r.tagCode}${r.index ? '-' + r.index : ''}`,
      'Tag': r.tagCode,
      'Description': r.tagName || tag?.name || '',
      'Category': r.category || tag?.category || '',
      'Type': r.shape,
      'Page': r.pageIndex + 1
    };

    if (r.shape === 'count') {
      baseRow['Quantity'] = r.qty;
    } else {
      baseRow['EMT Size'] = r.emtSize || '';
      baseRow['Points'] = r.points || 0;
      baseRow['Geometry LF'] = typeof r.lengthFt === 'number' ? +r.lengthFt.toFixed(2) : 0;
      baseRow['Raceway LF'] = typeof r.racewayLf === 'number' ? +r.racewayLf.toFixed(2) : 0;
      baseRow['Wire 1'] = formatWire(c1);
      baseRow['Wire 2'] = formatWire(c2);
      baseRow['Wire 3'] = formatWire(c3);
      baseRow['Conductor LF'] = typeof r.conductorLfTotal === 'number' ? +r.conductorLfTotal.toFixed(2) : 0;
      baseRow['Boxes'] = typeof r.boxes === 'number' ? r.boxes : 0;
    }

    if (r.note) {
      baseRow['Notes'] = r.note;
    }

    return baseRow;
  });

  const detailSheet = XLSX.utils.json_to_sheet(detailRows);
  detailSheet['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 35 }, { wch: 25 }, { wch: 10 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 10 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, detailSheet, 'Takeoff Detail');

  // Write file
  const baseName = projectName || 'Electrical-BOM';
  XLSX.writeFile(wb, `${baseName}.xlsx`);
}
