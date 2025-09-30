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
   * Get material price by description (with fuzzy matching)
   */
  getMaterialPrice(category: string, description: string): number | undefined {
    // Try exact match first
    const exactKey = `${category}::${description}`;
    const exact = this.materialPrices.get(exactKey);
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
    const normCategory = category.toLowerCase();
    const categoryMatches = (dbCat: string): boolean => {
      const dbCatLower = dbCat.toLowerCase();

      // Direct category matches
      if (normCategory === dbCatLower) return true;

      // Map common assembly categories to database categories
      if (normCategory === 'fittings' && (dbCatLower.includes('flex') || dbCatLower.includes('conduit') || dbCatLower.includes('coupling'))) return true;
      if (normCategory === 'devices' && (dbCatLower.includes('box') || dbCatLower.includes('plate'))) return true;
      if (normCategory === 'wire' && dbCatLower.includes('cable')) return true;
      if (normCategory === 'conduit' && dbCatLower.includes('conduit')) return true;

      return false;
    };

    // Search for matches across related categories
    for (const [key, price] of this.materialPrices.entries()) {
      if (!categoryMatches(price.category) || !price.materialCost || price.materialCost <= 0) continue;

      const dbDesc = price.description.toLowerCase()
        .replace(/["']/g, '')
        .replace(/\s+/g, '')
        .replace(/-/g, '');

      // Check if database description contains assembly key terms
      if (keyTerms.some(term => dbDesc.includes(term))) {
        return price.materialCost;
      }
    }

    return undefined;
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
    }
  }

  const materialTax = materialCostTotal * materialTaxRate;
  const materialSubtotal = materialCostTotal + materialTax + materialShipping;

  // Calculate labor costs
  let laborHoursTotal = 0;
  const divisionMap = new Map<string, DivisionCost>();

  for (const usage of assemblyUsage) {
    const hoursPerUnit = pricingDb.getLaborHours(usage.code);
    const totalHours = hoursPerUnit * usage.count;
    laborHoursTotal += totalHours;

    // Track by division (category of first material in assembly)
    const division = usage.materials[0]?.category || 'General';
    const materialCost = usage.materials.reduce((sum, m) => {
      const price = pricingDb.getMaterialPrice(m.category, m.description) || 0;
      return sum + (m.totalQty * price);
    }, 0);

    const existing = divisionMap.get(division);
    if (existing) {
      existing.materialCost += materialCost;
      existing.laborHours += totalHours;
    } else {
      divisionMap.set(division, {
        division,
        materialCost,
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
  for (const [division, cost] of divisionMap.entries()) {
    cost.laborCost = cost.laborHours * laborRate;
    cost.totalCost = cost.materialCost + cost.laborCost;

    // Apply proportional overhead and profit
    const divisionWithOH = cost.totalCost * (1 + overheadPercentage / 100);
    cost.sellPrice = divisionWithOH * (1 + profitPercentage / 100);

    divisionBreakdown.push(cost);
  }

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
