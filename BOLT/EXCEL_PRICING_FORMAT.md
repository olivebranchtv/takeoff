# Excel Pricing File Format Guide

## 📋 How to Format Your Pricing Excel File

The pricing system can automatically load material costs from an Excel file. Follow this format:

---

## Required Columns

Your Excel file should have these columns (column names are case-insensitive):

| Column Name | Aliases | Required | Example |
|------------|---------|----------|---------|
| **Category** | Division, Type, GROUP | Recommended | "Boxes", "Devices", "Wire & Cable" |
| **Description** | Item, Material, DESCRIPTION | **YES** | "4" Square Box, 2-1/8" deep" |
| **Unit** | UOM, U/M | Recommended | "EA", "FT", "PKG" |
| **Cost** | Price, Unit Cost, $ | **YES** | 2.45 |
| Vendor | Supplier | Optional | "Graybar" |
| Part Number | Part #, SKU, Item # | Optional | "RSR-52151-K" |

---

## Example Excel Format

### Sheet 1: Material Pricing

```
Category          | Description                        | Unit | Cost  | Vendor  | Part Number
------------------|---------------------------------------|------|-------|---------|-------------
Boxes             | 4" Square Box, 2-1/8" deep            | EA   | 2.45  | Graybar | RSR-52151-K
Boxes             | 4-11/16" Square Box, 2-1/8" deep      | EA   | 3.15  | Graybar | RSR-52171-K
Boxes             | Single Gang Box, Metal                | EA   | 1.85  | Graybar | RSR-8371
Devices           | Receptacle, 20A, 125V, Duplex, White  | EA   | 3.75  | Graybar | CR20W
Devices           | Receptacle, GFCI, 20A, White          | EA   | 18.50 | Graybar | GFCI20W
Devices           | Switch, Single-Pole, 20A, White       | EA   | 2.25  | Graybar | CS120W
Devices           | Switch, 3-Way, 20A, White             | EA   | 3.15  | Graybar | CS320W
Devices           | Dimmer Switch, 600W, White            | EA   | 24.75 | Graybar | DV600PW
Fittings          | EMT Connector, 1/2", Steel            | EA   | 0.65  | Graybar | 100
Fittings          | EMT Connector, 3/4", Steel            | EA   | 0.85  | Graybar | 101
Fittings          | EMT Coupling, 1/2", Steel             | EA   | 0.55  | Graybar | 105
Wire & Cable      | #12 THHN CU, 600V, Stranded          | FT   | 0.35  | Graybar | THHN12STR
Wire & Cable      | #10 THHN CU, 600V, Stranded          | FT   | 0.58  | Graybar | THHN10STR
Wire & Cable      | #8 THHN CU, 600V, Stranded           | FT   | 0.95  | Graybar | THHN8STR
Conduit           | EMT, 1/2", 10' Stick                 | FT   | 0.42  | Graybar | EMT12-10
Conduit           | EMT, 3/4", 10' Stick                 | FT   | 0.58  | Graybar | EMT34-10
Conduit           | EMT, 1", 10' Stick                   | FT   | 0.85  | Graybar | EMT1-10
Panels            | Load Center, 42-Circuit, 225A MLO    | EA   | 385.00| Graybar | PL4242B225
Panels            | Load Center, 24-Circuit, 100A MLO    | EA   | 125.00| Graybar | PL2424B100
Breakers          | Breaker, 1-Pole, 20A, 120V          | EA   | 8.50  | Graybar | QP120
Breakers          | Breaker, 2-Pole, 30A, 240V          | EA   | 18.75 | Graybar | QP230
Breakers          | Breaker, 3-Pole, 100A, 240V         | EA   | 145.00| Graybar | QP3100
Lighting          | LED Troffer, 2x4, 50W, 5000K        | EA   | 75.50 | Graybar | LT2X450W50
Lighting          | LED Troffer, 2x2, 32W, 5000K        | EA   | 65.00 | Graybar | LT2X232W50
Lighting          | LED High-Bay, 150W, 5000K           | EA   | 185.00| Graybar | HB150W50
```

---

## Tips for Best Results

### 1. Match Assembly Material Descriptions
The system matches prices by **Category + Description**. Make sure your Excel descriptions match what's in the assemblies.

**Example:**
- If assembly uses: "4" Square Box, 2-1/8" deep"
- Excel should have: "4" Square Box, 2-1/8" deep" (exact match)

### 2. Use Consistent Categories
Group similar items together:
- **Boxes** - Junction boxes, device boxes, pull boxes
- **Devices** - Receptacles, switches, dimmers, sensors
- **Fittings** - Connectors, couplings, clamps, supports
- **Wire & Cable** - THHN, MC Cable, Romex
- **Conduit** - EMT, PVC, Rigid, Flex
- **Panels** - Load centers, panelboards, disconnects
- **Breakers** - Circuit breakers, GFCI, AFCI
- **Lighting** - Fixtures, troffers, high-bays, downlights
- **Data/Comm** - CAT6, CAT6A, fiber, coax
- **Fire Alarm** - Devices, wire, panels

### 3. Units of Measure
Use standard abbreviations:
- **EA** - Each (devices, boxes, fixtures)
- **FT** - Feet (wire, conduit)
- **PKG** - Package (wire nuts, staples)
- **BOX** - Box of items
- **C** - Per hundred (wire nuts in packs of 100)

