import { Assembly } from '@/types';

export const STANDARD_ASSEMBLIES: Assembly[] = [
  // ============================================================================
  // RECEPTACLES - Commercial, TI, Multi-Use
  // ============================================================================
  {
    id: 'recep-20a-std',
    code: 'RECEP-20A',
    name: 'Standard 20A Receptacle Assembly',
    description: 'Commercial TI standard receptacle kit per NEC - 20A, 125V duplex outlet with box, mud ring, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'NEC standard for commercial receptacles' },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang, 1/2" or 5/8"', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-20a-125v', description: 'Duplex Receptacle, 20A, 125V, NEMA 5-20R (spec grade)', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-coupling-3/4', description: 'EMT Coupling, 3/4", steel', unit: 'EA', quantityPer: 0.1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-15a-std',
    code: 'RECEP-15A',
    name: 'Standard 15A Receptacle Assembly',
    description: 'Residential/light commercial 15A receptacle kit',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-15a-125v', description: 'Duplex Receptacle, 15A, 125V, NEMA 5-15R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-coupling-3/4', description: 'EMT Coupling, 3/4", steel', unit: 'EA', quantityPer: 0.1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-gfci-20a',
    code: 'RECEP-GFCI-20A',
    name: 'GFCI Receptacle 20A Assembly',
    description: 'Ground Fault Circuit Interrupter receptacle for wet locations, kitchens, bathrooms per NEC 210.8',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper box for GFCI device' },
      { id: 'mudring-1g-deep', description: 'Raised Device Cover / Mud Ring, single-gang, 5/8" depth', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-gfci-20a', description: 'GFCI Duplex Receptacle, 20A, 125V, self-test', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'UL listed, tamper resistant' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-coupling-3/4', description: 'EMT Coupling, 3/4", steel', unit: 'EA', quantityPer: 0.1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-iso-gnd-20a',
    code: 'RECEP-IG-20A',
    name: 'Isolated Ground Receptacle 20A Assembly',
    description: 'Isolated ground receptacle for sensitive electronic equipment - hospitals, data centers, AV systems',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-ig-20a', description: 'Isolated Ground Duplex Receptacle, 20A, 125V (orange)', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Orange face, hospital grade' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-wire-ig-12', description: '#12 CU insulated green wire for isolated ground', unit: 'FT', quantityPer: 10, category: 'Grounding', wasteFactor: 1.10, notes: 'Run back to source' }
    ]
  },
  {
    id: 'recep-wp-20a',
    code: 'RECEP-WP-20A',
    name: 'Weather-Proof Receptacle 20A Assembly',
    description: 'Outdoor/wet location GFCI receptacle with in-use cover per NEC 406.9',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-fs-1g-wp', description: 'FS Box, single-gang, 2" deep, weather-proof', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-gfci-20a-wp', description: 'GFCI Receptacle, 20A, 125V, WR (weather resistant)', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'cover-wp-1g-inuse', description: 'Weather-Proof In-Use Cover, single-gang, clear', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'UL extra-duty, while-in-use' },
      { id: 'gasket-wp', description: 'Foam gasket for weather-proof box', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4-comp', description: 'EMT Connector, 3/4", compression type (wet location)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-floor-20a',
    code: 'RECEP-FLOOR-20A',
    name: 'Floor Receptacle 20A Assembly',
    description: 'Floor-mounted receptacle for open office, conference rooms - adjustable height',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-floor-adj', description: 'Floor Box, adjustable depth, steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'For concrete pour or wood deck' },
      { id: 'recep-floor-20a', description: 'Floor Receptacle Insert, 20A duplex', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'cover-floor-brass', description: 'Floor Box Cover, brass or nickel, flip-lid', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05, notes: 'Typically 2 feeds or loop' }
    ]
  },
  {
    id: 'recep-usb-combo',
    code: 'RECEP-USB-COMBO',
    name: 'USB Combo Receptacle Assembly',
    description: 'Duplex receptacle with built-in USB charging ports (Type-A or Type-C) - modern TI standard',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-usb-20a', description: 'Duplex Receptacle with USB-A/C, 20A, 125V, 3.6A USB', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Combo device, tamper resistant' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // SWITCHES - Commercial, TI, Multi-Use
  // ============================================================================
  {
    id: 'switch-sp-20a',
    code: 'SWITCH-1P',
    name: 'Single-Pole Switch 20A Assembly',
    description: 'Standard single-pole switch for general lighting control',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'switch-sp-20a', description: 'Single-Pole Switch, 20A, 120/277V, spec grade', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'switch-3way-20a',
    code: 'SWITCH-3WAY',
    name: '3-Way Switch 20A Assembly',
    description: '3-way switch for two-location control (hallways, stairs, large rooms)',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'switch-3way-20a', description: '3-Way Switch, 20A, 120/277V, spec grade', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'switch-4way-20a',
    code: 'SWITCH-4WAY',
    name: '4-Way Switch 20A Assembly',
    description: '4-way switch for three+ location control (middle position in 3-way circuit)',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'switch-4way-20a', description: '4-Way Switch, 20A, 120/277V, spec grade', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'switch-dimmer-led',
    code: 'SWITCH-DIM-LED',
    name: 'LED Dimmer Switch Assembly',
    description: 'LED-compatible dimmer switch (forward phase or ELV) for modern lighting',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper for dimmer device' },
      { id: 'mudring-1g-deep', description: 'Raised Device Cover / Mud Ring, single-gang, 5/8"', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-led-600w', description: 'LED Dimmer, 600W, 120V, 3-way capable, spec grade', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Forward phase control' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'switch-occ-sensor',
    code: 'SWITCH-OCC',
    name: 'Occupancy Sensor Switch Assembly',
    description: 'PIR/ultrasonic occupancy sensor switch for energy code compliance (Title 24, ASHRAE 90.1)',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-deep', description: 'Raised Device Cover / Mud Ring, single-gang, 5/8"', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'occ-sensor-switch', description: 'Occupancy Sensor Switch, PIR/ultrasonic, 120/277V, 800W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Self-contained, wall-mount' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'switch-timer',
    code: 'SWITCH-TIMER',
    name: 'Timer Switch Assembly',
    description: 'Programmable timer switch for exhaust fans, exterior lighting, irrigation',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-deep', description: 'Raised Device Cover / Mud Ring, single-gang, 5/8"', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'timer-switch-digital', description: 'Digital Timer Switch, 7-day programmable, 15A, 120V', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // LIGHTING FIXTURES - Commercial, TI
  // ============================================================================
  {
    id: 'light-troffer-2x4-led',
    code: 'LIGHT-2X4-LED',
    name: '2x4 LED Troffer Assembly',
    description: 'Standard 2x4 LED troffer for drop ceiling grid - most common commercial fixture',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fixture-ring', description: 'Fixture Ring/Raised Cover for 4" box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'whip-mc-6ft', description: 'MC Cable Whip, 6 ft, 12/2 or 12/3, armored', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02, notes: 'Box to fixture connection' },
      { id: 'mc-connector-3/8', description: 'MC Cable Connector, 3/8", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for fixture connections', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'light-troffer-2x2-led',
    code: 'LIGHT-2X2-LED',
    name: '2x2 LED Troffer Assembly',
    description: '2x2 LED troffer for 2x2 drop ceiling grid',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fixture-ring', description: 'Fixture Ring/Raised Cover for 4" box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'whip-mc-6ft', description: 'MC Cable Whip, 6 ft, 12/2, armored', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'mc-connector-3/8', description: 'MC Cable Connector, 3/8", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for fixture connections', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'light-highbay-led',
    code: 'LIGHT-HIGHBAY',
    name: 'LED High-Bay Fixture Assembly',
    description: 'Industrial high-bay LED fixture for warehouses, manufacturing (150W-240W)',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep with fixture studs', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fixture-ring-heavy', description: 'Heavy-Duty Fixture Ring for 4" box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'whip-soow-10ft', description: 'SOOW Cord, 10 ft, 12/3, strain relief', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02, notes: 'Flexible cord for vibration' },
      { id: 'cord-grip', description: 'Cord Grip/Strain Relief, 1/2", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'safety-cable', description: 'Safety Cable/Aircraft Cable, 1/16", 10 ft', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02, notes: 'Secondary support per code' }
    ]
  },
  {
    id: 'light-downlight-6in',
    code: 'LIGHT-DOWN-6IN',
    name: '6" LED Downlight Assembly',
    description: 'Recessed 6" LED downlight for drywall or drop ceiling',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fixture-ring', description: 'Fixture Ring/Raised Cover for 4" box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'romex-nm-10ft', description: 'NM Cable (Romex), 10 ft, 14/2, for fixture whip', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02, notes: 'Plenum if required' },
      { id: 'romex-connector', description: 'NM Cable Connector, 1/2", plastic', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-connector-1/2', description: 'EMT Connector, 1/2", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for fixture connections', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'light-emergency-led',
    code: 'LIGHT-EMER',
    name: 'LED Emergency Light Assembly',
    description: 'Dual-head emergency light with battery backup per NEC 700',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling/wall rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'mounting-hardware', description: 'Fixture mounting screws and anchors', unit: 'SET', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for emergency light', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'light-exit-sign',
    code: 'LIGHT-EXIT',
    name: 'LED Exit Sign Assembly',
    description: 'LED exit sign with battery backup per NEC 700, IBC',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling/wall rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'mounting-hardware', description: 'Fixture mounting screws and universal mount', unit: 'SET', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for exit sign', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // JUNCTION BOXES
  // ============================================================================
  {
    id: 'jbox-4x4',
    code: 'JBOX-4X4',
    name: 'Junction Box 4" x 4"',
    description: 'Standard 4" square junction box with blank cover for splicing',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper for splice capacity' },
      { id: 'cover-blank-4sq', description: 'Blank Cover, 4" square, flat', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05, notes: 'Average 3 entries per J-box' },
      { id: 'wirenuts-assorted', description: 'Wire Nuts, assorted sizes (yellow/red/blue)', unit: 'PKG', quantityPer: 0.5, category: 'Fittings', wasteFactor: 1.02, notes: 'Estimate 1 pkg per 2 boxes' }
    ]
  },
  {
    id: 'jbox-4x4-deep',
    code: 'JBOX-4X4-DEEP',
    name: 'Junction Box 4-11/16" x 4-11/16"',
    description: 'Large junction box for multi-circuit splicing or box fill requirements',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'box-4-11/16-2.125', description: '4-11/16" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'cover-blank-4-11/16', description: 'Blank Cover, 4-11/16" square, flat', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 4, category: 'Fittings', wasteFactor: 1.05, notes: 'Average 4 entries for multi-circuit box' },
      { id: 'wirenuts-assorted', description: 'Wire Nuts, assorted sizes', unit: 'PKG', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'jbox-pullbox-8x8',
    code: 'PULLBOX-8X8',
    name: 'Pull Box 8" x 8" x 4"',
    description: 'Medium pull box for wire pulling, feeder splices, NEC 314.28 compliance',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'pullbox-8x8x4', description: 'Pull Box, 8"x8"x4", NEMA 1, screw cover', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 4, category: 'Fittings', wasteFactor: 1.05, notes: 'For larger conduit' },
      { id: 'wirenuts-large', description: 'Large Wire Nuts (gray/orange) for feeders', unit: 'PKG', quantityPer: 0.5, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'jbox-pullbox-12x12',
    code: 'PULLBOX-12X12',
    name: 'Pull Box 12" x 12" x 6"',
    description: 'Large pull box for feeder/service entrance, multiple large conduits',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'pullbox-12x12x6', description: 'Pull Box, 12"x12"x6", NEMA 1, hinged cover', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-1.25in', description: 'EMT Connector, 1-1/4", steel', unit: 'EA', quantityPer: 4, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-large', description: 'Large Wire Nuts (gray/orange)', unit: 'PKG', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1-1/4", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // DATA / COMMUNICATIONS - Commercial TI
  // ============================================================================
  {
    id: 'data-cat6-jack',
    code: 'DATA-CAT6',
    name: 'CAT6 Data Jack Assembly',
    description: 'CAT6 RJ45 jack with box and plate for structured cabling',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-low-volt', description: 'Low-Voltage Mud Ring, single-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'cat6-jack', description: 'CAT6 RJ45 Keystone Jack, UTP, TIA-568-B', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05, notes: '1Gbps rated' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel (for power nearby)', unit: 'EA', quantityPer: 0, category: 'Fittings', wasteFactor: 1.05, notes: 'Data only - no power' }
    ]
  },
  {
    id: 'data-cat6a-jack',
    code: 'DATA-CAT6A',
    name: 'CAT6A Data Jack Assembly',
    description: 'CAT6A RJ45 jack for 10Gbps applications (hospitals, data centers)',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-low-volt', description: 'Low-Voltage Mud Ring, single-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'cat6a-jack', description: 'CAT6A RJ45 Keystone Jack, shielded (STP), TIA-568-B', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05, notes: '10Gbps rated' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'data-fiber-jack',
    code: 'DATA-FIBER',
    name: 'Fiber Optic Jack Assembly',
    description: 'SC or LC fiber optic jack assembly for backbone/high-speed connections',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-low-volt', description: 'Low-Voltage Mud Ring, single-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fiber-jack-sc', description: 'Fiber Optic SC Duplex Keystone Jack (multi-mode or single-mode)', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'data-av-combo',
    code: 'DATA-AV-COMBO',
    name: 'AV Combo Plate Assembly',
    description: 'Multi-port AV plate: HDMI, CAT6, audio (conference rooms, classrooms)',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper for cable volume' },
      { id: 'mudring-2g-low-volt', description: 'Low-Voltage Mud Ring, two-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'hdmi-jack', description: 'HDMI Keystone Jack, female-to-female', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'cat6-jack', description: 'CAT6 RJ45 Keystone Jack, UTP', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'audio-jack-3.5mm', description: '3.5mm Audio Keystone Jack, stereo', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'plate-ss-2g', description: 'Device Cover Plate, two-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'data-coax-jack',
    code: 'DATA-COAX',
    name: 'Coax (Cable TV) Jack Assembly',
    description: 'RG6 coax F-connector jack for cable TV, CCTV, CATV distribution',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-low-volt', description: 'Low-Voltage Mud Ring, single-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'coax-jack-rg6', description: 'Coax F-Connector Keystone Jack, RG6, 3GHz', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // PANELS & DISTRIBUTION
  // ============================================================================
  {
    id: 'panel-42ckt-225a',
    code: 'PANEL-42CKT',
    name: 'Panel 42-Circuit 225A Assembly',
    description: 'Main distribution panel 42-circuit, 225A MLO (Main Lug Only) - commercial/TI standard',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-42-225a-mlo', description: 'Panel, 42-circuit, 225A MLO, 120/208V 3-phase, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00, notes: 'Ordered exact' },
      { id: 'panel-trim-surface', description: 'Panel Trim/Cover, surface mount, painted steel', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 },
      { id: 'breaker-blank', description: 'Breaker Blanks/Filler Plates', unit: 'SET', quantityPer: 1, category: 'Panels', wasteFactor: 1.02 },
      { id: 'panel-label-kit', description: 'Panel Directory Label Kit, self-adhesive', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 },
      { id: 'grounding-bar-addon', description: 'Additional Grounding Bar, 12-lug, copper', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'subpanel-24ckt-100a',
    code: 'PANEL-24CKT',
    name: 'Subpanel 24-Circuit 100A Assembly',
    description: 'Subpanel 24-circuit, 100A MLO for tenant spaces, remote locations',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-24-100a-mlo', description: 'Subpanel, 24-circuit, 100A MLO, 120/208V 3-phase', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 },
      { id: 'panel-trim-surface', description: 'Panel Trim/Cover, surface mount', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 },
      { id: 'breaker-blank', description: 'Breaker Blanks/Filler Plates', unit: 'SET', quantityPer: 1, category: 'Panels', wasteFactor: 1.02 },
      { id: 'panel-label-kit', description: 'Panel Directory Label Kit', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 },
      { id: 'grounding-bar-addon', description: 'Additional Grounding Bar, 12-lug, copper', unit: 'EA', quantityPer: 0.5, category: 'Grounding', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'panel-100a',
    code: '100/MLO/3 Pole',
    name: 'Panel 100A Assembly',
    description: '100A panel from master database',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-100a', description: '100 AMP PANEL', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'panel-200a',
    code: '200/MLO/3 Pole',
    name: 'Panel 200A Assembly',
    description: '200A panel from master database',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-200a', description: '200 AMP PANEL', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'panel-400a',
    code: '400/MLO/3 Pole',
    name: 'Panel 400A Assembly',
    description: '400A panel from master database',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-400a', description: '400 AMP PANEL', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'panel-600a-mlo-3p',
    code: '600/MLO/3 Pole',
    name: 'Panel 600A MLO 3-Pole Assembly',
    description: '600A Main Lug Only panel, 3-phase, 120/208V or 277/480V, 42-circuit minimum',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-600a', description: '600 AMP PANEL', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00, notes: 'From master pricing database' }
    ]
  },
  {
    id: 'panel-800a',
    code: '800/MLO/3 Pole',
    name: 'Panel 800A Assembly',
    description: '800A panel from master database',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'panel-800a', description: '800 AMP PANEL', unit: 'EA', quantityPer: 1, category: 'Panels', wasteFactor: 1.00 }
    ]
  },

  // ============================================================================
  // DIMMERS - From Master Database
  // ============================================================================
  {
    id: 'dim-600w-sp',
    code: 'DIM',
    name: 'Dimmer 600W Single-Pole',
    description: '600W dimmer switch from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-600w-sp', description: 'Dimmer Switch, Single-Pole, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-600w-3w',
    code: 'DIM-3W',
    name: 'Dimmer 600W 3-Way',
    description: '600W 3-way dimmer switch from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-600w-3w', description: 'Dimmer Switch, Three-Way, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-1000w-sp',
    code: 'DIM-1000W',
    name: 'Dimmer 1000W Single-Pole',
    description: '1000W dimmer switch from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-1000w', description: '1000 Watt Dimmer,Decora', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-1500w-sp',
    code: 'DIM-1500W',
    name: 'Dimmer 1500W Single-Pole',
    description: '1500W dimmer switch from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-1500w', description: '1500 Watt Dimmer,Decora', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-2000w-sp',
    code: 'DIM-2000W',
    name: 'Dimmer 2000W Single-Pole',
    description: '2000W dimmer switch from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-2000w', description: '2000 Watt Dimmer,Decora', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-wall-control',
    code: 'DIM-WC',
    name: 'Dimming Wall Control Station',
    description: 'Dimming wall control 0-10V or DALI from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-wc', description: 'Dimming Wall Control Station, 0-10V or DALI', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'dim-ml-master',
    code: 'DIM-ML',
    name: 'Multi-Location Master Dimmer 600W',
    description: 'Multi-location master dimmer from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'dim-ml', description: 'Multi-Location Master Dimmer, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.00 }
    ]
  },

  // ============================================================================
  // DISCONNECTS - From Master Database
  // ============================================================================
  {
    id: 'disc-30a-3p',
    code: '30/3',
    name: 'Disconnect 30A 3-Pole',
    description: '30A 3-phase disconnect from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'disc-30-3p', description: '30A/240V/3PH/F/N3/DISC.', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'disc-60a-3p',
    code: '60/3',
    name: 'Disconnect 60A 3-Pole',
    description: '60A 3-phase disconnect from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'disc-60-3p', description: '60A/240V/3PH/F/N3/DISC.', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'disc-100a-3p',
    code: '100/3',
    name: 'Disconnect 100A 3-Pole',
    description: '100A 3-phase disconnect from master database',
    type: 'device',
    isActive: true,
    items: [
      { id: 'disc-100-3p', description: '100A/240V/3PH/F/N3/DISC.', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 }
    ]
  },
  {
    id: 'disconnect-60a-nf',
    code: 'DISC-60A-NF',
    name: 'Non-Fused Disconnect 60A Assembly',
    description: 'Non-fused safety disconnect switch, 60A, 3-pole, NEMA 1 (indoor)',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'disconnect-60a-nf', description: 'Safety Disconnect, 60A, 3P, 240V, non-fused, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05, notes: 'Line and load side' },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'disconnect-100a-f',
    code: 'DISC-100A-F',
    name: 'Fused Disconnect 100A Assembly',
    description: 'Fused safety disconnect with Class J fuses, 100A, 3-pole, NEMA 3R (outdoor)',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'disconnect-100a-fused', description: 'Safety Disconnect, 100A, 3P, 240V, fused, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 },
      { id: 'fuse-class-j-100a', description: 'Class J Time-Delay Fuses, 100A, 600V', unit: 'EA', quantityPer: 3, category: 'Disconnects', wasteFactor: 1.02 },
      { id: 'emt-connector-1.25in-comp', description: 'EMT Connector, 1-1/4", compression (wet location)', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1-1/4", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // FIRE ALARM / LIFE SAFETY
  // ============================================================================
  {
    id: 'fa-smoke-detector',
    code: 'FA-SMOKE',
    name: 'Fire Alarm Smoke Detector Assembly',
    description: 'Addressable smoke detector with base for commercial fire alarm system',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep (red if fire alarm)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fa-smoke-base', description: 'Smoke Detector Base, addressable, twist-lock', unit: 'EA', quantityPer: 1, category: 'Fire Alarm', wasteFactor: 1.02 },
      { id: 'fa-smoke-head', description: 'Smoke Detector Head, photoelectric, addressable', unit: 'EA', quantityPer: 1, category: 'Fire Alarm', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel (red conduit)', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'fa-end-line-resistor', description: 'End-of-Line Resistor (if required by system)', unit: 'EA', quantityPer: 0.1, category: 'Fire Alarm', wasteFactor: 1.02, notes: 'Typically 1 per zone' }
    ]
  },
  {
    id: 'fa-pull-station',
    code: 'FA-PULL',
    name: 'Fire Alarm Pull Station Assembly',
    description: 'Manual fire alarm pull station with backbox, addressable or conventional',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep (red if fire alarm)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fa-pull-station', description: 'Manual Pull Station, addressable, single-action', unit: 'EA', quantityPer: 1, category: 'Fire Alarm', wasteFactor: 1.02 },
      { id: 'fa-surface-mount-kit', description: 'Surface Mount Kit for pull station (if not recessed)', unit: 'EA', quantityPer: 0.5, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'fa-horn-strobe',
    code: 'FA-HORN-STROBE',
    name: 'Fire Alarm Horn/Strobe Assembly',
    description: 'Combination horn/strobe notification appliance, wall mount, ADA compliant',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep (red if fire alarm)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'fa-horn-strobe', description: 'Horn/Strobe, 24VDC, wall mount, red, ADA candela', unit: 'EA', quantityPer: 1, category: 'Fire Alarm', wasteFactor: 1.02, notes: '15/75 or 110 cd per specs' },
      { id: 'fa-surface-mount-kit', description: 'Surface Mount Kit for horn/strobe', unit: 'EA', quantityPer: 0.5, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // SPECIALTY / SECURITY
  // ============================================================================
  {
    id: 'security-camera-ip',
    code: 'SEC-CAM-IP',
    name: 'IP Security Camera Assembly',
    description: 'IP network security camera (dome or bullet) with mounting box and POE',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, ceiling/wall rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'camera-mount-adapter', description: 'Camera Mounting Adapter/Bracket for 4" box', unit: 'EA', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel (for CAT6 cable protection)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'cat6-patch-3ft', description: 'CAT6 Patch Cable, 3 ft, for camera connection', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05, notes: 'If not hardwired' }
    ]
  },
  {
    id: 'security-card-reader',
    code: 'SEC-CARD-READER',
    name: 'Card Reader (Access Control) Assembly',
    description: 'Proximity card reader with backbox for door access control',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-low-volt', description: 'Low-Voltage Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'card-reader-prox', description: 'Proximity Card Reader (HID or similar)', unit: 'EA', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel (for low-volt cable)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'security-mag-lock',
    code: 'SEC-MAG-LOCK',
    name: 'Magnetic Door Lock Assembly',
    description: 'Electromagnetic door lock (mag lock) 1200 lb holding force with power supply',
    type: 'device',
    isActive: true,
    items: [
      { id: 'mag-lock-1200lb', description: 'Magnetic Door Lock, 1200 lb, 12/24VDC', unit: 'EA', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'mag-lock-bracket', description: 'Mounting Brackets for mag lock (door + frame)', unit: 'SET', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'power-supply-12vdc-5a', description: 'Power Supply, 12VDC, 5A, with battery backup', unit: 'EA', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep (for power supply)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'security-door-contact',
    code: 'SEC-DOOR-CONTACT',
    name: 'Door Contact (Magnetic Switch) Assembly',
    description: 'Surface-mount magnetic door contact for alarm/access control systems',
    type: 'device',
    isActive: true,
    items: [
      { id: 'door-contact-mag', description: 'Magnetic Door Contact, surface mount, NO/NC', unit: 'EA', quantityPer: 1, category: 'Security', wasteFactor: 1.02 },
      { id: 'box-1g-surface', description: 'Single-Gang Surface Box, plastic (for low-voltage)', unit: 'EA', quantityPer: 0.5, category: 'Boxes', wasteFactor: 1.02, notes: 'If junction needed' },
      { id: 'emt-connector-1/2', description: 'EMT Connector, 1/2", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // POWER & SPECIAL CIRCUITS
  // ============================================================================
  {
    id: 'recep-208v-20a',
    code: 'RECEP-208V-20A',
    name: '208V Single-Phase Receptacle 20A Assembly',
    description: '208V single-phase receptacle NEMA 6-20R for equipment, welders, small machinery',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-208v-20a', description: 'Single Receptacle, 20A, 208V, NEMA 6-20R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-240v-30a',
    code: 'RECEP-240V-30A',
    name: '240V 30A Receptacle Assembly',
    description: '240V 30A receptacle NEMA 6-30R or L6-30R twist-lock for heavy equipment',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-2g', description: 'Raised Device Cover / Mud Ring, two-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-240v-30a', description: 'Single Receptacle, 30A, 240V, NEMA 6-30R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-2g', description: 'Device Cover Plate, two-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-10', description: '#10 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-50a-range',
    code: 'RECEP-50A-RANGE',
    name: '50A Range/Oven Receptacle Assembly',
    description: '50A range/oven receptacle NEMA 14-50R, 125/250V for commercial kitchens',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-2g-deep', description: 'Raised Device Cover / Mud Ring, two-gang, deep', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-50a-range', description: 'Range Receptacle, 50A, 125/250V, NEMA 14-50R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-2g', description: 'Device Cover Plate, two-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-1.25in', description: 'EMT Connector, 1-1/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-8', description: '#8 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'recep-twist-lock-30a',
    code: 'RECEP-L5-30',
    name: '30A Twist-Lock Receptacle Assembly',
    description: '30A twist-lock receptacle NEMA L5-30R for generators, temporary power',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-l5-30r', description: 'Twist-Lock Receptacle, 30A, 125V, NEMA L5-30R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-10', description: '#10 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'welding-outlet-50a',
    code: 'WELDING-50A',
    name: 'Welding Receptacle 50A Assembly',
    description: 'Welding receptacle 50A, NEMA 6-50R, 250V for shop welders',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-2g-deep', description: 'Raised Device Cover / Mud Ring, two-gang, deep', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-6-50r', description: 'Receptacle, 50A, 250V, NEMA 6-50R', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-2g', description: 'Device Cover Plate, two-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-1.25in', description: 'EMT Connector, 1-1/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-8', description: '#8 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // MOTOR CONTROL & INDUSTRIAL
  // ============================================================================
  {
    id: 'motor-starter-3hp',
    code: 'MOTOR-3HP',
    name: 'Motor Starter 3HP Assembly',
    description: 'Magnetic motor starter, 3HP, 230V, NEMA size 1 with disconnect and overload',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'motor-starter-3hp', description: 'Motor Starter, 3HP, 230V, NEMA 1, with overload', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'enclosure-nema1-12x16', description: 'NEMA 1 Enclosure, 12"x16"x6", steel', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'disconnect-30a-nf', description: 'Fusible Disconnect, 30A, 240V, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05, notes: 'Line, load, control' },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'motor-starter-10hp',
    code: 'MOTOR-10HP',
    name: 'Motor Starter 10HP Assembly',
    description: 'Magnetic motor starter, 10HP, 480V, NEMA size 2 with disconnect',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'motor-starter-10hp', description: 'Motor Starter, 10HP, 480V, NEMA 2, with overload', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'enclosure-nema1-16x20', description: 'NEMA 1 Enclosure, 16"x20"x8", steel', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'disconnect-60a-f', description: 'Fused Disconnect, 60A, 480V, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'emt-connector-1.25in', description: 'EMT Connector, 1-1/4", steel', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1-1/4", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'vfd-5hp',
    code: 'VFD-5HP',
    name: 'Variable Frequency Drive 5HP Assembly',
    description: 'VFD, 5HP, 480V, with disconnect and bypass contactor',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'vfd-5hp', description: 'Variable Frequency Drive, 5HP, 480V, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'disconnect-30a-nf', description: 'Non-Fused Disconnect, 30A, 480V, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'bypass-contactor', description: 'Bypass Contactor, 30A, 480V coil', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 4, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'contactor-lighting-30a',
    code: 'CONTACTOR-30A',
    name: 'Lighting Contactor 30A Assembly',
    description: 'Lighting contactor, 30A, 277V coil for large lighting banks',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'contactor-30a-4p', description: 'Lighting Contactor, 30A, 4-pole, 277V coil', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'enclosure-nema1-8x10', description: 'NEMA 1 Enclosure, 8"x10"x4", steel', unit: 'EA', quantityPer: 1, category: 'Motor Control', wasteFactor: 1.00 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 3/4", insulated throat', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // HVAC & MECHANICAL
  // ============================================================================
  {
    id: 'hvac-rtu-whip',
    code: 'HVAC-RTU-WHIP',
    name: 'HVAC Rooftop Unit Whip Assembly',
    description: 'RTU disconnect with 10 ft SEOW whip, 60A, NEMA 3R - most common TI HVAC connection',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'disconnect-60a-nf-3r', description: 'Non-Fused Disconnect, 60A, 240V, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 },
      { id: 'whip-seow-10ft-8/4', description: 'SEOW Cord, 10 ft, 8/4, outdoor rated', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 },
      { id: 'cord-grip-1in', description: 'Cord Grip/Strain Relief, 1", steel, NEMA 3R', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'emt-connector-1in-comp', description: 'EMT Connector, 1", compression (wet location)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'hvac-condenser-disc',
    code: 'HVAC-COND-DISC',
    name: 'AC Condenser Disconnect 60A Assembly',
    description: 'AC condenser disconnect, 60A fused, NEMA 3R for outdoor condensing units',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'disconnect-60a-fused-3r', description: 'Fused Disconnect, 60A, 240V, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'Disconnects', wasteFactor: 1.00 },
      { id: 'fuse-class-rk5-60a', description: 'Class RK5 Time-Delay Fuses, 60A, 250V', unit: 'EA', quantityPer: 2, category: 'Disconnects', wasteFactor: 1.02 },
      { id: 'emt-connector-1in-comp', description: 'EMT Connector, 1", compression (wet location)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'exhaust-fan-control',
    code: 'EXHAUST-FAN',
    name: 'Exhaust Fan Control Station Assembly',
    description: 'Exhaust fan control with timer and disconnect for restrooms, kitchens',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g-deep', description: 'Raised Device Cover / Mud Ring, single-gang, 5/8"', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'timer-switch-60min', description: 'Timer Switch, 60-minute, spring wound, 15A', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // EXTERIOR & SITE LIGHTING
  // ============================================================================
  {
    id: 'pole-light-photocell',
    code: 'POLE-LIGHT',
    name: 'Parking Lot Pole Light Assembly',
    description: 'Pole-mounted area light with photocell control, hand-hole base',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'pole-base-handhole', description: 'Light Pole Base with Hand-Hole, aluminum', unit: 'EA', quantityPer: 1, category: 'Site Lighting', wasteFactor: 1.00 },
      { id: 'photocell-120-277v', description: 'Photocell, 120-277V, twist-lock', unit: 'EA', quantityPer: 1, category: 'Site Lighting', wasteFactor: 1.02 },
      { id: 'emt-connector-1in-comp', description: 'EMT Connector, 1", compression (wet location)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for connections', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bollard-light',
    code: 'BOLLARD-LIGHT',
    name: 'Landscape Bollard Light Assembly',
    description: 'Landscape bollard light for pathways, landscaping',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'bollard-base-concrete', description: 'Bollard Light Base/Stub for concrete mount', unit: 'EA', quantityPer: 1, category: 'Site Lighting', wasteFactor: 1.00 },
      { id: 'pvc-conduit-stub-1in', description: 'PVC Conduit Stub, 1", schedule 40, 18" long', unit: 'EA', quantityPer: 1, category: 'Site Lighting', wasteFactor: 1.02 },
      { id: 'pvc-coupling-1in', description: 'PVC Coupling, 1", schedule 40', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for connections', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'sign-outlet-timer',
    code: 'SIGN-OUTLET',
    name: 'Exterior Sign Outlet Assembly',
    description: 'Exterior sign outlet with timer and photocell control',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-fs-1g-wp', description: 'FS Box, single-gang, 2" deep, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-20a-125v-wp', description: 'Receptacle, 20A, 125V, weather-resistant', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'cover-wp-1g-inuse', description: 'Weather-Proof In-Use Cover, single-gang', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'photocell-120v', description: 'Photocell, 120V, twist-lock', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4-comp', description: 'EMT Connector, 3/4", compression (wet location)', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'ev-charger-level2',
    code: 'EV-CHARGER-L2',
    name: 'EV Charging Station Level 2 Assembly',
    description: 'Electric vehicle charging station, Level 2, 40A, 208/240V with pedestal',
    type: 'device',
    isActive: true,
    items: [
      { id: 'ev-charger-40a', description: 'EV Charger, Level 2, 40A, 208/240V, wall/pedestal mount', unit: 'EA', quantityPer: 1, category: 'EV Charging', wasteFactor: 1.00, notes: 'Networked or standalone' },
      { id: 'disconnect-60a-nf-3r', description: 'Non-Fused Disconnect, 60A, 240V, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'EV Charging', wasteFactor: 1.00 },
      { id: 'emt-connector-1in-comp', description: 'EMT Connector, 1", compression', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // LOW VOLTAGE / AV
  // ============================================================================
  {
    id: 'projector-outlet-ceiling',
    code: 'PROJECTOR-OUTLET',
    name: 'Ceiling Projector Outlet Assembly',
    description: 'Ceiling-mounted projector outlet with power, data, and HDMI',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-15a-125v', description: 'Receptacle, 15A, 125V, standard', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'mudring-2g-low-volt', description: 'Low-Voltage Mud Ring, two-gang (orange)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'hdmi-jack', description: 'HDMI Keystone Jack, female-to-female', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'cat6-jack', description: 'CAT6 RJ45 Keystone Jack, UTP', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'plate-combo-power-data', description: 'Combo Plate, power + 2-port data, white', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'tv-mount-outlet',
    code: 'TV-MOUNT-OUTLET',
    name: 'Recessed TV Power/Data Outlet Assembly',
    description: 'Recessed TV power and data outlet behind flat panel displays',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-recessed-tv', description: 'Recessed TV Box, low-voltage + power combo', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-15a-125v', description: 'Receptacle, 15A, 125V, standard', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'hdmi-jack', description: 'HDMI Keystone Jack, female-to-female', unit: 'EA', quantityPer: 2, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'plate-recessed-tv', description: 'Recessed TV Plate, white or ivory', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'sound-speaker-70v',
    code: 'SPEAKER-70V',
    name: '70V Distributed Audio Speaker Assembly',
    description: '70V distributed audio ceiling speaker with volume control',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'speaker-ring-70v', description: '70V Speaker Mounting Ring/Bracket', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.02 },
      { id: 'volume-control-70v', description: '70V Volume Control, rotary, wall mount', unit: 'EA', quantityPer: 0.5, category: 'Data/Comm', wasteFactor: 1.02, notes: '1 per 2 speakers avg' },
      { id: 'emt-connector-1/2', description: 'EMT Connector, 1/2", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'floor-monument-power-data',
    code: 'FLOOR-MONUMENT',
    name: 'Floor Monument Power/Data Assembly',
    description: 'Floor monument box with power and data for conference room tables',
    type: 'device',
    isActive: true,
    items: [
      { id: 'floor-monument-box', description: 'Floor Monument Box, adjustable, steel or aluminum', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-20a-125v', description: 'Duplex Receptacle, 20A, 125V', unit: 'EA', quantityPer: 2, category: 'Devices', wasteFactor: 1.02 },
      { id: 'cat6-jack', description: 'CAT6 RJ45 Keystone Jack, UTP', unit: 'EA', quantityPer: 2, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'hdmi-jack', description: 'HDMI Keystone Jack, female-to-female', unit: 'EA', quantityPer: 1, category: 'Data/Comm', wasteFactor: 1.05 },
      { id: 'cover-floor-monument', description: 'Floor Monument Cover/Lid, brushed aluminum', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // BREAKERS (as assemblies for panel schedules)
  // ============================================================================
  {
    id: 'breaker-1p-20a',
    code: 'BKR-1P-20A',
    name: 'Circuit Breaker 1-Pole 20A',
    description: 'Single-pole circuit breaker, 20A, 120V - most common branch circuit',
    type: 'device',
    isActive: true,
    items: [
      { id: 'breaker-1p-20a', description: 'Circuit Breaker, 1-pole, 20A, 120V, 10kAIC', unit: 'EA', quantityPer: 1, category: 'Breakers', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'breaker-2p-30a',
    code: 'BKR-2P-30A',
    name: 'Circuit Breaker 2-Pole 30A',
    description: 'Two-pole circuit breaker, 30A, 240V for HVAC, equipment',
    type: 'device',
    isActive: true,
    items: [
      { id: 'breaker-2p-30a', description: 'Circuit Breaker, 2-pole, 30A, 240V, 10kAIC', unit: 'EA', quantityPer: 1, category: 'Breakers', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'breaker-3p-100a',
    code: 'BKR-3P-100A',
    name: 'Circuit Breaker 3-Pole 100A',
    description: 'Three-pole circuit breaker, 100A, 208V for feeders, large equipment',
    type: 'device',
    isActive: true,
    items: [
      { id: 'breaker-3p-100a', description: 'Circuit Breaker, 3-pole, 100A, 208V, 22kAIC', unit: 'EA', quantityPer: 1, category: 'Breakers', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'breaker-gfci-2p-20a',
    code: 'BKR-GFCI-2P-20A',
    name: 'GFCI Circuit Breaker 2-Pole 20A',
    description: 'GFCI circuit breaker, 2-pole, 20A, 240V for outdoor equipment',
    type: 'device',
    isActive: true,
    items: [
      { id: 'breaker-gfci-2p-20a', description: 'GFCI Breaker, 2-pole, 20A, 240V, self-test', unit: 'EA', quantityPer: 1, category: 'Breakers', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'breaker-afci-1p-15a',
    code: 'BKR-AFCI-1P-15A',
    name: 'AFCI Circuit Breaker 1-Pole 15A',
    description: 'AFCI circuit breaker, 1-pole, 15A for bedroom circuits per NEC 210.12',
    type: 'device',
    isActive: true,
    items: [
      { id: 'breaker-afci-1p-15a', description: 'AFCI Breaker, 1-pole, 15A, 120V, combination type', unit: 'EA', quantityPer: 1, category: 'Breakers', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // GROUNDING & BONDING
  // ============================================================================
  {
    id: 'ground-rod-driven',
    code: 'GROUND-ROD',
    name: 'Ground Rod Assembly (Driven)',
    description: '8 ft copper-clad ground rod, driven with clamp and wire',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ground-rod-8ft', description: 'Ground Rod, 8 ft, 5/8" dia., copper-clad steel', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 },
      { id: 'ground-rod-clamp', description: 'Ground Rod Clamp, bronze, 5/8" rod', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 },
      { id: 'ground-wire-6cu', description: '#6 CU bare ground wire, 10 ft average', unit: 'FT', quantityPer: 10, category: 'Grounding', wasteFactor: 1.10 },
      { id: 'pvc-conduit-3/4-5ft', description: 'PVC Conduit, 3/4", 5 ft for ground wire protection', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'ufer-ground-connection',
    code: 'UFER-GROUND',
    name: 'Ufer Ground Connection Assembly',
    description: 'Concrete-encased electrode (Ufer) ground connection to rebar',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ground-wire-4cu-bare', description: '#4 CU bare ground wire, 20 ft for rebar connection', unit: 'FT', quantityPer: 20, category: 'Grounding', wasteFactor: 1.10 },
      { id: 'rebar-clamp', description: 'Rebar Ground Clamp, bronze, #4 rebar', unit: 'EA', quantityPer: 2, category: 'Grounding', wasteFactor: 1.02, notes: 'Min 2 per NEC 250.52' },
      { id: 'pvc-conduit-1in-10ft', description: 'PVC Conduit, 1", 10 ft for ground wire to panel', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // EMERGENCY POWER
  // ============================================================================
  {
    id: 'generator-inlet-50a',
    code: 'GEN-INLET-50A',
    name: 'Generator Inlet Box 50A Assembly',
    description: 'Generator inlet box, 50A, 125/250V, NEMA 14-50 twist-lock, NEMA 3R',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'gen-inlet-50a', description: 'Generator Inlet Box, 50A, 125/250V, NEMA 14-50, NEMA 3R', unit: 'EA', quantityPer: 1, category: 'Emergency Power', wasteFactor: 1.00 },
      { id: 'inlet-receptacle-l14-50', description: 'Inlet Receptacle, L14-50R, flanged, 50A', unit: 'EA', quantityPer: 1, category: 'Emergency Power', wasteFactor: 1.02 },
      { id: 'emt-connector-1.25in-comp', description: 'EMT Connector, 1-1/4", compression', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1-1/4", insulated throat', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'transfer-switch-manual-30a',
    code: 'XFER-SW-30A',
    name: 'Manual Transfer Switch 30A Assembly',
    description: 'Manual transfer switch, 30A, 10-circuit for generator backup',
    type: 'panel',
    isActive: true,
    items: [
      { id: 'transfer-switch-30a', description: 'Manual Transfer Switch, 30A, 10-circuit, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Emergency Power', wasteFactor: 1.00 },
      { id: 'emt-connector-1in', description: 'EMT Connector, 1", steel', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05, notes: 'Utility, generator, load' },
      { id: 'grounding-bushing', description: 'Grounding Bushing, 1", insulated throat', unit: 'EA', quantityPer: 3, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // SPECIAL ENCLOSURES
  // ============================================================================
  {
    id: 'wiremold-surface-raceway',
    code: 'WIREMOLD-2400',
    name: 'Wiremold Surface Raceway Kit (per 10 ft)',
    description: 'Surface raceway (Wiremold 2400 series) with fittings per 10 ft run',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'wiremold-2400-base', description: 'Wiremold 2400 Base, 10 ft section', unit: 'EA', quantityPer: 1, category: 'Raceways', wasteFactor: 1.05 },
      { id: 'wiremold-2400-cover', description: 'Wiremold 2400 Cover, 10 ft section', unit: 'EA', quantityPer: 1, category: 'Raceways', wasteFactor: 1.05 },
      { id: 'wiremold-2400-coupling', description: 'Wiremold 2400 Coupling', unit: 'EA', quantityPer: 1, category: 'Raceways', wasteFactor: 1.05 },
      { id: 'wiremold-2400-elbow', description: 'Wiremold 2400 90° Flat Elbow', unit: 'EA', quantityPer: 2, category: 'Raceways', wasteFactor: 1.05, notes: 'Average 2 per run' },
      { id: 'wiremold-2400-device-box', description: 'Wiremold 2400 Device Box', unit: 'EA', quantityPer: 1, category: 'Raceways', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'pvc-jbox-wp-4x4',
    code: 'JBOX-PVC-4X4',
    name: 'PVC Junction Box 4x4 NEMA 4X',
    description: 'PVC junction box, NEMA 4X, for outdoor/wet locations',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'jbox-pvc-4x4', description: 'PVC Junction Box, 4"x4"x2", NEMA 4X, hinged cover', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'pvc-connector-3/4', description: 'PVC Conduit Connector, 3/4", compression', unit: 'EA', quantityPer: 3, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'gasket-pvc', description: 'Gasket for PVC box, foam', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // HEALTHCARE SPECIFIC
  // ============================================================================
  {
    id: 'hospital-grade-recep-ig',
    code: 'RECEP-HOSP-IG',
    name: 'Hospital Grade IG Receptacle Assembly',
    description: 'Hospital grade isolated ground receptacle (green dot) for patient care areas',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-hosp-ig-20a', description: 'Hospital Grade IG Receptacle, 20A, 125V (green dot)', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'UL 1363, orange w/ green dot' },
      { id: 'plate-ss-1g', description: 'Device Cover Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-wire-ig-12-insul', description: '#12 CU insulated green wire for IG', unit: 'FT', quantityPer: 15, category: 'Grounding', wasteFactor: 1.10 }
    ]
  },
  {
    id: 'patient-care-vicinity-recep',
    code: 'RECEP-PATIENT-CARE',
    name: 'Patient Care Vicinity Receptacle Assembly',
    description: 'Patient care vicinity receptacle (red) on emergency circuit per NEC 517',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep (red for emergency)', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'recep-hosp-20a-red', description: 'Hospital Grade Receptacle, 20A, 125V, RED face', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Emergency circuit per NEC 517' },
      { id: 'plate-red-1g', description: 'Device Cover Plate, single-gang, RED', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4-red', description: 'EMT Connector, 3/4", steel (red conduit)', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'nurse-call-station',
    code: 'NURSE-CALL',
    name: 'Nurse Call Station Assembly',
    description: 'Hospital nurse call station with emergency pull cord',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-2g-low-volt', description: 'Low-Voltage Mud Ring, two-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'nurse-call-station', description: 'Nurse Call Station, audio/visual with pull cord', unit: 'EA', quantityPer: 1, category: 'Healthcare', wasteFactor: 1.02 },
      { id: 'plate-nurse-call', description: 'Nurse Call Plate, two-gang, white', unit: 'EA', quantityPer: 1, category: 'Healthcare', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // SENSORS & ENERGY MANAGEMENT
  // ============================================================================
  {
    id: 'occupancy-sensor-ceiling',
    code: 'OCC-SENSOR-CEIL',
    name: 'Ceiling Occupancy Sensor Assembly',
    description: 'Ceiling-mount occupancy sensor, 360° coverage, for high-bay/warehouse',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, ceiling rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'occ-sensor-ceiling', description: 'Occupancy Sensor, ceiling mount, 360°, PIR/ultrasonic', unit: 'EA', quantityPer: 1, category: 'Controls', wasteFactor: 1.02 },
      { id: 'mounting-plate-sensor', description: 'Sensor Mounting Plate for 4" box', unit: 'EA', quantityPer: 1, category: 'Controls', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'wirenuts-assorted', description: 'Wire Nuts for sensor', unit: 'PKG', quantityPer: 0.2, category: 'Fittings', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'light-occ-sensor-owner',
    code: 'M1',
    name: 'Occupancy Sensor - Owner Supplied',
    description: 'Occupancy sensor provided by owner (lighting schedule) - labor only, no material cost',
    type: 'fixture',
    isActive: true,
    items: [
      { id: 'occ-sensor-owner', description: 'Occupancy Sensor - Owner Supplied (install only)', unit: 'EA', quantityPer: 1, category: 'Lights', wasteFactor: 1.0, notes: 'Owner-provided sensor, labor only' }
    ]
  },
  {
    id: 'daylight-sensor',
    code: 'DAYLIGHT-SENSOR',
    name: 'Daylight Harvesting Sensor Assembly',
    description: 'Photocell daylight sensor for dimming control and energy savings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, ceiling/wall rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'daylight-sensor', description: 'Daylight Sensor, 0-10V dimming output', unit: 'EA', quantityPer: 1, category: 'Controls', wasteFactor: 1.02 },
      { id: 'mounting-plate-sensor', description: 'Sensor Mounting Plate', unit: 'EA', quantityPer: 1, category: 'Controls', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // DIMMER SWITCHES
  // ============================================================================
  {
    id: 'dimmer-sp-600w',
    code: 'DIM',
    name: 'Dimmer Switch Single-Pole 600W',
    description: 'Single-pole dimmer switch assembly with box, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-sp-600w', description: 'Dimmer Switch, Single-Pole, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-3w-600w',
    code: 'DIM-3W',
    name: 'Dimmer Switch Three-Way 600W',
    description: 'Three-way dimmer switch assembly with box, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper box for 3-way wiring' },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-3w-600w', description: 'Dimmer Switch, Three-Way, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-4w-600w',
    code: 'DIM-4W',
    name: 'Dimmer Switch Four-Way 600W',
    description: 'Four-way dimmer switch assembly with box, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02, notes: 'Deeper box for 4-way wiring' },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-3w-600w', description: 'Dimmer Switch, Three-Way, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: 'Use 3-way dimmer for 4-way application' },
      { id: 'switch-4w', description: 'Switch, 4-way, 15A, spec grade', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02, notes: '4-way traveler switch' },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-wc',
    code: 'DIM-WC',
    name: 'Dimming Wall Control Station',
    description: 'Wall-mounted dimming control station with box, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-wall-control', description: 'Dimming Wall Control Station, 0-10V or DALI', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-ml',
    code: 'DIM-ML',
    name: 'Multi-Location Dimmer System',
    description: 'Multi-location dimmer control with master dimmer and remote stations',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-ml-master', description: 'Multi-Location Master Dimmer, 600W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-1000w',
    code: 'DIM-1000W',
    name: 'Dimmer Switch 1000W',
    description: '1000W dimmer switch assembly for higher lighting loads',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-1000w', description: '1000 Watt Rotary Dimmer', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-1500w',
    code: 'DIM-1500W',
    name: 'Dimmer Switch 1500W',
    description: '1500W dimmer switch assembly for high lighting loads',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-1500w', description: '1500 Watt Rotary Dimmer', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'dimmer-2000w',
    code: 'DIM-2000W',
    name: 'Dimmer Switch 2000W',
    description: '2000W dimmer switch assembly for very high lighting loads',
    type: 'device',
    isActive: true,
    items: [
      { id: 'box-4sq-2.125', description: '4" Square Box, 2-1/8" deep, galvanized steel', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'mudring-1g', description: 'Raised Device Cover / Mud Ring, single-gang', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'dimmer-2000w', description: '2000 Watt Rotary Dimmer', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'emt-connector-3/4', description: 'EMT Connector, 3/4", steel', unit: 'EA', quantityPer: 2, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'ground-pigtail-12', description: '#12 CU pigtail w/ green screw', unit: 'EA', quantityPer: 1, category: 'Grounding', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // SURGE PROTECTION
  // ============================================================================
  {
    id: 'surge-protector-panel',
    code: 'SPD',
    name: 'Surge Protection Device (Panel Mount)',
    description: 'Type 2 SPD for panel installation - 120/240V single phase or 120/208V 3-phase',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'spd-type2', description: 'Surge Protection Device, Type 2, 140kA', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'breaker-2p-30a', description: 'Circuit Breaker, 2-pole, 30A', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // WIREMOLD / SURFACE RACEWAY
  // ============================================================================
  {
    id: 'wiremold-3000-10ft',
    code: 'WM-3000',
    name: 'Wiremold 3000 Series (per 10 FT)',
    description: 'Surface metal raceway with base, cover, couplings, and fittings',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'wm-3000-base', description: 'Wiremold 3000 base, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.10 },
      { id: 'wm-3000-cover', description: 'Wiremold 3000 cover, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.10 },
      { id: 'wm-coupling', description: 'Wiremold coupling', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'wiremold-4000-10ft',
    code: 'WM-4000',
    name: 'Wiremold 4000 Series (per 10 FT)',
    description: 'Large surface metal raceway with base, cover, couplings, and fittings',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'wm-4000-base', description: 'Wiremold 4000 base, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.10 },
      { id: 'wm-4000-cover', description: 'Wiremold 4000 cover, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.10 },
      { id: 'wm-coupling-lg', description: 'Wiremold coupling large', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // DATA CENTER / RACK ACCESSORIES
  // ============================================================================
  {
    id: 'data-rack-2post-7ft',
    code: 'RACK-2P',
    name: '2-Post Server Rack 7FT',
    description: 'Open frame 2-post telecom rack with mounting rails',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'rack-2post-42u', description: '2-Post Rack, 42U, 7 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'cage-nuts-50', description: 'Cage nuts and screws, pkg of 50', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'data-rack-4post-7ft',
    code: 'RACK-4P',
    name: '4-Post Server Rack 7FT',
    description: 'Enclosed 4-post equipment rack with side panels and doors',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'rack-4post-42u', description: '4-Post Enclosed Rack, 42U, 7 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'cage-nuts-100', description: 'Cage nuts and screws, pkg of 100', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'rack-pdu-basic', description: 'Basic rack PDU, 20A', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'patch-panel-24port',
    code: 'PATCH-24',
    name: 'Patch Panel 24-Port Cat6',
    description: '24-port 1U patch panel with cable management',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'patch-24-cat6', description: 'Patch Panel, 24-port, Cat6, 1U', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'cable-mgmt-1u', description: 'Cable management, 1U horizontal', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'patch-panel-48port',
    code: 'PATCH-48',
    name: 'Patch Panel 48-Port Cat6',
    description: '48-port 2U patch panel with cable management',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'patch-48-cat6', description: 'Patch Panel, 48-port, Cat6, 2U', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'cable-mgmt-2u', description: 'Cable management, 2U horizontal', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'jhook-2in',
    code: 'JHOOK-2',
    name: 'J-Hook 2" (per hook)',
    description: 'Cable support J-hook for data cabling',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'jhook-2', description: 'J-Hook, 2", galvanized', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.05 },
      { id: 'threaded-rod-clip', description: 'Beam clamp or rod clip', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'ladder-rack-12in-10ft',
    code: 'LAD-RACK-12',
    name: 'Ladder Rack 12" (per 10 FT)',
    description: '12" wide cable ladder rack with supports',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ladder-rack-12', description: 'Ladder Rack, 12" wide, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.05 },
      { id: 'rack-splice-plate', description: 'Splice plate for ladder rack', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'trapeze-hanger', description: 'Trapeze hanger with hardware', unit: 'EA', quantityPer: 0.4, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },
  {
    id: 'ladder-rack-18in-10ft',
    code: 'LAD-RACK-18',
    name: 'Ladder Rack 18" (per 10 FT)',
    description: '18" wide cable ladder rack with supports',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ladder-rack-18', description: 'Ladder Rack, 18" wide, 10 FT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.05 },
      { id: 'rack-splice-plate', description: 'Splice plate for ladder rack', unit: 'EA', quantityPer: 1, category: 'Fittings', wasteFactor: 1.05 },
      { id: 'trapeze-hanger', description: 'Trapeze hanger with hardware', unit: 'EA', quantityPer: 0.4, category: 'Fittings', wasteFactor: 1.05 }
    ]
  },

  // ============================================================================
  // SECURITY ACCESSORIES
  // ============================================================================
  {
    id: 'security-nvr-16ch',
    code: 'NVR',
    name: 'Network Video Recorder 16-CH',
    description: 'NVR with 16 camera inputs and storage',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'nvr-16ch', description: 'NVR, 16-channel, 4TB storage', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'recep-20a-125v', description: 'Duplex Receptacle, 20A, 125V', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'cat6-cable', description: 'Cat6 cable for network connection, 25 FT', unit: 'EA', quantityPer: 1, category: 'wire', wasteFactor: 1.10 }
    ]
  },
  {
    id: 'security-rex-button',
    code: 'REX',
    name: 'Request-to-Exit Button',
    description: 'REX button with stainless steel plate',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'rex-button', description: 'Request-to-Exit button, NO/NC', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g-ss', description: 'Single-gang box with stainless plate', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'security-power-supply',
    code: 'SEC-PS',
    name: 'Security Power Supply 12VDC',
    description: 'Regulated 12VDC power supply for access control',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ps-12v-5a', description: 'Power Supply, 12VDC, 5A with battery backup', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'enclosure-12x12', description: 'Enclosure, 12x12, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // AV EQUIPMENT
  // ============================================================================
  {
    id: 'av-volume-control',
    code: 'VOL',
    name: 'Volume Control Wall Plate',
    description: '70V speaker volume control with wall plate',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'vol-control-70v', description: 'Volume Control, 70V, 100W', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g', description: 'Single-gang box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'plate-ny-1g', description: 'Device Cover Plate, single-gang, nylon', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'av-motorized-screen',
    code: 'SCRN',
    name: 'Motorized Projection Screen 100"',
    description: 'Electric projection screen with wall switch control',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'screen-motor-100', description: 'Motorized Screen, 100" diagonal', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'switch-mom-1g', description: 'Momentary switch for screen control', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-4sq-1.5', description: '4" Square Box, 1-1/2" deep', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'av-dsp-amplifier',
    code: 'DSP-AMP',
    name: 'DSP Amplifier 8-Channel',
    description: 'Digital signal processor and amplifier for AV system',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'dsp-amp-8ch', description: 'DSP Amplifier, 8-channel, 500W', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'recep-20a-125v', description: 'Duplex Receptacle, 20A, 125V', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'av-hdbaset-txrx',
    code: 'HDBaseT',
    name: 'HDBaseT Transmitter/Receiver Pair',
    description: 'HDBaseT extender set for AV over Cat6',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'hdbaset-tx', description: 'HDBaseT Transmitter', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'hdbaset-rx', description: 'HDBaseT Receiver', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'poe-injector', description: 'PoE injector for HDBaseT', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'av-rack-wall-12u',
    code: 'AV-RACK',
    name: 'AV Equipment Rack 12U Wall Mount',
    description: 'Wall mount AV rack with shelf and cable management',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'rack-wall-12u', description: 'Wall Mount Rack, 12U', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'rack-shelf', description: 'Rack shelf for equipment', unit: 'EA', quantityPer: 2, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'fan-unit-1u', description: 'Cooling fan unit, 1U', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // BAS / CONTROLS
  // ============================================================================
  {
    id: 'bas-thermostat',
    code: 'STAT',
    name: 'Digital Thermostat Programmable',
    description: 'Programmable thermostat with 24VAC control',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'tstat-digital', description: 'Thermostat, programmable, 24VAC', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g', description: 'Single-gang box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-temp-sensor',
    code: 'TSENS',
    name: 'Temperature Sensor',
    description: 'Wall or duct mount temperature sensor',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'temp-sensor', description: 'Temperature Sensor, 0-10VDC output', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g', description: 'Single-gang box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-humidity-sensor',
    code: 'HSENS',
    name: 'Humidity Sensor',
    description: 'Wall mount humidity sensor',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'humidity-sensor', description: 'Humidity Sensor, 0-10VDC output', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g', description: 'Single-gang box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-co2-sensor',
    code: 'CO2',
    name: 'CO2 Sensor',
    description: 'Wall mount CO2 sensor for demand ventilation',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'co2-sensor', description: 'CO2 Sensor, 0-2000ppm, 0-10VDC', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 },
      { id: 'box-1g', description: 'Single-gang box', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-ddc-controller',
    code: 'DDC',
    name: 'DDC Controller Panel',
    description: 'Direct digital controller with I/O points',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ddc-panel-16io', description: 'DDC Controller, 16 I/O points', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'enclosure-12x12', description: 'Enclosure, 12x12, NEMA 1', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-vav-controller',
    code: 'VAV-CTRL',
    name: 'VAV Box Controller',
    description: 'VAV box controller with damper actuator',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'vav-controller', description: 'VAV Controller with actuator', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'temp-sensor', description: 'Temperature Sensor for VAV', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'bas-power-supply',
    code: 'BAS-PS',
    name: 'BAS Power Supply 24VAC',
    description: 'Transformer and power supply for BAS devices',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'ps-24vac-100va', description: 'Power Supply, 24VAC, 100VA', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.02 },
      { id: 'box-4x4', description: '4x4 box for power supply', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // SITE POWER ACCESSORIES
  // ============================================================================
  {
    id: 'site-pole-head',
    code: 'SITE-LP-HEAD',
    name: 'Site Pole Light Head/Fixture',
    description: 'LED area light fixture for mounting on pole',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'pole-head-led-150w', description: 'LED Area Light, 150W, Type III', unit: 'EA', quantityPer: 1, category: 'Lighting', wasteFactor: 1.02 },
      { id: 'photocell-twist', description: 'Photocell, twist-lock', unit: 'EA', quantityPer: 1, category: 'Devices', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'site-handhole',
    code: 'SITE-HH',
    name: 'Site Handhole 24x36',
    description: 'Polymer concrete handhole with cover',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'handhole-24x36', description: 'Handhole, 24x36, polymer concrete', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 },
      { id: 'hh-cover-traffic', description: 'Handhole cover, traffic rated', unit: 'EA', quantityPer: 1, category: 'Boxes', wasteFactor: 1.02 }
    ]
  },

  // ============================================================================
  // DEMOLITION
  // ============================================================================
  {
    id: 'demo-light-fixture',
    code: 'DEM-LT',
    name: 'Demo Light Fixture',
    description: 'Remove and dispose of existing light fixture',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'demo-labor', description: 'Demolition labor allowance', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.0 }
    ]
  },
  {
    id: 'demo-switch',
    code: 'DEM-SW',
    name: 'Demo Switch/Device',
    description: 'Remove and dispose of existing switch or device',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'demo-labor-sm', description: 'Demolition labor small device', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.0 }
    ]
  },
  {
    id: 'demo-panel',
    code: 'DEM-PNL',
    name: 'Demo Panel/Gear',
    description: 'Remove and dispose of existing panel or electrical gear',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'demo-labor-lg', description: 'Demolition labor large equipment', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.0 }
    ]
  },
  {
    id: 'temp-power-pole',
    code: 'TEMP-PP',
    name: 'Temporary Power Pole',
    description: 'Temporary power distribution pole with receptacles',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'temp-pole-100a', description: 'Temporary Power Pole, 100A, (4) 20A circuits', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.0 }
    ]
  },

  // ============================================================================
  // MISCELLANEOUS
  // ============================================================================
  {
    id: 'blank-plate-1g',
    code: 'PLATE-BLK',
    name: 'Blank Plate Single-Gang',
    description: 'Blank cover plate for unused boxes',
    type: 'device',
    isActive: true,
    items: [
      { id: 'plate-blank-1g', description: 'Blank Plate, single-gang, stainless steel', unit: 'EA', quantityPer: 1, category: 'Plates', wasteFactor: 1.02 }
    ]
  },
  {
    id: 'label-nameplate',
    code: 'LABEL',
    name: 'Equipment Label/Nameplate',
    description: 'Engraved nameplate or label for equipment identification',
    type: 'custom',
    isActive: true,
    items: [
      { id: 'label-engraved', description: 'Engraved label, 2x4"', unit: 'EA', quantityPer: 1, category: 'Electrical Materials', wasteFactor: 1.05 }
    ]
  }
];
