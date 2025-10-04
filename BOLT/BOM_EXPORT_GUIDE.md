# Professional BOM Excel Export Guide

## Overview

The Excel BOM export has been completely redesigned to meet professional electrical estimating industry standards. The export now follows CSI MasterFormat organization and includes comprehensive material breakdowns with waste factors.

## What Changed

### Before
- Mixed data across 12+ sheets
- No clear organization
- Hardcoded assumptions
- Duplicate data
- No proper assembly breakdown
- No waste factor tracking

### After
Professional 7-sheet workbook organized by industry standards:

## Excel Workbook Structure

### Sheet 1: Cover Sheet
- Project identification
- Drawing set information
- Date stamped
- Scope of work statement
- List of exclusions (permits, engineering, trenching, etc.)
- Notes and assumptions
- Waste factor table

### Sheet 2: Summary by Category
- CSI Division 26 0000 - Electrical
- Organized by category:
  - Lighting
  - Receptacles
  - Switches
  - Data/Communications
  - Panels & Distribution
  - Fire Alarm
  - Security
  - Special Systems
  - Conduit/Raceway totals
  - Wire & Cable totals

### Sheet 3: Bill of Materials
**Complete material list sorted by category**
- Category
- Description
- Unit (EA, FT, etc.)
- Base Qty (before waste)
- Waste Factor (1.02, 1.05, 1.10, etc.)
- Total Qty (with waste applied)
- Notes

This is the master material list for procurement with all assemblies expanded.

### Sheet 4: Assembly Breakdown
**Shows which assemblies were used and their component expansion**
- Assembly header rows showing:
  - Assembly Code (e.g., RECEP-20A)
  - Assembly Name
  - Description
  - Quantity Used
- Material detail rows for each assembly showing:
  - Category
  - Material Description
  - Unit
  - Qty Per assembly
  - Total Qty
  - Waste Factor

This sheet allows verification of assembly calculations.

### Sheet 5: Device Counts
**Summary of all devices from takeoff**
- Tag Code (e.g., R1, L1, S1)
- Tag Name (description)
- Category
- Quantity
- Assembly used (if assigned)

Clean summary for device schedules.

### Sheet 6: Conduit & Wire Summary
**Summary of all homerun measurements**
- Homerun tag (e.g., B-1, B-2)
- Description
- Category
- EMT Size (1/2", 3/4", 1", etc.)
- Number of Runs
- Total Raceway LF (with extra per point)
- Total Conductor LF (all wires summed)
- Total Boxes (pull boxes, J-boxes)

### Sheet 7: Takeoff Detail
**Itemized measurements (audit trail)**
- ID (e.g., R1-1, R1-2 for multiple instances)
- Tag
- Description
- Category
- Type (count/segment/polyline/freeform)
- Page number
- For measurements:
  - EMT Size
  - Points (vertices)
  - Geometry LF (raw measurement)
  - Raceway LF (with extra per point)
  - Wire 1, Wire 2, Wire 3 (formatted as "3 #12 THHN CU")
  - Conductor LF (total across all wires)
  - Boxes
- Notes

## Key Features

### Waste Factors Applied
- **Devices**: 2% (1.02)
- **Boxes**: 2% (1.02)
- **Fittings**: 5% (1.05)
- **Wire**: 10% (1.10)
- **Panels/Gear**: 0% (1.00) - ordered exact

### Assembly Expansion
When you assign an assembly to a tag (e.g., RECEP-20A to tag R1), the system:
1. Finds all instances of that tag
2. Multiplies assembly items by the count
3. Applies waste factors
4. Consolidates materials in BOM sheet
5. Shows breakdown in Assembly sheet

**Example**:
- Tag R1 = 15 devices
- Assembly RECEP-20A contains:
  - 1× 4" Square Box (waste 1.02)
  - 1× Mud Ring (waste 1.02)
  - 1× 20A Receptacle (waste 1.02)
  - 1× SS Plate (waste 1.02)
  - 2× EMT Connector (waste 1.05)
  - 0.1× EMT Coupling (waste 1.05)
  - 1× Ground Pigtail (waste 1.02)

**Result in BOM**:
- 4" Square Boxes: 15 × 1 × 1.02 = 15.30 EA
- EMT Connectors 3/4": 15 × 2 × 1.05 = 31.50 EA
- EMT Couplings 3/4": 15 × 0.1 × 1.05 = 1.58 EA

### No More Duplicate Panels
The old export had hardcoded panel data that created duplicates. The new system:
- Only exports devices that exist in your takeoff
- Only exports assemblies that are assigned to tags
- No hardcoded assumptions or placeholders
- Clean, accurate material lists

## Usage

In the application, click **File → Export → Full BOM Excel**

The export will create a file named:
`{Project Name}.xlsx`

For example:
- `Tenant Improvement - Suite 200.xlsx`
- `Office Building - 2nd Floor.xlsx`

## Column Widths
All sheets have properly sized columns for readability:
- Descriptions: 35-50 characters wide
- Categories: 20-25 characters
- Quantities: 10-12 characters
- Notes: 30+ characters

## Professional Format
- Numbers are actual numbers (not text) for Excel calculations
- Dates are proper date format
- Consistent decimal places (2 for quantities)
- No blank/missing data (shows as empty or 0)
- Sorted alphabetically by category/code

## Verification
Use these checks to verify your BOM:
1. **Cover Sheet** - Confirm project name and drawing set
2. **Summary** - Verify total device counts make sense
3. **Bill of Materials** - Scan for unexpected items
4. **Assembly Breakdown** - Verify assembly math (Qty Used × Qty Per = Total)
5. **Device Counts** - Match your plan takeoff counts
6. **Conduit & Wire** - Verify raceway lengths
7. **Takeoff Detail** - Audit trail for specific items

## Tips

### Finding Specific Materials
Use Excel's Find (Ctrl+F) to search across all sheets:
- Search "4 square box" to find all box entries
- Search "EMT" to find all conduit
- Search "#12" to find wire sizes

### Filtering Device Counts
Use Excel's AutoFilter on Sheet 5 (Device Counts):
- Filter by Category to see only "Lighting" or "Receptacles"
- Filter by Assembly to see what uses RECEP-20A

### Summing Quantities
All quantity columns can be summed with Excel SUM() formula
Example: `=SUM(F2:F100)` to total the Total Qty column

### Custom Reports
Copy specific sheets to a new workbook for:
- Vendor quotes (just BOM sheet)
- Field verification (just Device Counts)
- Internal review (just Takeoff Detail)

## Industry Standards Met
- ✅ CSI MasterFormat organization (Division 26)
- ✅ Waste factors per NEC recommendations
- ✅ Clear scope/exclusions statement
- ✅ Audit trail with itemized detail
- ✅ Assembly breakdown for verification
- ✅ Consolidated material list for procurement
- ✅ Professional formatting and organization

## Compatibility
Works with:
- Accubid import (use BOM sheet)
- Trimble (use Device Counts + BOM)
- ConEst (use Takeoff Detail)
- Excel 2016+
- Google Sheets (import .xlsx)

---

**Export Date Format**: MM/DD/YYYY
**Decimal Places**: 2 (except for fractional items like 0.1 couplings)
**Units**: EA (each), FT (feet), PKG (package), SET