### 4. Cost Precision
- Use decimal values: 2.45, not 2.450000
- Include cents: 0.35, not 0.3
- No dollar signs: 2.45, not $2.45

### 5. Skip Header Rows
The parser automatically detects and skips rows where:
- Description contains "description" or "item" (case-insensitive)
- Cost is 0 or empty
- Description is empty

---

## Common Column Name Variations

The system accepts these variations (case-insensitive):

### Category:
- Category
- category
- Division
- Type
- GROUP

### Description:
- Description
- description
- Item
- Material
- DESCRIPTION

### Unit:
- Unit
- unit
- UOM
- U/M

### Cost:
- Cost
- cost
- Price
- Unit Cost
- COST
- $

### Vendor:
- Vendor
- vendor
- Supplier

### Part Number:
- Part Number
- Part #
- SKU
- Item #

---

## How to Upload

1. **Open Pricing & Bidding Panel**
   - Click green "💰 Pricing & Bidding" button

2. **Click Upload Button**
   - Look for "📁 Upload Pricing Excel" button at top

3. **Select Your Excel File**
   - Choose your .xlsx or .xls file
   - System will parse automatically

4. **Confirmation**
   - You'll see: "✓ [Number] Material Prices Loaded"
   - Background turns green when loaded

5. **Costs Calculate Automatically**
   - Material costs now show real values
   - Total bid price updates instantly

---

## Example Pricing Database Structure

### Minimum Required Format:

```
Description                        | Cost
-----------------------------------|-------
4" Square Box, 2-1/8" deep         | 2.45
Receptacle, 20A, 125V, Duplex      | 3.75
Single-Pole Switch, 20A            | 2.25
#12 THHN CU                        | 0.35
EMT, 1/2"                          | 0.42
```

### Recommended Full Format:

```
Category    | Description                        | Unit | Cost  | Vendor  | Part Number
------------|---------------------------------------|------|-------|---------|-------------
Boxes       | 4" Square Box, 2-1/8" deep            | EA   | 2.45  | Graybar | RSR-52151-K
Devices     | Receptacle, 20A, 125V, Duplex         | EA   | 3.75  | Graybar | CR20W
Devices     | Single-Pole Switch, 20A               | EA   | 2.25  | Graybar | CS120W
Wire & Cable| #12 THHN CU, 600V                     | FT   | 0.35  | Graybar | THHN12STR
Conduit     | EMT, 1/2", 10' Stick                  | FT   | 0.42  | Graybar | EMT12-10
```

---

## Troubleshooting

### "Failed to load pricing file"
- **Check:** Is it a valid Excel file (.xlsx or .xls)?
- **Check:** Does it have at least Description and Cost columns?
- **Try:** Open in Excel and re-save as .xlsx

### "Loaded 0 material prices"
- **Check:** Are there any rows with costs > 0?
- **Check:** Is Description column filled out?
- **Check:** Are column names spelled correctly?

### "Material costs still showing $0"
- **Check:** Do descriptions match exactly between Excel and assemblies?
- **Try:** Add Category column to help matching
- **Try:** Check for extra spaces or punctuation

### Prices don't match some materials
- **Check:** Description spelling and punctuation must match exactly
- **Example:** "1/2" EMT" ≠ "1/2 inch EMT" ≠ "EMT 1/2""
- **Solution:** Copy exact descriptions from BOM export

---

## Best Practice Workflow

### Step 1: Do Your Takeoff
1. Complete takeoff in the app
2. Assign all assemblies to tags

### Step 2: Export BOM
1. Click "Export Excel (Full BOM)"
2. Review material list

### Step 3: Get Vendor Quotes
1. Send BOM to vendors (Graybar, Rexel, CED)
2. Request pricing in Excel format

### Step 4: Prepare Pricing File
1. Copy vendor pricing into Excel
2. Ensure columns: Category, Description, Unit, Cost
3. Match descriptions to your BOM exactly
4. Save as .xlsx

### Step 5: Upload and Calculate
1. Open Pricing & Bidding panel
2. Upload pricing Excel
3. System calculates costs automatically
4. Adjust overhead and profit
5. Export bid summary

---

## Sample Pricing Excel Template

Want to create your own? Here's a blank template:

```
Category | Description | Unit | Cost | Vendor | Part Number
---------|-------------|------|------|--------|-------------
         |             |      |      |        |
         |             |      |      |        |
         |             |      |      |        |
```

Copy this structure and fill in your materials and costs!

---

## Advanced: Multiple Vendors

You can load pricing from multiple vendors and manually select best prices:

**Option A: Separate Files**
- Load Graybar pricing first
- Export bid summary
- Load Rexel pricing
- Compare totals

**Option B: Combined File**
- Include Vendor column
- Load all at once
- System uses last price loaded per item

**Future Enhancement:**
Multi-vendor comparison with automatic best-price selection.

---

## Questions?

If you have issues loading your pricing file:
1. Check the format matches examples above
2. Ensure at least Description and Cost columns exist
3. Verify costs are numbers, not text
4. Try re-saving as .xlsx from Excel

**The system is flexible and will attempt to parse various column name variations!**
