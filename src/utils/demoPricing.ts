/**
 * Demo Pricing Data
 * Standard electrical pricing for demonstrations
 * NOT STORED - for demo purposes only
 */

export interface DemoPriceItem {
  category: string;
  description: string;
  unit: string;
  materialCost: number;
  vendor?: string;
}

export const DEMO_PRICING_DATA: DemoPriceItem[] = [
  // LIGHTING FIXTURES
  { category: 'Lighting', description: '2x4 LED Troffer', unit: 'EA', materialCost: 75.50, vendor: 'Demo' },
  { category: 'Lighting', description: '2x2 LED Troffer', unit: 'EA', materialCost: 65.00, vendor: 'Demo' },
  { category: 'Lighting', description: '1x4 LED Troffer', unit: 'EA', materialCost: 55.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Downlight', unit: 'EA', materialCost: 45.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Strip Light', unit: 'EA', materialCost: 35.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED High Bay', unit: 'EA', materialCost: 185.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Pendant', unit: 'EA', materialCost: 125.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Wall Pack', unit: 'EA', materialCost: 95.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Bollard', unit: 'EA', materialCost: 350.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'LED Pole Light', unit: 'EA', materialCost: 850.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'Exit Sign', unit: 'EA', materialCost: 45.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'Emergency Light', unit: 'EA', materialCost: 75.00, vendor: 'Demo' },
  { category: 'Lighting', description: 'Exit/Emergency Combo', unit: 'EA', materialCost: 95.00, vendor: 'Demo' },

  // RECEPTACLES
  { category: 'Devices', description: 'Receptacle, 15A Duplex', unit: 'EA', materialCost: 3.25, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, 20A Duplex', unit: 'EA', materialCost: 3.75, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, GFCI 20A', unit: 'EA', materialCost: 18.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, GFCI WP', unit: 'EA', materialCost: 28.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, USB', unit: 'EA', materialCost: 24.75, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, Floor Box', unit: 'EA', materialCost: 125.00, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, Quad', unit: 'EA', materialCost: 6.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, 208V', unit: 'EA', materialCost: 12.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, Twist-Lock 20A', unit: 'EA', materialCost: 18.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Receptacle, Twist-Lock 30A', unit: 'EA', materialCost: 24.50, vendor: 'Demo' },

  // SWITCHES
  { category: 'Devices', description: 'Switch, Single-Pole', unit: 'EA', materialCost: 2.25, vendor: 'Demo' },
  { category: 'Devices', description: 'Switch, 3-Way', unit: 'EA', materialCost: 3.15, vendor: 'Demo' },
  { category: 'Devices', description: 'Switch, 4-Way', unit: 'EA', materialCost: 4.25, vendor: 'Demo' },
  { category: 'Devices', description: 'Dimmer Switch', unit: 'EA', materialCost: 24.75, vendor: 'Demo' },
  { category: 'Devices', description: 'Occupancy Sensor', unit: 'EA', materialCost: 45.00, vendor: 'Demo' },
  { category: 'Devices', description: 'Key Switch', unit: 'EA', materialCost: 18.50, vendor: 'Demo' },
  { category: 'Devices', description: 'Timer Switch', unit: 'EA', materialCost: 35.00, vendor: 'Demo' },

  // PANELS & DISTRIBUTION
  { category: 'Panels', description: 'Panel, 42-Circuit 225A', unit: 'EA', materialCost: 385.00, vendor: 'Demo' },
  { category: 'Panels', description: 'Panel, 30-Circuit 100A', unit: 'EA', materialCost: 225.00, vendor: 'Demo' },
  { category: 'Panels', description: 'Panel, 24-Circuit 100A', unit: 'EA', materialCost: 125.00, vendor: 'Demo' },
  { category: 'Panels', description: 'Disconnect, 60A', unit: 'EA', materialCost: 95.00, vendor: 'Demo' },
  { category: 'Panels', description: 'Disconnect, 100A', unit: 'EA', materialCost: 145.00, vendor: 'Demo' },
  { category: 'Panels', description: 'Disconnect, 200A', unit: 'EA', materialCost: 285.00, vendor: 'Demo' },

  // BREAKERS
  { category: 'Breakers', description: 'Breaker, 1P 15A', unit: 'EA', materialCost: 8.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 1P 20A', unit: 'EA', materialCost: 8.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 2P 20A', unit: 'EA', materialCost: 16.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 2P 30A', unit: 'EA', materialCost: 18.75, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 2P 50A', unit: 'EA', materialCost: 32.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 3P 20A', unit: 'EA', materialCost: 24.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 3P 30A', unit: 'EA', materialCost: 28.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 3P 60A', unit: 'EA', materialCost: 68.50, vendor: 'Demo' },
  { category: 'Breakers', description: 'Breaker, 3P 100A', unit: 'EA', materialCost: 145.00, vendor: 'Demo' },

  // BOXES & FITTINGS
  { category: 'Boxes', description: '4" Square Box, 2-1/8" deep', unit: 'EA', materialCost: 2.45, vendor: 'Demo' },
  { category: 'Boxes', description: '4-11/16" Square Box', unit: 'EA', materialCost: 3.15, vendor: 'Demo' },
  { category: 'Boxes', description: 'Single Gang Box, Metal', unit: 'EA', materialCost: 1.85, vendor: 'Demo' },
  { category: 'Boxes', description: 'Double Gang Box, Metal', unit: 'EA', materialCost: 2.85, vendor: 'Demo' },
  { category: 'Boxes', description: 'Weatherproof Box, Single', unit: 'EA', materialCost: 8.50, vendor: 'Demo' },
  { category: 'Boxes', description: 'Junction Box, 4x4x2', unit: 'EA', materialCost: 4.25, vendor: 'Demo' },
  { category: 'Boxes', description: 'Junction Box, 6x6x4', unit: 'EA', materialCost: 8.50, vendor: 'Demo' },

  // CONDUIT - Match Supabase format exactly
  { category: 'EMT CONDUIT', description: '1/2"EMT Conduit', unit: 'EA', materialCost: 0.72, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '3/4"EMT Conduit', unit: 'EA', materialCost: 1.25, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '1"EMT Conduit', unit: 'EA', materialCost: 2.15, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '1 1/4"EMT Conduit', unit: 'EA', materialCost: 3.59, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '1 1/2"EMT Conduit', unit: 'EA', materialCost: 4.30, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '2"EMT Conduit', unit: 'EA', materialCost: 5.05, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '2 1/2"EMT Conduit', unit: 'EA', materialCost: 7.65, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '3"EMT Conduit', unit: 'EA', materialCost: 9.70, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '3 1/2 EMT Conduit', unit: 'EA', materialCost: 12.80, vendor: 'Demo' },
  { category: 'EMT CONDUIT', description: '4"EMT Conduit', unit: 'EA', materialCost: 13.14, vendor: 'Demo' },

  // WIRE & CABLE - Match Supabase format exactly
  { category: 'wire', description: '#14 THHN Copper Wire,Sol', unit: 'EA', materialCost: 0.13, vendor: 'Demo' },
  { category: 'wire', description: '#14 THHN Copper Wire,Str', unit: 'EA', materialCost: 0.13, vendor: 'Demo' },
  { category: 'wire', description: '#12 THHN Copper Wire,Sol', unit: 'EA', materialCost: 0.19, vendor: 'Demo' },
  { category: 'wire', description: '#12 THHN Copper Wire,Str', unit: 'EA', materialCost: 0.19, vendor: 'Demo' },
  { category: 'wire', description: '#10 THHN Copper Wire,Sol', unit: 'EA', materialCost: 0.30, vendor: 'Demo' },
  { category: 'wire', description: '#10 THHN Copper Wire,Str', unit: 'EA', materialCost: 0.30, vendor: 'Demo' },
  { category: 'wire', description: '#8 THHN Copper Wire,Str', unit: 'EA', materialCost: 0.52, vendor: 'Demo' },
  { category: 'wire', description: '#6 THHN Copper Wire,Str', unit: 'EA', materialCost: 0.78, vendor: 'Demo' },
  { category: 'wire', description: '#4 THHN Copper Wire,Str', unit: 'EA', materialCost: 1.33, vendor: 'Demo' },
  { category: 'wire', description: '#2 THHN Copper Wire,Str', unit: 'EA', materialCost: 2.10, vendor: 'Demo' },
  { category: 'wire', description: '#1 THHN Copper Wire,Str', unit: 'EA', materialCost: 2.53, vendor: 'Demo' },
  { category: 'Wire', description: '12/2 MC Cable', unit: 'FT', materialCost: 1.25, vendor: 'Demo' },
  { category: 'Wire', description: '12/3 MC Cable', unit: 'FT', materialCost: 1.65, vendor: 'Demo' },
  { category: 'Wire', description: '10/3 MC Cable', unit: 'FT', materialCost: 2.25, vendor: 'Demo' },

  // DATA/COMM
  { category: 'Data/Comm', description: 'CAT6 Cable', unit: 'FT', materialCost: 0.25, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'CAT6A Cable', unit: 'FT', materialCost: 0.35, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'CAT6 Outlet', unit: 'EA', materialCost: 8.50, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'CAT6A Outlet', unit: 'EA', materialCost: 12.50, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'Fiber Cable, SM', unit: 'FT', materialCost: 1.25, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'Coax Cable, RG6', unit: 'FT', materialCost: 0.35, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'Data Rack, 42U', unit: 'EA', materialCost: 850.00, vendor: 'Demo' },
  { category: 'Data/Comm', description: 'Patch Panel, 48-Port', unit: 'EA', materialCost: 125.00, vendor: 'Demo' },

  // FIRE ALARM
  { category: 'Fire Alarm', description: 'Smoke Detector', unit: 'EA', materialCost: 45.00, vendor: 'Demo' },
  { category: 'Fire Alarm', description: 'Heat Detector', unit: 'EA', materialCost: 38.00, vendor: 'Demo' },
  { category: 'Fire Alarm', description: 'Pull Station', unit: 'EA', materialCost: 35.00, vendor: 'Demo' },
  { category: 'Fire Alarm', description: 'Horn/Strobe', unit: 'EA', materialCost: 65.00, vendor: 'Demo' },
  { category: 'Fire Alarm', description: 'FA Control Panel', unit: 'EA', materialCost: 1850.00, vendor: 'Demo' },

  // MOTOR CONTROLS
  { category: 'Equipment', description: 'Motor Starter, 3HP', unit: 'EA', materialCost: 285.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'Motor Starter, 5HP', unit: 'EA', materialCost: 325.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'Motor Starter, 10HP', unit: 'EA', materialCost: 485.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'VFD, 5HP', unit: 'EA', materialCost: 850.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'VFD, 10HP', unit: 'EA', materialCost: 1250.00, vendor: 'Demo' },

  // HVAC EQUIPMENT
  { category: 'Equipment', description: 'RTU Whip Assembly', unit: 'EA', materialCost: 125.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'Condenser Disconnect', unit: 'EA', materialCost: 85.00, vendor: 'Demo' },
  { category: 'Equipment', description: 'Furnace Disconnect', unit: 'EA', materialCost: 75.00, vendor: 'Demo' },

  // SECURITY
  { category: 'Security', description: 'IP Camera', unit: 'EA', materialCost: 285.00, vendor: 'Demo' },
  { category: 'Security', description: 'Card Reader', unit: 'EA', materialCost: 195.00, vendor: 'Demo' },
  { category: 'Security', description: 'Magnetic Lock', unit: 'EA', materialCost: 225.00, vendor: 'Demo' },
  { category: 'Security', description: 'Access Control Panel', unit: 'EA', materialCost: 850.00, vendor: 'Demo' },

  // EV CHARGING
  { category: 'Equipment', description: 'EV Charger, Level 2', unit: 'EA', materialCost: 850.00, vendor: 'Demo' }
];

/**
 * Load demo pricing into a PricingDatabase instance
 */
export function loadDemoPricing(pricingDb: any): number {
  let loaded = 0;

  for (const item of DEMO_PRICING_DATA) {
    const key = `${item.category}::${item.description}`;
    pricingDb.setMaterialPrice(key, {
      category: item.category,
      description: item.description,
      unit: item.unit,
      materialCost: item.materialCost,
      vendor: item.vendor
    });
    loaded++;
  }

  return loaded;
}