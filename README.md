# Electrical Takeoff Application

Professional electrical estimating and takeoff application with **75 industry-standard assemblies** covering every commercial, TI, industrial, and specialty electrical scenario.

## Features

### 1. **Comprehensive Assembly Library** (75 Assemblies)

#### **Receptacles** (12 assemblies)
- Standard 15A & 20A (commercial/residential)
- GFCI 20A (wet locations per NEC 210.8)
- Isolated Ground 20A (hospitals, data centers, orange)
- Weather-Proof 20A GFCI (outdoor per NEC 406.9)
- Floor Receptacle 20A (open office)
- USB Combo (Type-A/C charging)
- 208V 20A NEMA 6-20R (equipment)
- 240V 30A NEMA 6-30R (heavy equipment)
- 50A Range NEMA 14-50R (commercial kitchen)
- 30A Twist-Lock NEMA L5-30R (generators)
- 50A Welding NEMA 6-50R (shop welders)

#### **Switches** (6 assemblies)
- Single-Pole 20A
- 3-Way & 4-Way (multi-location)
- LED Dimmer 600W (forward phase)
- Occupancy Sensor (Title 24, ASHRAE 90.1)
- Timer Switch (7-day programmable)

#### **Lighting Fixtures** (6 assemblies)
- 2x4 & 2x2 LED Troffers (drop ceiling)
- LED High-Bay (warehouses 150-240W)
- 6" LED Downlight (recessed)
- LED Emergency Light (battery backup)
- LED Exit Sign (NEC 700)

#### **Motor Control & Industrial** (4 assemblies)
- Motor Starter 3HP (230V, NEMA 1)
- Motor Starter 10HP (480V, NEMA 2)
- VFD 5HP (480V with bypass)
- Lighting Contactor 30A (277V coil)

#### **HVAC & Mechanical** (3 assemblies)
- RTU Rooftop Unit Whip (60A, NEMA 3R, 10' SEOW)
- AC Condenser Disconnect (60A fused)
- Exhaust Fan Control (timer switch)

#### **Exterior & Site Lighting** (4 assemblies)
- Parking Lot Pole Light (photocell)
- Landscape Bollard Light
- Exterior Sign Outlet (timer + photocell)
- EV Charging Station Level 2 (40A, 208/240V)

#### **Low Voltage / AV** (4 assemblies)
- Ceiling Projector Outlet (power + HDMI + CAT6)
- Recessed TV Outlet (behind flat panels)
- 70V Distributed Audio Speaker
- Floor Monument (conference room power/data)

#### **Junction Boxes & Pull Boxes** (6 assemblies)
- 4" Square J-Box (standard splicing)
- 4-11/16" Square J-Box (multi-circuit)
- 8x8x4 Pull Box (NEC 314.28)
- 12x12x6 Pull Box (service entrance)
- Wiremold Surface Raceway (per 10 ft)
- PVC J-Box 4x4 NEMA 4X (outdoor/wet)

#### **Data/Communications** (5 assemblies)
- CAT6 Data Jack (1Gbps)
- CAT6A Data Jack (10Gbps shielded)
- Fiber Optic Jack (SC/LC)
- AV Combo Plate (HDMI + CAT6 + audio)
- Coax Jack RG6 (cable TV, CCTV)

#### **Panels & Distribution** (4 assemblies)
- 42-Circuit 225A Panel (commercial/TI)
- 24-Circuit 100A Subpanel
- 60A Non-Fused Disconnect (NEMA 1)
- 100A Fused Disconnect (NEMA 3R, Class J)

#### **Breakers** (5 assemblies)
- 1-Pole 20A (120V branch circuits)
- 2-Pole 30A (240V HVAC)
- 3-Pole 100A (208V feeders)
- GFCI 2-Pole 20A (outdoor equipment)
- AFCI 1-Pole 15A (bedrooms per NEC 210.12)

#### **Grounding & Bonding** (2 assemblies)
- Ground Rod 8 ft (driven with clamp)
- Ufer Ground Connection (rebar, NEC 250.52)

#### **Emergency Power** (2 assemblies)
- Generator Inlet Box 50A (NEMA 14-50)
- Manual Transfer Switch 30A (10-circuit)

#### **Fire Alarm / Life Safety** (3 assemblies)
- Addressable Smoke Detector
- Manual Pull Station
- Horn/Strobe (24VDC, ADA)

#### **Security Systems** (4 assemblies)
- IP Security Camera (POE)
- Card Reader (proximity, HID)
- Magnetic Door Lock (1200 lb)
- Door Contact (magnetic switch)

#### **Healthcare Specific** (3 assemblies)
- Hospital Grade IG Receptacle (green dot, UL 1363)
- Patient Care Vicinity Receptacle (red, emergency circuit)
- Nurse Call Station (audio/visual with pull cord)

#### **Energy Management** (2 assemblies)
- Ceiling Occupancy Sensor (360°, high-bay)
- Daylight Harvesting Sensor (0-10V dimming)

**All assemblies include:**
- 4" square boxes, mud rings, devices, plates
- EMT connectors (appropriate size 1/2" - 1-1/4")
- EMT couplings (0.1 per device = 1 per 10' stick)
- Grounding components (pigtails, bushings)
- Wire nuts, mounting hardware
- Industry-standard waste factors (2% devices, 5% fittings, 0% panels)

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
