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
  itemCode?: string;  // Unique code for exact database matching
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

  console.log(`🚀 Processing ${racewayRows.length} raceway rows for home run materials`);

  let rowsWithoutConductors = 0;
  let totalRacewayLfWithoutWire = 0;

  for (const row of racewayRows) {
    // Add conduit/raceway if EMT size specified
    if (row.emtSize && row.racewayLf && row.racewayLf > 0) {
      // Format to match database exactly: '1/2"EMT Conduit' (with the inch mark after the size)
      // Database format uses actual double-quote character: 1/2"EMT Conduit
      const emtDesc = `${row.emtSize}EMT Conduit`;
      const matKey = `EMT CONDUIT::${emtDesc}::EA`;

      // Map EMT size to item code
      const emtItemCodes: Record<string, string> = {
        '1/2"': 'ITEM-0448',
        '3/4"': 'ITEM-0453',
        '1"': 'ITEM-0447',
        '1 1/4"': 'ITEM-0446',
        '1 1/2"': 'ITEM-0445',
        '2"': 'ITEM-0450',
        '2 1/2"': 'ITEM-0449',
        '3"': 'ITEM-0452',
        '4"': 'ITEM-0454'
      };
      const itemCode = emtItemCodes[row.emtSize];

      console.log(`📦 Generated EMT material: [${itemCode}] category="EMT CONDUIT", desc="${emtDesc}", qty=${row.racewayLf}LF`);
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
          itemCode,
          assemblyCode: 'RACEWAY',
          assemblyName: 'Conduit Run'
        });
      }
    }

    // Add wire/conductors
    if (row.conductors && Array.isArray(row.conductors) && row.conductors.length > 0) {
      console.log(`  📌 Row has ${row.conductors.length} conductor configs, racewayLf=${row.racewayLf}`);
      for (const cond of row.conductors) {
        if (!cond.count || !cond.size || cond.count === 0) {
          console.log(`  ⚠️ Skipping conductor: count=${cond.count}, size=${cond.size}`);
          continue;
        }

        // Calculate conductor length for this group
        const condLf = row.racewayLf || 0;
        const totalCondLf = cond.count * condLf;

        if (totalCondLf <= 0) {
          console.log(`  ⚠️ Skipping conductor: totalCondLf=${totalCondLf} (count=${cond.count} × racewayLf=${condLf})`);
          continue;
        }

        // Format wire description to match database exactly
        // Standard: #14, #12, #10 use Stranded for flexibility; #8+ always Stranded
        const wireType = 'Str'; // Use stranded by default (industry standard for branch circuits)

        // Ensure size has # prefix to match database format: "#12 THHN Copper Wire,Str"
        const sizeWithHash = cond.size.startsWith('#') ? cond.size : `#${cond.size}`;
        const wireDesc = `${sizeWithHash} THHN Copper Wire,${wireType}`;
        const matKey = `wire::${wireDesc}::EA`;

        // Map wire size to item code
        const wireItemCodes: Record<string, string> = {
          '#14': 'ITEM-0895',
          '#12': 'ITEM-0893',
          '#10': 'ITEM-0891',
          '#8': 'ITEM-0900',
          '#6': 'ITEM-0899',
          '#4': 'ITEM-0898',
          '#2': 'ITEM-0896',
          '#1': 'ITEM-0889',
          '1/0': 'ITEM-0901',
          '2/0': 'ITEM-0913',
          '3/0': 'ITEM-0915',
          '4/0': 'ITEM-0922',
          '250': 'ITEM-0914',
          '500': 'ITEM-0925'
        };
        const itemCode = wireItemCodes[sizeWithHash];

        console.log(`  ✅ Generated WIRE material: [${itemCode}] category="wire", desc="${wireDesc}", qty=${totalCondLf}LF (${cond.count} conductors × ${condLf}LF)`);
        const existing = materialAcc.get(matKey);

        if (existing) {
          existing.quantity += totalCondLf;
          existing.totalQty += totalCondLf * existing.wasteFactor;
          console.log(`    📈 Added to existing wire entry, new totalQty=${existing.totalQty}LF`);
        } else {
          materialAcc.set(matKey, {
            category: 'wire',
            description: wireDesc,
            unit: 'EA',
            quantity: totalCondLf,
            wasteFactor: 1.10,
            totalQty: totalCondLf * 1.10,
            itemCode,
            assemblyCode: 'WIRE',
            assemblyName: 'Conductor Pull'
          });
          console.log(`    🆕 Created new wire entry, totalQty=${totalCondLf * 1.10}LF`);
        }
      }
    } else {
      // Track rows without conductor info
      rowsWithoutConductors++;
      totalRacewayLfWithoutWire += (row.racewayLf || 0);
      console.log(`  ⚠️ Row "${row.tagCode}" has conduit (${row.racewayLf}LF) but NO CONDUCTOR INFO - wire cost/labor will be $0!`);
    }
  }

  // Show prominent warning if conductors are missing
  if (rowsWithoutConductors > 0) {
    console.warn(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MISSING WIRE/CONDUCTOR DATA ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${rowsWithoutConductors} home run(s) have conduit specified but NO WIRE/CONDUCTOR information!

Total conduit without wire: ${totalRacewayLfWithoutWire} LF

This means:
  ❌ NO wire material cost
  ❌ NO wire pulling labor hours
  ❌ Your estimate is INCOMPLETE and UNDER-PRICED!

TO FIX:
  1. Click on each home run line/polyline
  2. Fill out the "Conductors" section in the measurement dialog
  3. Specify: count, wire size (e.g., #12), insulation type
  4. Example: 3 conductors, #12, THHN
  5. Re-calculate pricing after updating

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
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

  console.log(`🔥 BOM EXPORTER v2.1 - Loaded ${pricingData?.length || 0} pricing records from database`);

  // Category matcher - maps assembly categories to database categories
  function categoryMatches(assemblyCategory: string, dbCategory: string): boolean {
    const normAssembly = assemblyCategory.toLowerCase().replace(/[&\s]/g, '');
    const normDb = dbCategory.toLowerCase().replace(/[&\s]/g, '');

    // Exact match
    if (normAssembly === normDb) return true;

    // Assembly → Database category mappings (match ALL 28 database categories)

    // Boxes: "Boxes" → "Boxes", "Plaster Rings"
    if ((normAssembly === 'boxes' || normAssembly === 'box') &&
        (normDb.includes('box') || normDb.includes('ring'))) return true;

    // Devices: "Devices" → "Devices", "Plates", "PLATES/Lexan", "PLATES/Plastic", "PLATES/Stainless"
    if (normAssembly === 'devices' &&
        (normDb.includes('device') || normDb.includes('plate'))) return true;

    // Fittings: "Fittings" → "Fittings", "FLEX CONDUIT & FITTINGS", "Galvanized Coupling",
    //           "PVC 90 degree", "PVC Sch.40 Coupling", "Rigid Stl Elbow", "Wing Nuts"
    if ((normAssembly === 'fittings' || normAssembly === 'fitting') &&
        (normDb.includes('fitting') || normDb.includes('coupling') ||
         normDb.includes('flex') || normDb.includes('pvc') ||
         normDb.includes('rigid') || normDb.includes('wingnut') ||
         normDb.includes('elbow'))) return true;

    // Wire: "wire" → "wire", "MC Cable", "NM Cable", "SO Cord"
    if ((normAssembly === 'wire' || normAssembly === 'wirecable' || normAssembly === 'wire&cable') &&
        (normDb.includes('wire') || normDb.includes('cable') || normDb.includes('cord'))) return true;

    // Conduit: "EMT CONDUIT" → "EMT CONDUIT", "PVC CONDUIT Sch 40", "PVC CONDUIT Sch 80",
    //          "RIGID CONDUIT", "Electrical Non Metallic Tubing", "FLEX CONDUIT & FITTINGS"
    if ((normAssembly === 'conduit' || normAssembly === 'emtconduit' || normAssembly.includes('conduit')) &&
        (normDb.includes('conduit') || normDb.includes('emt') ||
         normDb.includes('tubing') || normDb.includes('pvc') ||
         normDb.includes('rigid') || normDb.includes('flex'))) return true;

    // Grounding: "Grounding" → "Grounding"
    if (normAssembly === 'grounding' && normDb.includes('ground')) return true;

    // Lighting: "Lighting" → "Lighting"
    if (normAssembly === 'lighting' && normDb.includes('light')) return true;

    // Panels: "Panels" → "Panels"
    if (normAssembly === 'panels' && normDb.includes('panel')) return true;

    // Electrical Materials: catch-all
    if (normAssembly === 'electricalmaterials' && normDb.includes('electrical')) return true;

    return false;
  }

  // Fuzzy matcher - finds closest match in database
  function findPrice(category: string, description: string): { cost: number; laborHours: number } {
    console.log(`🔍 Finding price for: "${description}" (category: "${category}")`);

    // Try exact match first
    const exactKey = `${category}::${description}`;
    console.log(`   Trying exact key: "${exactKey}"`);
    const exact = priceMap.get(exactKey);
    if (exact && (exact.cost > 0 || exact.laborHours > 0)) {
      console.log(`✅ EXACT MATCH: ${category}::${description} = $${exact.cost}, ${exact.laborHours}hrs`);
      return exact;
    }
    console.log(`   No exact match found in priceMap (has ${priceMap.size} entries)`);

    // Debug: show a few keys from priceMap if this is a grounding item
    if (category.toLowerCase().includes('ground')) {
      const groundingKeys = Array.from(priceMap.keys()).filter(k => k.toLowerCase().includes('ground')).slice(0, 5);
      console.log(`   Sample grounding keys in priceMap:`, groundingKeys);
    }

    // Normalize for fuzzy matching
    const normDesc = description.toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s+/g, ' ')
      .replace(/-/g, '')
      .trim();

    // Extract key product identifiers (more aggressive matching)
    // Split into words and extract meaningful terms
    const words = normDesc.split(/[\s,\/]+/).filter(w => w.length >= 2);

    // Score-based matching: find best match in same category
    const categoryItems = pricingArray.filter(p => categoryMatches(category, p.category));
    console.log(`   Searching ${categoryItems.length} items in matching categories`);

    let bestMatch: { item: typeof categoryItems[0]; score: number } | null = null;

    for (const dbItem of categoryItems) {
      if (dbItem.cost === 0 && dbItem.laborHours === 0) continue; // Skip items without pricing

      const dbDesc = dbItem.description.toLowerCase()
        .replace(/["']/g, '')
        .replace(/\s+/g, ' ')
        .replace(/-/g, '')
        .trim();

      const dbWords = dbDesc.split(/[\s,\/]+/).filter(w => w.length >= 2);

      // Calculate match score: count how many words overlap
      let score = 0;

      // Check for key product identifiers (size, type, material)
      for (const word of words) {
        // Exact word match = 3 points
        if (dbWords.includes(word)) {
          score += 3;
        }
        // Partial match (one contains the other) = 1 point
        else if (dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))) {
          score += 1;
        }
      }

      // Bonus points for specific product identifiers
      // Size matching (e.g., "3/4", "1/2")
      const sizeMatch = description.match(/\d+\/\d+|\d+\s*\d*\/\d+/);
      if (sizeMatch && dbItem.description.includes(sizeMatch[0])) {
        score += 5; // Size is critical for electrical materials
      }

      // Type matching (EMT, connector, coupling, etc.)
      const types = ['emt', 'connector', 'coupling', 'box', 'conduit', 'wire', 'cable', 'plate', 'ring', 'mud'];
      for (const type of types) {
        if (normDesc.includes(type) && dbDesc.includes(type)) {
          score += 2;
        }
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { item: dbItem, score };
      }
    }

    if (bestMatch && bestMatch.score >= 3) { // Require minimum score of 3
      console.log(`✅ FUZZY MATCH (score ${bestMatch.score}): "${description}" → "${bestMatch.item.description}" = $${bestMatch.item.cost}, ${bestMatch.item.laborHours}hrs`);
      return { cost: bestMatch.item.cost, laborHours: bestMatch.item.laborHours };
    }

    console.error(`❌ NO MATCH: "${description}" (category: "${category}") - best score: ${bestMatch?.score || 0}`);
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
      console.log(`💰 Pricing lookup for: category="${mat.category}", description="${mat.description}"`);
      const pricing = findPrice(mat.category, mat.description);
      console.log(`   → Result: $${pricing.cost}, ${pricing.laborHours}hrs`);
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
