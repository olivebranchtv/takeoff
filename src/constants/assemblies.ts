import { Assembly } from '@/types';

export const STANDARD_ASSEMBLIES: Assembly[] = [
  {
    id: 'recep-20a-std',
    code: 'RECEP-20A',
    name: 'Standard 20A Receptacle Assembly',
    description: 'Commercial TI standard receptacle kit per NEC - 20A, 125V duplex outlet with box, mud ring, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      {
        id: 'box-4sq-1.5',
        description: '4" Square Box, 1-1/2" deep, galvanized steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02,
        notes: 'NEC standard for commercial receptacles'
      },
      {
        id: 'mudring-1g',
        description: 'Raised Device Cover / Mud Ring, single-gang, 1/2" or 5/8"',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02,
        notes: 'Depth based on drywall thickness'
      },
      {
        id: 'recep-20a-125v',
        description: 'Duplex Receptacle, 20A, 125V, NEMA 5-20R (spec grade)',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02,
        notes: 'Commercial grade, tamper resistant if spec\'d'
      },
      {
        id: 'plate-ss-1g',
        description: 'Device Cover Plate, single-gang, stainless steel (430 brushed)',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02,
        notes: 'Stainless standard for commercial TI'
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel compression or set-screw',
        unit: 'EA',
        quantityPer: 2,
        category: 'Fittings',
        wasteFactor: 1.05,
        notes: 'One in, one out'
      },
      {
        id: 'emt-coupling-3/4',
        description: 'EMT Coupling, 3/4", steel',
        unit: 'EA',
        quantityPer: 0.1,
        category: 'Fittings',
        wasteFactor: 1.05,
        notes: '~1 per 10\' stick typical'
      },
      {
        id: 'ground-pigtail-12',
        description: '#12 CU pigtail w/ green screw (bonding jumper)',
        unit: 'EA',
        quantityPer: 1,
        category: 'Grounding',
        wasteFactor: 1.02
      }
    ]
  },
  {
    id: 'recep-15a-std',
    code: 'RECEP-15A',
    name: 'Standard 15A Receptacle Assembly',
    description: 'Residential/light commercial 15A receptacle kit - 15A, 125V duplex outlet',
    type: 'device',
    isActive: true,
    items: [
      {
        id: 'box-4sq-1.5',
        description: '4" Square Box, 1-1/2" deep, galvanized steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'mudring-1g',
        description: 'Raised Device Cover / Mud Ring, single-gang',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'recep-15a-125v',
        description: 'Duplex Receptacle, 15A, 125V, NEMA 5-15R',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02
      },
      {
        id: 'plate-ny-1g',
        description: 'Device Cover Plate, single-gang, nylon',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel',
        unit: 'EA',
        quantityPer: 2,
        category: 'Fittings',
        wasteFactor: 1.05
      },
      {
        id: 'emt-coupling-3/4',
        description: 'EMT Coupling, 3/4", steel',
        unit: 'EA',
        quantityPer: 0.1,
        category: 'Fittings',
        wasteFactor: 1.05
      },
      {
        id: 'ground-pigtail-12',
        description: '#12 CU pigtail w/ green screw',
        unit: 'EA',
        quantityPer: 1,
        category: 'Grounding',
        wasteFactor: 1.02
      }
    ]
  },
  {
    id: 'switch-std',
    code: 'SWITCH-1P',
    name: 'Standard Single-Pole Switch Assembly',
    description: 'Commercial single-pole switch with box, mud ring, plate, and fittings',
    type: 'device',
    isActive: true,
    items: [
      {
        id: 'box-4sq-1.5',
        description: '4" Square Box, 1-1/2" deep, galvanized steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'mudring-1g',
        description: 'Raised Device Cover / Mud Ring, single-gang',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'switch-sp-20a',
        description: 'Single-Pole Switch, 20A, 120/277V (spec grade)',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02
      },
      {
        id: 'plate-ss-1g',
        description: 'Device Cover Plate, single-gang, stainless steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Devices',
        wasteFactor: 1.02
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel',
        unit: 'EA',
        quantityPer: 2,
        category: 'Fittings',
        wasteFactor: 1.05
      },
      {
        id: 'emt-coupling-3/4',
        description: 'EMT Coupling, 3/4", steel',
        unit: 'EA',
        quantityPer: 0.1,
        category: 'Fittings',
        wasteFactor: 1.05
      },
      {
        id: 'ground-pigtail-12',
        description: '#12 CU pigtail w/ green screw',
        unit: 'EA',
        quantityPer: 1,
        category: 'Grounding',
        wasteFactor: 1.02
      }
    ]
  },
  {
    id: 'jbox-4x4',
    code: 'JBOX-4X4',
    name: 'Junction Box 4" x 4"',
    description: 'Standard 4" square junction box with blank cover for splicing',
    type: 'custom',
    isActive: true,
    items: [
      {
        id: 'box-4sq-2.125',
        description: '4" Square Box, 2-1/8" deep, galvanized steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02,
        notes: 'Deeper for splice capacity'
      },
      {
        id: 'cover-blank-4sq',
        description: 'Blank Cover, 4" square, flat',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel',
        unit: 'EA',
        quantityPer: 3,
        category: 'Fittings',
        wasteFactor: 1.05,
        notes: 'Average 3 entries per J-box'
      },
      {
        id: 'wirenuts-assorted',
        description: 'Wire Nuts, assorted sizes (yellow/red/blue)',
        unit: 'PKG',
        quantityPer: 0.5,
        category: 'Fittings',
        wasteFactor: 1.02,
        notes: 'Estimate 1 pkg per 2 boxes'
      }
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
      {
        id: 'box-4-11/16-2.125',
        description: '4-11/16" Square Box, 2-1/8" deep, galvanized steel',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'cover-blank-4-11/16',
        description: 'Blank Cover, 4-11/16" square, flat',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel',
        unit: 'EA',
        quantityPer: 4,
        category: 'Fittings',
        wasteFactor: 1.05,
        notes: 'Average 4 entries for multi-circuit box'
      },
      {
        id: 'wirenuts-assorted',
        description: 'Wire Nuts, assorted sizes',
        unit: 'PKG',
        quantityPer: 1,
        category: 'Fittings',
        wasteFactor: 1.02
      }
    ]
  },
  {
    id: 'light-fixture-basic',
    code: 'LIGHT-BASIC',
    name: 'Basic Lighting Fixture Assembly',
    description: 'Standard ceiling mounted light fixture with box and hardware',
    type: 'fixture',
    isActive: true,
    items: [
      {
        id: 'box-ceiling-4sq',
        description: '4" Square Box, 1-1/2" deep with fixture studs',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'fixture-ring',
        description: 'Fixture Ring/Raised Cover for 4" box',
        unit: 'EA',
        quantityPer: 1,
        category: 'Boxes',
        wasteFactor: 1.02
      },
      {
        id: 'emt-connector-3/4',
        description: 'EMT Connector, 3/4", steel',
        unit: 'EA',
        quantityPer: 2,
        category: 'Fittings',
        wasteFactor: 1.05
      },
      {
        id: 'fixture-mounting',
        description: 'Fixture mounting hardware (screws, studs)',
        unit: 'SET',
        quantityPer: 1,
        category: 'Fittings',
        wasteFactor: 1.02
      },
      {
        id: 'wirenuts-assorted',
        description: 'Wire Nuts for fixture connections',
        unit: 'PKG',
        quantityPer: 0.2,
        category: 'Fittings',
        wasteFactor: 1.02
      }
    ]
  }
];
