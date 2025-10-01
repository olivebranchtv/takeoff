# Customer-Supplied Fixtures Guide

## Overview
When customers supply their own lighting fixtures (like AutoZone supplying fixtures), you still need to calculate labor costs for installation even though the material cost is $0.

## How to Add Customer-Supplied Fixtures

### Method 1: Add to Database (Recommended)

1. **Open Settings** (⚙️ button in top right)

2. **Export Current Database**
   - Click "Export Database"
   - Opens Excel file with all pricing

3. **Add New Row in Excel**
   - **Item Code**: (Optional) Unique code like "D-LIGHT"
   - **Category**: "Lighting Fixtures" or "Devices"
   - **Description**: "D Lights D" (or fixture name)
   - **Unit**: "EA" (each)
   - **Material Cost**: `0` (customer supplies)
   - **Labor Hours**: `1.5` (typical installation time)
   - **Vendor**: "Customer Supplied"
   - **Notes**: "AutoZone provided fixture"

4. **Save Excel File**

5. **Import Back to Database**
   - In Settings, click "Import Database"
   - Select your edited Excel file
   - System will update pricing database

### Method 2: Automatic Fallback (Already Working)

The system has built-in fallback labor rates for fixtures:
- Any item with "light" or "fixture" in the name automatically gets:
  - Material Cost: $0
  - Labor Hours: 1.5 hours

So even if "D Lights D" isn't in the database, it will still calculate labor!

## Typical Labor Hours for Fixtures

| Fixture Type | Labor Hours | Notes |
|--------------|-------------|-------|
| Standard Fixture | 1.5 hrs | Basic ceiling mount |
| Troffer (2x4) | 2.0 hrs | Drop ceiling installation |
| High Bay | 2.5 hrs | Requires lift equipment |
| Wall Pack | 1.5 hrs | Exterior wall mount |
| Exit/Emergency | 1.0 hrs | Simple wall mount |
| Downlight | 0.75 hrs | Quick recessed can |
| Canopy | 1.5 hrs | Exterior canopy mount |

## Example Bid Calculation

**Project: AutoZone - 20 D Lights D (Customer Supplied)**

### Materials Cost
- 20 fixtures × $0 = **$0** (customer supplied)

### Labor Cost
- 20 fixtures × 1.5 hrs = **30 labor hours**
- 30 hrs × $30/hr = **$900 labor cost**

### Result
- Even though fixtures are free, you still bid $900 for installation labor
- Plus overhead (10%) = $90
- Plus profit (10%) = $99
- **Total Bid: $1,089**

## Updating Existing Items

If you already added "D Lights D" without labor hours:

1. Export database from Settings
2. Find "D Lights D" row in Excel
3. Change **Labor Hours** column from `0` to `1.5`
4. Save file
5. Re-import to Settings

The system will now calculate labor for that fixture on all future bids!

## Troubleshooting

**Problem**: Fixture shows $0 labor in bid
- **Solution**: Check that labor hours are set in database OR that fixture name includes "light" or "fixture"

**Problem**: Can't find my fixture in database
- **Solution**: Export database, search Excel for the description, or add as new row

**Problem**: Labor hours seem wrong
- **Solution**: Adjust hours based on your actual installation time (1.5 hrs is average)

## Quick Reference

✅ **Always Set for Customer Fixtures:**
- Material Cost: $0
- Labor Hours: 1.5-2.0 (actual installation time)
- Category: "Lighting Fixtures"
- Vendor: "Customer Supplied"

⚠️ **Common Mistake:**
- Forgetting to set labor hours = $0 labor in bid = losing money!

💡 **Pro Tip:**
- Create a "Customer Supplied" category in your database
- Pre-load common customer fixture types with standard labor hours
- Update labor hours based on your crew's actual performance
