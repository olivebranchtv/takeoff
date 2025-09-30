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
  }
];
