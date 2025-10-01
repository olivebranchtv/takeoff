/**
 * Pricing and Cost Calculation System
 * Handles material pricing, labor costs, and bid calculations
 */

import type { Assembly, Tag, PageState } from '@/types';
import { calculateAssemblyMaterials, type MaterialLine, type AssemblyUsage } from './excelBOM';

export interface MaterialPrice {
  category: string;
  description: string;
  unit: string;
  materialCost: number;
  laborHours?: number;
  vendor?: string;
  vendorPartNumber?: string;
}

export interface LaborRate {
  assemblyCode: string;
  assemblyName: string;
  installationHours: number;
  skillLevel?: string;
}

export interface ProjectCosts {
  // Material Costs
  materialCostTotal: number;
  materialTaxRate: number;
  materialTax: number;
  materialShipping: number;
  materialSubtotal: number;

  // Labor Costs
  laborHoursTotal: number;
  laborRate: number;
  laborCostTotal: number;

  // Equipment
  equipmentCostTotal: number;

  // Subtotal before markup
  subtotal: number;

  // Overhead
  overheadPercentage: number;
  overheadAmount: number;
  subtotalWithOverhead: number;

  // Profit
  profitPercentage: number;
  profitAmount: number;

  // Final Bid
  totalBidPrice: number;

  // Breakdown by division
  divisionBreakdown: DivisionCost[];
}

export interface DivisionCost {
  division: string;
  materialCost: number;
  laborHours: number;
  laborCost: number;
  totalCost: number;
  sellPrice: number;
}

/**
 * Load material pricing from database
 * In-memory fallback for when database is not connected
 */
export class PricingDatabase {
  private materialPrices: Map<string, MaterialPrice> = new Map();
  private laborRates: Map<string, LaborRate> = new Map();
  private defaultLaborRate: number = 30.0;

  constructor(defaultLaborRate: number = 30.0) {
    this.defaultLaborRate = defaultLaborRate;
    this.initializeDefaultLaborRates();
  }

