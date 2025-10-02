/**
 * Pricing and Cost Calculation System
 * Handles material pricing, labor costs, and bid calculations
 */

import type { Assembly, Tag, PageState } from '@/types';
import { calculateAssemblyMaterials, type MaterialLine, type AssemblyUsage } from './excelBOM';

/**
 * Industry-standard fallback prices for common electrical items
 * Used when database pricing is not available
 */
const FALLBACK_PRICES: Record<string, { price: number; laborHours: number }> = {
  // Lighting Fixtures - Customer supplied get $0 cost but we still need labor (1.0 hour per fixture)
  'light': { price: 0.00, laborHours: 1.0 },
  'fixture': { price: 0.00, laborHours: 1.0 },
  'led': { price: 180.00, laborHours: 1.0 },
  'troffer': { price: 200.00, laborHours: 1.0 },
  'highbay': { price: 250.00, laborHours: 1.0 },
  'high bay': { price: 250.00, laborHours: 1.0 },
  'wall pack': { price: 150.00, laborHours: 1.0 },
  'exit': { price: 100.00, laborHours: 1.0 },
  'emergency': { price: 120.00, laborHours: 1.0 },
  'canopy': { price: 180.00, laborHours: 1.0 },
  'downlight': { price: 80.00, laborHours: 1.0 },
  'recessed': { price: 100.00, laborHours: 1.0 },

  // Owner-supplied sensors - $0 material but labor to install
  'occupancy sensor - owner': { price: 0.00, laborHours: 0.5 },
  'sensor - owner': { price: 0.00, laborHours: 0.5 },

  // Fittings - EMT Connectors
  'emt connector': { price: 2.50, laborHours: 0.05 },
  'compression connector': { price: 3.00, laborHours: 0.05 },
  'set screw connector': { price: 1.50, laborHours: 0.05 },

  // Fittings - Couplings
  'emt coupling': { price: 1.50, laborHours: 0.03 },
  'compression coupling': { price: 2.00, laborHours: 0.03 },
  'set screw coupling': { price: 1.00, laborHours: 0.03 },

  // Fittings - Box Connectors
  'box connector': { price: 2.00, laborHours: 0.05 },
  'knockout connector': { price: 1.75, laborHours: 0.05 },

  // Weatherproof Fittings
  'foam gasket': { price: 0.50, laborHours: 0.02 },
  'gasket': { price: 0.50, laborHours: 0.02 },
  'weatherproof': { price: 3.50, laborHours: 0.08 },

  // Grounding
  'ground rod': { price: 15.00, laborHours: 0.5 },
  'ground clamp': { price: 3.00, laborHours: 0.08 },
  'grounding bushing': { price: 4.00, laborHours: 0.08 },
  'bonding bushing': { price: 4.50, laborHours: 0.08 },

  // Default fallback for any unknown item
  'default': { price: 2.00, laborHours: 0.05 }
};

/**
 * Get fallback pricing for items not in database
 */
function getFallbackPrice(category: string, description: string): { price: number; laborHours: number } {
  // Handle null/undefined values
  if (!description || !category) {
    console.warn(`⚠️ Missing description or category - description: "${description}", category: "${category}"`);
    return FALLBACK_PRICES.default;
  }

  const desc = String(description).toLowerCase();
  const cat = String(category).toLowerCase();

  // Check if this is a generic fixture (e.g., "Fixture A", "Fixture B", "Fixture J")
  // These are owner-supplied fixtures from lighting schedules
  // Changed to 1.0 hour per fixture for labor
  if (desc.match(/^fixture\s+[a-z0-9]+$/i) ||
      (cat.includes('light') && desc.startsWith('fixture')) ||
      (cat === 'lights' && desc.match(/^fixture/i))) {
    console.log(`💡 Generic light fixture "${description}" (category: "${category}") → $0.00 (owner-provided), 1.0hr labor`);
    return { price: 0.00, laborHours: 1.0 };
  }

  // Try exact match first
  for (const [key, value] of Object.entries(FALLBACK_PRICES)) {
    if (desc.includes(key) || cat.includes(key)) {
      console.log(`💡 Using fallback price for "${description}": $${value.price}, ${value.laborHours}hrs`);
      return value;
    }
  }

  // Use default
  console.log(`💡 Using default fallback price for "${description}": $${FALLBACK_PRICES.default.price}, ${FALLBACK_PRICES.default.laborHours}hrs`);
  return FALLBACK_PRICES.default;
}

export interface MaterialPrice {
  category: string;
  description: string;
  unit: string;
  materialCost: number;
  laborHours?: number;
  itemCode?: string;  // Unique identifier for exact matching
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

  // Equipment & Lighting Package
  equipmentCostTotal: number;
  lightingPackageCost: number;

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

