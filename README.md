# Electrical Takeoff Application

Professional electrical estimating and takeoff application with industry-standard assemblies.

## Features

### 1. **Assembly System**
Industry-standard material kits automatically calculate all required materials for your takeoffs:

- **Standard Receptacle Assemblies** (15A, 20A)
  - 4" square boxes, mud rings, devices, plates, connectors, ground pigtails
  - 2% waste for devices, 5% for fittings

- **Switch Assemblies** (Single-pole)
  - Complete switch installation kits

- **Junction Boxes** (4" and 4-11/16")
  - Boxes, covers, connectors, wire nuts

- **Lighting Fixture Assemblies**
  - Boxes, rings, mounting hardware

### 2. **Using Assemblies**

#### Assign Assembly to Tag:
1. Click **"Tags"** button in toolbar
2. Edit or create a tag
3. Select an assembly from the **"Assembly (Optional)"** dropdown
4. Save the tag

#### View Assemblies:
1. Click **"Assemblies"** button in toolbar
2. Browse standard assemblies
3. See which tags use each assembly
4. View detailed material breakdowns

#### Example: B-41 Homerun Receptacles
1. Create a tag: Code="B-41", Name="Panel B Receptacle", Category="Receptacles"
2. Assign assembly: "RECEP-20A" (Standard 20A Receptacle Assembly)
3. Place count objects using the B-41 tag
4. Export Excel - automatically includes:
   - 4" square boxes (1 per receptacle)
   - Mud rings (1 per receptacle)
   - 20A duplex receptacles (1 per receptacle)
   - Stainless steel plates (1 per receptacle)
   - EMT connectors (2 per receptacle)
   - Ground pigtails (1 per receptacle)

### 3. **Industry-Standard Waste Factors**

Built-in defaults match electrical estimating best practices:

- **Conduit (EMT)**: 5% waste
- **Wire (THHN)**: 10% waste
- **Devices**: 2% waste
- **Fixtures**: 2-3% waste
- **Gear**: 0% waste (ordered exact)

### 4. **Measurement Defaults**

Smart defaults save time on every measurement:

- **EMT Size**: 3/4" (most common)
- **Wire**: 3 #12 THHN/THWN-2 CU (standard 20A circuit)
- **Extra per point**: 2 ft wire, 1.5 ft conduit
- **Boxes**: 0.5 per point (1 box per 2 bends average)

### 5. **Excel Export with Assemblies**

The "Export Excel (Detailed Measurements)" includes three sheets:

1. **Measurements (Itemized)** - Every run with EMT sizes and wire specs
2. **Measurements (Summarized)** - Totals by tag code
3. **Assembly Materials** - Complete material list from all assemblies

All materials are automatically calculated with waste factors applied.

## Quick Start

1. Open a PDF drawing
2. Calibrate the scale (required for measurements)
3. Create tags and assign assemblies
4. Place count objects for devices
5. Draw polylines/freeforms for conduit runs
6. Export Excel for complete material list

## Assembly Materials Included

Each standard assembly automatically tracks:
- Boxes and covers
- Devices and plates
- Conduit fittings (connectors, couplings)
- Grounding components
- Hardware and wire nuts

Everything a professional estimator needs for accurate material takeoffs.