  /**
   * Initialize default labor rates for assemblies
   * Based on industry standards (hours per installation)
   */
  private initializeDefaultLaborRates() {
    const defaults: Array<{ code: string; name: string; hours: number }> = [
      // Receptacles
      { code: 'RECEP-15A', name: 'Receptacle 15A', hours: 0.40 },
      { code: 'RECEP-20A', name: 'Receptacle 20A', hours: 0.45 },
      { code: 'RECEP-GFCI', name: 'GFCI Receptacle 20A', hours: 0.50 },
      { code: 'RECEP-IG', name: 'Isolated Ground Receptacle', hours: 0.55 },
      { code: 'RECEP-WP', name: 'Weather-Proof Receptacle', hours: 0.60 },
      { code: 'RECEP-FLOOR', name: 'Floor Receptacle', hours: 0.65 },
      { code: 'RECEP-USB', name: 'USB Combo Receptacle', hours: 0.50 },
      { code: 'RECEP-208V-20A', name: '208V Receptacle', hours: 0.50 },
      { code: 'RECEP-240V-30A', name: '240V 30A Receptacle', hours: 0.65 },
      { code: 'RECEP-50A-RANGE', name: '50A Range Receptacle', hours: 0.75 },
      { code: 'RECEP-L5-30', name: 'Twist-Lock 30A', hours: 0.70 },
      { code: 'WELDING-50A', name: 'Welding Receptacle', hours: 0.75 },

      // Switches
      { code: 'SW-1P', name: 'Single-Pole Switch', hours: 0.30 },
      { code: 'SW-3W', name: '3-Way Switch', hours: 0.35 },
      { code: 'SW-4W', name: '4-Way Switch', hours: 0.40 },
      { code: 'SW-DIM', name: 'Dimmer Switch', hours: 0.45 },
      { code: 'SW-OCC', name: 'Occupancy Sensor Switch', hours: 0.50 },
      { code: 'SW-TIMER', name: 'Timer Switch', hours: 0.50 },

      // Lighting
      { code: 'LIGHT-2X4', name: '2x4 LED Troffer', hours: 0.75 },
      { code: 'LIGHT-2X2', name: '2x2 LED Troffer', hours: 0.65 },
      { code: 'LIGHT-HIGHBAY', name: 'LED High-Bay', hours: 1.25 },
      { code: 'LIGHT-6IN', name: '6" LED Downlight', hours: 0.60 },
      { code: 'LIGHT-EMER', name: 'Emergency Light', hours: 0.85 },
      { code: 'LIGHT-EXIT', name: 'Exit Sign', hours: 0.50 },

      // Junction Boxes
      { code: 'JBOX-4SQ', name: '4" Square J-Box', hours: 0.25 },
      { code: 'JBOX-4-11/16', name: '4-11/16" J-Box', hours: 0.30 },
      { code: 'PULLBOX-8X8', name: '8x8x4 Pull Box', hours: 0.50 },
      { code: 'PULLBOX-12X12', name: '12x12x6 Pull Box', hours: 0.75 },

      // Data/Comm
      { code: 'DATA-CAT6', name: 'CAT6 Data Jack', hours: 0.35 },
      { code: 'DATA-CAT6A', name: 'CAT6A Data Jack', hours: 0.40 },
      { code: 'DATA-FIBER', name: 'Fiber Optic Jack', hours: 0.50 },
      { code: 'DATA-AV', name: 'AV Combo Plate', hours: 0.45 },
      { code: 'DATA-COAX', name: 'Coax Jack', hours: 0.30 },

      // Panels
      { code: 'PANEL-42CKT', name: '42-Circuit Panel', hours: 8.0 },
      { code: 'PANEL-24CKT', name: '24-Circuit Subpanel', hours: 5.0 },
      { code: 'DISC-60A', name: '60A Disconnect', hours: 1.5 },
      { code: 'DISC-100A', name: '100A Disconnect', hours: 2.0 },

      // Motor Control
      { code: 'MOTOR-3HP', name: 'Motor Starter 3HP', hours: 3.0 },
      { code: 'MOTOR-10HP', name: 'Motor Starter 10HP', hours: 4.0 },
      { code: 'VFD-5HP', name: 'VFD 5HP', hours: 4.5 },
      { code: 'CONTACTOR-30A', name: 'Lighting Contactor', hours: 1.5 },

      // HVAC
      { code: 'HVAC-RTU-WHIP', name: 'RTU Whip Assembly', hours: 2.0 },
      { code: 'HVAC-COND-DISC', name: 'Condenser Disconnect', hours: 1.5 },
      { code: 'EXHAUST-FAN', name: 'Exhaust Fan Control', hours: 0.75 },

      // Site/Exterior
      { code: 'POLE-LIGHT', name: 'Pole Light', hours: 3.5 },
      { code: 'BOLLARD-LIGHT', name: 'Bollard Light', hours: 2.5 },
      { code: 'SIGN-OUTLET', name: 'Sign Outlet', hours: 1.0 },
      { code: 'EV-CHARGER-L2', name: 'EV Charger Level 2', hours: 6.0 },

      // Low Voltage/AV
      { code: 'PROJECTOR-OUTLET', name: 'Projector Outlet', hours: 1.5 },
      { code: 'TV-MOUNT-OUTLET', name: 'TV Mount Outlet', hours: 1.0 },
      { code: 'SPEAKER-70V', name: '70V Speaker', hours: 0.75 },
      { code: 'FLOOR-MONUMENT', name: 'Floor Monument', hours: 2.0 },

      // Breakers
      { code: 'BKR-1P-20A', name: 'Breaker 1P 20A', hours: 0.15 },
      { code: 'BKR-2P-30A', name: 'Breaker 2P 30A', hours: 0.20 },
      { code: 'BKR-3P-100A', name: 'Breaker 3P 100A', hours: 0.35 },
      { code: 'BKR-GFCI-2P-20A', name: 'GFCI Breaker 2P', hours: 0.25 },
      { code: 'BKR-AFCI-1P-15A', name: 'AFCI Breaker 1P', hours: 0.20 },

      // Grounding
      { code: 'GROUND-ROD', name: 'Ground Rod Driven', hours: 1.0 },
      { code: 'UFER-GROUND', name: 'Ufer Ground Connection', hours: 1.5 },

      // Emergency Power
      { code: 'GEN-INLET-50A', name: 'Generator Inlet 50A', hours: 2.0 },
      { code: 'XFER-SW-30A', name: 'Transfer Switch 30A', hours: 4.0 },

      // Fire Alarm
      { code: 'FA-SMOKE', name: 'Smoke Detector', hours: 0.40 },
      { code: 'FA-PULL', name: 'Pull Station', hours: 0.35 },
      { code: 'FA-HORNSTROBE', name: 'Horn/Strobe', hours: 0.50 },

      // Security
      { code: 'SEC-CAMERA', name: 'IP Camera', hours: 1.5 },
      { code: 'SEC-READER', name: 'Card Reader', hours: 1.0 },
      { code: 'SEC-MAGLOCK', name: 'Magnetic Lock', hours: 2.0 },
      { code: 'SEC-DOOR', name: 'Door Contact', hours: 0.30 },

      // Healthcare
      { code: 'RECEP-HOSP-IG', name: 'Hospital IG Receptacle', hours: 0.75 },
      { code: 'RECEP-PATIENT-CARE', name: 'Patient Care Receptacle', hours: 0.80 },
      { code: 'NURSE-CALL', name: 'Nurse Call Station', hours: 1.5 },

      // Energy Management
      { code: 'OCC-SENSOR-CEIL', name: 'Ceiling Occupancy Sensor', hours: 0.65 },
      { code: 'DAYLIGHT-SENSOR', name: 'Daylight Sensor', hours: 0.70 },

      // Conduit labor (per 10 LF)
      { code: 'EMT-1/2', name: 'EMT 1/2"', hours: 0.40 },
      { code: 'EMT-3/4', name: 'EMT 3/4"', hours: 0.50 },
      { code: 'EMT-1', name: 'EMT 1"', hours: 0.60 },
      { code: 'EMT-1-1/4', name: 'EMT 1-1/4"', hours: 0.75 },
      { code: 'EMT-1-1/2', name: 'EMT 1-1/2"', hours: 0.85 },
      { code: 'EMT-2', name: 'EMT 2"', hours: 1.00 },

      // Wire pull (per 100 LF)
      { code: 'WIRE-PULL', name: 'Wire Pull', hours: 1.5 },
    ];

    for (const rate of defaults) {
      this.laborRates.set(rate.code, {
        assemblyCode: rate.code,
        assemblyName: rate.name,
        installationHours: rate.hours,
        skillLevel: 'Journeyman'
      });
    }
  }