      // Lighting - Standard installation is 1.0 hour per fixture
      { code: 'LIGHT-STD-INSTALL', name: 'Standard Lighting Fixture Installation', hours: 1.0 },
      { code: 'LIGHT-2X4', name: '2x4 LED Troffer', hours: 1.0 },
      { code: 'LIGHT-2X2', name: '2x2 LED Troffer', hours: 1.0 },
      { code: 'LIGHT-HIGHBAY', name: 'LED High-Bay', hours: 1.0 },
      { code: 'LIGHT-6IN', name: '6" LED Downlight', hours: 1.0 },
      { code: 'LIGHT-EMER', name: 'Emergency Light', hours: 1.0 },
      { code: 'LIGHT-EXIT', name: 'Exit Sign', hours: 1.0 },

      // Homeruns - 1.0 hour per 100ft homerun (pulling wire + terminating)
      { code: 'HOMERUN-100FT', name: '100ft Homerun Assembly', hours: 1.0 },
      { code: 'GFI-STD', name: 'Standard GFI Installation', hours: 0.5 },

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
   * Get material price object by key
   */
  getMaterialPriceByKey(key: string): MaterialPrice | undefined {
    return this.materialPrices.get(key);
  }

  /**
   * Get material price by item code, category, or description
   * Priority: item_code > exact match > case-insensitive > fuzzy
   */
  getMaterialPrice(category: string, description: string, itemCode?: string): number | undefined {
    // Handle null/undefined values
    if (!description || !category) {
      console.warn(`⚠️ getMaterialPrice: Missing description or category - description: "${description}", category: "${category}"`);
      return undefined;
    }

    // 1. Try item code first (most reliable)
    if (itemCode) {
      for (const price of this.materialPrices.values()) {
        if (price.itemCode === itemCode) {
          if (price.materialCost > 0) {
            console.log(`🔍 ✓ ITEM CODE [${itemCode}] "${description}" → $${price.materialCost}`);
            return price.materialCost;
          } else {
            console.warn(`⚠️ ITEM CODE FOUND BUT ZERO COST [${itemCode}] "${description}" cost=$${price.materialCost}`);
            return price.materialCost; // Return even if 0 to distinguish from "not found"
          }
        }
      }
      console.warn(`⚠️ ITEM CODE NOT FOUND [${itemCode}] "${description}" - falling back to description match`);
    }

    // 2. Try exact match (case-sensitive)
    const exactKey = `${category}::${description}`;
    const exact = this.materialPrices.get(exactKey);
    if (exact && exact.materialCost > 0) {
      console.log(`🔍 ✓ EXACT [${category}] "${description}" → $${exact.materialCost}`);
      return exact.materialCost;
    }

    // 3. Try case-insensitive exact match
    for (const [key, price] of this.materialPrices.entries()) {
      const [dbCat, dbDesc] = key.split('::');
      if (dbCat && dbDesc &&
          dbCat.toLowerCase() === String(category).toLowerCase() &&
          dbDesc.toLowerCase() === String(description).toLowerCase() &&
          price.materialCost > 0) {
        console.log(`🔍 ✓ CASE-INSENSITIVE [${category}] "${description}" → $${price.materialCost}`);
        return price.materialCost;
      }
    }

    // Fuzzy match - normalize and find similar items
    const normDesc = String(description).toLowerCase()
      .replace(/["']/g, '')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .replace(/type/g, '')  // Remove "type" variations
      .trim();

    const keyTerms = normDesc.split(/[,\/]/).filter(t => t.length > 2);

    // Category mapping for fuzzy matching
    // This MUST match ALL 28 categories in the Supabase database EXACTLY
    const normCategory = String(category).toLowerCase().replace(/[&\s]/g, '');
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
   * Priority: item_code > exact match > case-insensitive
   */
  getMaterialLaborHours(category: string, description: string, itemCode?: string): number {
    // 1. Try item code first
    if (itemCode) {
      for (const price of this.materialPrices.values()) {
        if (price.itemCode === itemCode && price.laborHours && price.laborHours > 0) {
          return price.laborHours;
        }
      }
    }

    // 2. Try exact match
    const exactKey = `${category}::${description}`;
    const exact = this.materialPrices.get(exactKey);
    if (exact && exact.laborHours && exact.laborHours > 0) {
      return exact.laborHours;
    }

    // 3. Try case-insensitive match
    for (const [key, price] of this.materialPrices.entries()) {
      const [dbCat, dbDesc] = key.split('::');
      if (dbCat.toLowerCase() === category.toLowerCase() &&
          dbDesc.toLowerCase() === description.toLowerCase() &&
          price.laborHours && price.laborHours > 0) {
        return price.laborHours;
      }
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
    lightingPackageCost?: number;
  } = {}
): ProjectCosts {
  const {
    overheadPercentage = 15.0,
    profitPercentage = 12.0,
    materialTaxRate = 0.085,
    materialShipping = 0,
    equipmentCost = 0,
    lightingPackageCost = 0,
  } = options;

  // Get material breakdown
  const { materials, assemblyUsage } = calculateAssemblyMaterials(pages, tags, assemblies);

  // Calculate material costs
  let materialCostTotal = 0;
  for (const mat of materials) {
    const price = pricingDb.getMaterialPrice(mat.category, mat.description, mat.itemCode);
    if (price) {
      materialCostTotal += mat.totalQty * price;
    } else {
      console.log(`⚠️ No price found for: ${mat.itemCode || ''} ${mat.category}::${mat.description} (qty: ${mat.totalQty})`);
    }
  }

  const materialTax = materialCostTotal * materialTaxRate;
  const materialSubtotal = materialCostTotal + materialTax + materialShipping;

  // Calculate labor costs
  let laborHoursTotal = 0;
  const divisionMap = new Map<string, DivisionCost>();

  // Add all materials to divisions (wire, conduit, boxes, devices, etc.)
  for (const mat of materials) {
    // Debug: log what we're looking up
    if (mat.category.toLowerCase() === 'wire' || mat.itemCode?.startsWith('ITEM-089') || mat.itemCode?.startsWith('ITEM-090')) {
      console.log(`🔍 Looking up WIRE: category="${mat.category}", desc="${mat.description}", itemCode="${mat.itemCode}", qty=${mat.totalQty}`);
    }

    // Try database lookup first
    let laborPerUnit = pricingDb.getMaterialLaborHours(mat.category, mat.description, mat.itemCode);
    let price = pricingDb.getMaterialPrice(mat.category, mat.description, mat.itemCode);

    // If no price found, use fallback
    if (!price || price === 0) {
      const fallback = getFallbackPrice(mat.category, mat.description);
      price = fallback.price;
      laborPerUnit = fallback.laborHours;
    }

    const matCost = mat.totalQty * price;

    // Check for labor override (used for wire pulls where labor is per run, not per foot)
    const materialLaborHours = mat.laborOverride !== undefined
      ? mat.laborOverride
      : laborPerUnit * mat.totalQty;

    // Debug: log result
    if (mat.category.toLowerCase() === 'wire' || mat.itemCode?.startsWith('ITEM-089') || mat.itemCode?.startsWith('ITEM-090')) {
      console.log(`🔍 WIRE lookup result: price=$${price}, laborPerUnit=${laborPerUnit}hrs, matCost=$${matCost}, totalLabor=${materialLaborHours}hrs`);
    }

    // Add to labor total if this material has labor hours
    if (laborPerUnit > 0) {
      laborHoursTotal += materialLaborHours;
      console.log(`⚙️ Material labor: ${mat.category}::${mat.description} = ${mat.totalQty} × ${laborPerUnit} hrs = ${materialLaborHours} hrs`);
    }

    // Track materials in divisions - ALWAYS add, even if no price found yet
    // This ensures wire shows up even if pricing is missing
    const division = mat.category || 'General';
    const existing = divisionMap.get(division);

    console.log(`📊 Adding to division "${division}": ${mat.description} (qty=${mat.totalQty}, $${matCost}, ${materialLaborHours}hrs)`);

    if (matCost > 0 || materialLaborHours > 0 || mat.totalQty > 0) {
      if (matCost === 0 && price === 0 && mat.totalQty > 0) {
        console.warn(`⚠️ NO PRICE: ${mat.category}::${mat.description} (qty: ${mat.totalQty}) - will show $0 in division`);
      } else {
        console.log(`💰 Material cost: ${mat.category}::${mat.description} = ${mat.totalQty} × $${price} = $${matCost}`);
      }

      if (existing) {
        console.log(`  ➕ Adding to EXISTING division "${division}": was $${existing.materialCost.toFixed(2)}, adding $${matCost.toFixed(2)}`);
        existing.materialCost += matCost;
        existing.laborHours += materialLaborHours;
        console.log(`  ✅ Division "${division}" now: $${existing.materialCost.toFixed(2)}, ${existing.laborHours.toFixed(2)}hrs`);
      } else {
        console.log(`  🆕 Creating NEW division "${division}": $${matCost.toFixed(2)}, ${materialLaborHours.toFixed(2)}hrs`);
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

  // Calculate subtotal (includes material, labor, equipment, and lighting package)
  const subtotal = materialSubtotal + laborCostTotal + equipmentCost + lightingPackageCost;

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
    lightingPackageCost,
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