  /**
   * Set material price
   */
  setMaterialPrice(key: string, price: MaterialPrice) {
    this.materialPrices.set(key, price);
  }

  /**
   * Get total number of prices loaded
   */
  getPriceCount(): number {
    return this.materialPrices.size;
  }

  /**
   * Get all loaded price keys (for debugging)
   */
  getAllKeys(): string[] {
    return Array.from(this.materialPrices.keys());
  }

  /**
   * Get material price by description (with fuzzy matching)
   */
  getMaterialPrice(category: string, description: string): number | undefined {
    // Try exact match first
    const exactKey = `${category}::${description}`;
    const exact = this.materialPrices.get(exactKey);
    const result = exact && exact.materialCost > 0 ? `$${exact.materialCost}` : 'NOT FOUND';
    console.log(`🔍 [${category}] "${description}" → ${result}`);
    if (exact && exact.materialCost > 0) {
      return exact.materialCost;
    }

    // Fuzzy match - normalize and find similar items
    const normDesc = description.toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .trim();

    const keyTerms = normDesc.split(/[,\/]/).filter(t => t.length > 2);

    // Category mapping for fuzzy matching
    // This MUST match ALL 28 categories in the Supabase database EXACTLY
    const normCategory = category.toLowerCase().replace(/[&\s]/g, '');
    const categoryMatches = (dbCat: string): boolean => {
      const dbCatLower = dbCat.toLowerCase().replace(/[&\s]/g, '');

      // EXACT category matches (ignore spaces, ampersands, special chars)
      if (normCategory === dbCatLower) return true;

      // ASSEMBLY → DATABASE CATEGORY MAPPINGS
      // Map assembly-generated categories to all possible database category variations

      // Boxes: "Boxes" → "Boxes", "Plaster Rings"
      if ((normCategory === 'boxes' || normCategory === 'box') &&
          (dbCatLower.includes('box') || dbCatLower.includes('ring'))) return true;

      // Devices: "Devices" → "Devices"
      if (normCategory === 'devices' && dbCatLower.includes('device')) return true;

      // Fittings: "Fittings" → "Fittings", "FLEX CONDUIT & FITTINGS", "Galvanized Coupling"
      if ((normCategory === 'fittings' || normCategory === 'fitting') &&
          (dbCatLower.includes('fitting') || dbCatLower.includes('coupling') ||
           dbCatLower.includes('flex'))) return true;

      // Plates: "Devices" → "Plates", "PLATES/Lexan", "PLATES/Plastic", "PLATES/Stainless"
      if (normCategory === 'devices' && dbCatLower.includes('plate')) return true;
      if ((normCategory === 'plates' || normCategory === 'plate') && dbCatLower.includes('plate')) return true;

      // Wire: "wire" → "wire", "MC Cable", "NM Cable", "SO Cord"
      if ((normCategory === 'wire' || normCategory === 'wirecable' || normCategory === 'wire&cable') &&
          (dbCatLower.includes('wire') || dbCatLower.includes('cable') || dbCatLower.includes('cord'))) return true;

      // Conduit: "EMT CONDUIT" → "EMT CONDUIT", "PVC CONDUIT Sch 40", "PVC CONDUIT Sch 80",
      //          "RIGID CONDUIT", "Electrical Non Metallic Tubing"
      if ((normCategory === 'conduit' || normCategory === 'emtconduit' || normCategory.includes('conduit')) &&
          (dbCatLower.includes('conduit') || dbCatLower.includes('emt') ||
           dbCatLower.includes('tubing') || dbCatLower.includes('pvc') ||
           dbCatLower.includes('rigid'))) return true;

      // Grounding: "Grounding" → "Grounding"
      if (normCategory === 'grounding' && dbCatLower.includes('ground')) return true;

      // Lighting: Map if assemblies ever generate lighting materials
      if (normCategory === 'lighting' && dbCatLower.includes('light')) return true;

      // Panels: Map if assemblies ever generate panel materials
      if (normCategory === 'panels' && dbCatLower.includes('panel')) return true;

      // PVC fittings: "Fittings" → "PVC 90 degree,Sch.40", "PVC 90 degree,Sch.80", "PVC Sch.40 Coupling"
      if ((normCategory === 'fittings' || normCategory === 'fitting') &&
          dbCatLower.includes('pvc')) return true;

      // Rigid fittings: "Fittings" → "Rigid Stl Elbow,90"
      if ((normCategory === 'fittings' || normCategory === 'fitting') &&
          dbCatLower.includes('rigid')) return true;

      // Wing Nuts / Wire Connectors: "Fittings" or "Electrical Materials" → "Wing Nuts"
      if ((normCategory === 'fittings' || normCategory === 'electricalmaterials') &&
          dbCatLower.includes('wingnut')) return true;

      // Electrical Materials: Catch-all for misc items
      if (normCategory === 'electricalmaterials' && dbCatLower.includes('electrical')) return true;

      return false;
    };

    // Search for matches across related categories
    let candidateCount = 0;
    for (const [key, price] of this.materialPrices.entries()) {
      if (!categoryMatches(price.category)) continue;
      candidateCount++;

      if (!price.materialCost || price.materialCost <= 0) continue;

      const dbDesc = price.description.toLowerCase()
        .replace(/["']/g, '')
        .replace(/\s+/g, '')
        .replace(/-/g, '');

      // Check if database description contains assembly key terms
      const matchFound = keyTerms.some(term => dbDesc.includes(term));
      if (matchFound) {
        return price.materialCost;
      }
    }

    // Debug: log when no match found
    if (candidateCount === 0) {
      console.warn(`❌ No category match for: "${description}" (category: "${category}")`);
    } else {
      console.warn(`❌ No description match for: "${description}" (category: "${category}", ${candidateCount} candidates checked, keyTerms: ${JSON.stringify(keyTerms)})`);
    }

    return undefined;
  }

  /**
   * Get labor hours per unit for a material (e.g., wire, conduit)
   */
  getMaterialLaborHours(category: string, description: string): number {
    const exactKey = `${category}::${description}`;
    const exact = this.materialPrices.get(exactKey);
    if (exact && exact.laborHours && exact.laborHours > 0) {
      return exact.laborHours;
    }
    return 0;
  }

  /**
   * Set labor rate for assembly
   */
  setLaborRate(code: string, rate: LaborRate) {
    this.laborRates.set(code, rate);
  }

  /**
   * Get labor hours for assembly
   */
  getLaborHours(assemblyCode: string): number {
    const rate = this.laborRates.get(assemblyCode);
    return rate?.installationHours || 0.5; // Default 30 minutes if not found
  }

  /**
   * Get default labor rate ($ per hour)
   */
  getDefaultLaborRate(): number {
    return this.defaultLaborRate;
  }

  /**
   * Set default labor rate
   */
  setDefaultLaborRate(rate: number) {
    this.defaultLaborRate = rate;
  }
}

/**
 * Calculate project costs
 */
export function calculateProjectCosts(
  pages: PageState[],
  tags: Tag[],
  assemblies: Assembly[],
  pricingDb: PricingDatabase,
  options: {
    overheadPercentage?: number;
    profitPercentage?: number;
    materialTaxRate?: number;
    materialShipping?: number;
    equipmentCost?: number;
  } = {}
): ProjectCosts {
  const {
    overheadPercentage = 15.0,
    profitPercentage = 12.0,
    materialTaxRate = 0.085,
    materialShipping = 0,
    equipmentCost = 0,
  } = options;

  // Get material breakdown
  const { materials, assemblyUsage } = calculateAssemblyMaterials(pages, tags, assemblies);

  // Calculate material costs
  let materialCostTotal = 0;
  for (const mat of materials) {
    const price = pricingDb.getMaterialPrice(mat.category, mat.description);
    if (price) {
      materialCostTotal += mat.totalQty * price;
    } else {
      console.log(`⚠️ No price found for: ${mat.category}::${mat.description} (qty: ${mat.totalQty})`);
    }
  }

  const materialTax = materialCostTotal * materialTaxRate;
  const materialSubtotal = materialCostTotal + materialTax + materialShipping;

  // Calculate labor costs
  let laborHoursTotal = 0;
  const divisionMap = new Map<string, DivisionCost>();

  // Add all materials to divisions (wire, conduit, boxes, devices, etc.)
  for (const mat of materials) {
    const laborPerUnit = pricingDb.getMaterialLaborHours(mat.category, mat.description);
    const price = pricingDb.getMaterialPrice(mat.category, mat.description) || 0;
    const matCost = mat.totalQty * price;
    const materialLaborHours = laborPerUnit * mat.totalQty;

    // Add to labor total if this material has labor hours
    if (laborPerUnit > 0) {
      laborHoursTotal += materialLaborHours;
      console.log(`⚙️ Material labor: ${mat.category}::${mat.description} = ${mat.totalQty} × ${laborPerUnit} hrs = ${materialLaborHours} hrs`);
    }

    // Track materials in divisions - ALWAYS add, even if no price found yet
    // This ensures wire shows up even if pricing is missing
    const division = mat.category || 'General';
    const existing = divisionMap.get(division);

    if (matCost > 0 || materialLaborHours > 0 || mat.totalQty > 0) {
      if (matCost === 0 && price === 0 && mat.totalQty > 0) {
        console.warn(`⚠️ NO PRICE: ${mat.category}::${mat.description} (qty: ${mat.totalQty}) - will show $0 in division`);
      } else {
        console.log(`💰 Material cost: ${mat.category}::${mat.description} = ${mat.totalQty} × $${price} = $${matCost}`);
      }

      if (existing) {
        existing.materialCost += matCost;
        existing.laborHours += materialLaborHours;
      } else {
        divisionMap.set(division, {
          division,
          materialCost: matCost,
          laborHours: materialLaborHours,
          laborCost: 0,
          totalCost: 0,
          sellPrice: 0
        });
      }
    }
  }

  // Add labor hours from assemblies
  // Note: Assembly materials are already counted in the materials loop above,
  // this just adds the assembly-level labor hours
  for (const usage of assemblyUsage) {
    const hoursPerUnit = pricingDb.getLaborHours(usage.code);
    const totalHours = hoursPerUnit * usage.count;
    laborHoursTotal += totalHours;

    // Track by division (category of first material in assembly)
    // This adds labor hours to existing division entries
    const division = usage.materials[0]?.category || 'General';

    const existing = divisionMap.get(division);
    if (existing) {
      existing.laborHours += totalHours;
    } else {
      // Create division if it doesn't exist (shouldn't happen since materials are processed first)
      divisionMap.set(division, {
        division,
        materialCost: 0,
        laborHours: totalHours,
        laborCost: 0,
        totalCost: 0,
        sellPrice: 0
      });
    }
  }

  const laborRate = pricingDb.getDefaultLaborRate();
  const laborCostTotal = laborHoursTotal * laborRate;

  // Calculate subtotal
  const subtotal = materialSubtotal + laborCostTotal + equipmentCost;

  // Calculate overhead
  const overheadAmount = subtotal * (overheadPercentage / 100);
  const subtotalWithOverhead = subtotal + overheadAmount;

  // Calculate profit
  const profitAmount = subtotalWithOverhead * (profitPercentage / 100);
  const totalBidPrice = subtotalWithOverhead + profitAmount;

  // Calculate division breakdown with markup
  const divisionBreakdown: DivisionCost[] = [];

  // Log all divisions to debug
  console.log('📊 Division Map:', Array.from(divisionMap.keys()));

  for (const [division, cost] of divisionMap.entries()) {
    cost.laborCost = cost.laborHours * laborRate;
    cost.totalCost = cost.materialCost + cost.laborCost;

    // Apply proportional overhead and profit
    const divisionWithOH = cost.totalCost * (1 + overheadPercentage / 100);
    cost.sellPrice = divisionWithOH * (1 + profitPercentage / 100);

    console.log(`📊 Division "${division}": $${cost.materialCost.toFixed(2)} mat + ${cost.laborHours.toFixed(2)} hrs = $${cost.sellPrice.toFixed(2)} sell`);

    divisionBreakdown.push(cost);
  }

  // Sort divisions for consistent export
  divisionBreakdown.sort((a, b) => a.division.localeCompare(b.division));

  return {
    materialCostTotal,
    materialTaxRate,
    materialTax,
    materialShipping,
    materialSubtotal,
    laborHoursTotal,
    laborRate,
    laborCostTotal,
    equipmentCostTotal: equipmentCost,
    subtotal,
    overheadPercentage,
    overheadAmount,
    subtotalWithOverhead,
    profitPercentage,
    profitAmount,
    totalBidPrice,
    divisionBreakdown
  };
}
